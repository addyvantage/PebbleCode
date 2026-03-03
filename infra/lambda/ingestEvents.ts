import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge'

const eventBridge = new EventBridgeClient({})
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME

export const handler = async (event: any) => {
    try {
        const payload = event.events;
        if (!payload || !Array.isArray(payload)) {
            console.warn("Invalid payload, expected array of events.");
            return { statusCode: 400 }
        }

        const entries = payload.map((evt: any) => ({
            EventBusName: EVENT_BUS_NAME,
            Source: 'com.pebble.client',
            DetailType: 'pebble-event',
            Detail: JSON.stringify({
                ...evt,
                serverIngestedAt: new Date().toISOString()
            }),
        }))

        // EventBridge limits PutEvents to 10 entries per API call.
        for (let i = 0; i < entries.length; i += 10) {
            const batch = entries.slice(i, i + 10)
            await eventBridge.send(new PutEventsCommand({ Entries: batch }))
        }

        return { statusCode: 200, body: 'Events ingested' }
    } catch (error) {
        console.error('Error ingesting events:', error)
        return { statusCode: 500 }
    }
}
