import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'

const sfnClient = new SFNClient({})
const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}))

const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN!
const TABLE_NAME = process.env.TABLE_NAME!

export const handler = async (event: any) => {
    const detail = event.detail
    if (!detail) return { statusCode: 400 }

    const userId = detail.userId || detail.sessionId || 'anonymous'

    // Peek current phase to pass as context to the execution
    let currentPhase = 'START_SESSION'
    try {
        const res = await ddbClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { userId, journeyId: 'default' },
        }))
        if (res.Item?.currentPhase) currentPhase = res.Item.currentPhase
    } catch { /* silently continue */ }

    const input = {
        userId,
        journeyId: 'default',
        problemId: detail.problemId ?? null,
        recoveryTimeMs: detail.runtimeMs ?? 120000,
        struggleScore: 50, // will be replaced by real struggle engine data when available
        autonomyScore: 60,
        currentPhase,
    }

    try {
        await sfnClient.send(new StartExecutionCommand({
            stateMachineArn: STATE_MACHINE_ARN,
            name: `journey-${userId}-${Date.now()}-${randomUUID().slice(0, 8)}`,
            input: JSON.stringify(input),
        }))
        return { statusCode: 200 }
    } catch (err) {
        console.error('[journey-advance] Failed to start SF execution:', err)
        return { statusCode: 500 }
    }
}
