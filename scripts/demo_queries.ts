import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
const docClient = DynamoDBDocumentClient.from(client)

const envName = process.env.PEBBLE_ENV === 'prod' ? 'prod' : 'dev'
const TABLE_NAME = `pebble-events-rollup-${envName}`

async function main() {
    console.log(`\n🔍 Scanning recent high-value events in ${TABLE_NAME}...`)

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.error('❌ Missing AWS Credentials in .env.local')
        process.exit(1)
    }

    try {
        const response = await docClient.send(new ScanCommand({
            TableName: TABLE_NAME,
            Limit: 10,
        }))

        if (!response.Items || response.Items.length === 0) {
            console.log('📭 No events found yet.')
            return
        }

        console.log(`\n✅ Found ${response.Items.length} recent events:\n`)

        // Sort by timestamp descending
        const sorted = response.Items.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )

        sorted.forEach((item, index) => {
            console.log(`${index + 1}. [${item.timestamp}] ${item.eventName}`)
            console.log(`   Page: ${item.page} | Env: ${item.buildEnv} | Lang: ${item.language || 'N/A'}`)

            if (item.eventName === 'run.completed') {
                console.log(`   Success: ${item.success} | Time: ${item.runtimeMs}ms`)
            } else if (item.eventName === 'submit.completed') {
                console.log(`   Accepted: ${item.accepted} | Time: ${item.runtimeMs}ms`)
            } else if (item.eventName === 'pebble_chat.response_received') {
                console.log(`   Type: ${item.messageType}`)
            }
            console.log('---')
        })

    } catch (err: any) {
        console.error('\n❌ Failed to query DynamoDB:')
        console.error(err.message)
        console.log('\nMake sure you have deployed the CDK stack first (npm run deploy in /infra)')
    }
}

main()
