import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'

export class PebblePhase0Stack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const isProd = process.env.PEBBLE_ENV === 'prod'
        const envName = isProd ? 'prod' : 'dev'

        // 1. EventBridge Bus
        const eventBus = new events.EventBus(this, 'PebbleEventBus', {
            eventBusName: `pebble-events-${envName}`,
        })

        // 2. DynamoDB: High-Value Events Rollup
        const rollupTable = new dynamodb.Table(this, 'PebbleEventsRollupTable', {
            tableName: `pebble-events-rollup-${envName}`,
            partitionKey: { name: 'eventName', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        })

        // 3. DynamoDB: Feature Flags
        const flagsTable = new dynamodb.Table(this, 'PebbleFeatureFlagsTable', {
            tableName: `pebble-feature-flags-${envName}`,
            partitionKey: { name: 'flagName', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        })

        // Seed some initial flags (for demo purposes)
        // In a real app we might use Custom Resources to populate, but CDK doesn't natively map seed data cleanly without SDK calls.
        // So we'll trust the app handles missing flags gracefully, or they can be seeded via AWS CLI/console.

        // 4. Ingest Lambda
        const ingestLambda = new nodejs.NodejsFunction(this, 'IngestEventsLambda', {
            functionName: `pebble-ingest-events-${envName}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: 'lambda/ingestEvents.ts',
            handler: 'handler',
            environment: {
                EVENT_BUS_NAME: eventBus.eventBusName,
            },
        })

        // Grant Lambda permission to put events on the bus
        eventBus.grantPutEventsTo(ingestLambda)

        // 5. Rule: Route High-Value Events to DynamoDB
        // For Phase 0 hackathon, we skip the S3 cold storage and route right to DDB for fast reads.
        const highValueRule = new events.Rule(this, 'RouteHighValueToDynamoRule', {
            eventBus,
            eventPattern: {
                detailType: ['pebble-event'],
                detail: {
                    eventName: ['run.completed', 'submit.completed', 'pebble_chat.response_received'],
                },
            },
        })

        // Create a generic Target Lambda to do the dynamodb putItem (EventBridge targets DDB directly via API gateway sometimes, but a generic forwarder is easier in CDK locally)
        const ddbForwarderLambda = new nodejs.NodejsFunction(this, 'DdbForwarderLambda', {
            functionName: `pebble-ddb-forwarder-${envName}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: 'lambda/ddbForwarder.ts',
            handler: 'handler',
            environment: {
                TABLE_NAME: rollupTable.tableName,
            },
        })
        rollupTable.grantWriteData(ddbForwarderLambda)
        highValueRule.addTarget(new targets.LambdaFunction(ddbForwarderLambda))

        // Assign to Output for ENV configuration
        new cdk.CfnOutput(this, 'IngestLambdaName', { value: ingestLambda.functionName })
        new cdk.CfnOutput(this, 'RollupTableName', { value: rollupTable.tableName })
        new cdk.CfnOutput(this, 'FlagsTableName', { value: flagsTable.tableName })
    }
}
