import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)
const TABLE_NAME = process.env.TABLE_NAME

export const handler = async (event: any) => {
    try {
        // EventBridge passes the event body into detail
        const detail = event.detail
        if (!detail) return { statusCode: 400, body: 'Missing detail' }

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                eventName: detail.eventName,
                timestamp: detail.timestamp,
                sessionId: detail.sessionId,
                page: detail.page,
                problemId: detail.problemId,
                language: detail.language,
                buildEnv: detail.buildEnv,
                // High-value specifics
                success: detail.success ?? undefined,
                accepted: detail.accepted ?? undefined,
                runtimeMs: detail.runtimeMs ?? undefined,
                messageType: detail.messageType ?? undefined,
                serverIngestedAt: detail.serverIngestedAt,
                rawPayload: JSON.stringify(detail) // Keep a serialized copy for easy debugging
            }
        }))

        return { statusCode: 200 }
    } catch (error) {
        console.error('Error forwarding to DDB:', error)
        return { statusCode: 500 }
    }
}
