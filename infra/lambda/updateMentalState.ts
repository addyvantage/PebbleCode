import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)
const TABLE_NAME = process.env.TABLE_NAME!

export const handler = async (event: any) => {
    try {
        const detail = event.detail
        if (!detail) return { statusCode: 400, body: 'Missing detail' }

        const isRun = detail.eventName === 'run.completed'
        const isSubmit = detail.eventName === 'submit.completed'
        if (!isRun && !isSubmit) return { statusCode: 200, body: 'Ignored' }

        // Phase 4 Demo Logic: compute realistic live changes based on the user's latest action.
        const success = detail.success || detail.accepted
        const userId = detail.userId || detail.sessionId || 'anonymous'
        const timestamp = new Date().toISOString()

        // Base mental state adjustments
        let recoveryEffectiveness = 85.0
        let timeToRecover = 120.0
        let autonomyDelta = 0
        let guidanceRelianceDelta = 0
        let breakpointIncrement = 0
        let streakDelta = 0

        if (success) {
            recoveryEffectiveness = 92.5 + Math.random() * 5
            timeToRecover = 45.0 + Math.random() * 30
            autonomyDelta = 1.5
            guidanceRelianceDelta = -0.5
            if (isSubmit) streakDelta = 1
        } else {
            recoveryEffectiveness = 80.0 + Math.random() * 10
            timeToRecover = 150.0 + Math.random() * 60
            autonomyDelta = -0.5
            guidanceRelianceDelta = 0.2
            breakpointIncrement = isRun ? 1 : 2
        }

        const item = {
            userId,
            timestamp,
            recoveryEffectiveness: Math.round(recoveryEffectiveness * 10) / 10,
            timeToRecover: Math.round(timeToRecover * 10) / 10,
            autonomyDelta,
            guidanceRelianceDelta,
            breakpointIncrement,
            streakDelta,
            ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 1 day TTL
        }

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item
        }))

        return { statusCode: 200 }
    } catch (error) {
        console.error('Error updating mental state:', error)
        return { statusCode: 500 }
    }
}
