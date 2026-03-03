import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources'
import { join } from 'path'

export class PebblePhase4Stack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const isProd = process.env.PEBBLE_ENV === 'prod'
        const envName = isProd ? 'prod' : 'dev'

        // 1. AppSync GraphQL API
        const api = new appsync.GraphqlApi(this, 'PebbleLiveApi', {
            name: `pebble-live-api-${envName}`,
            schema: appsync.SchemaFile.fromAsset(join(__dirname, '../schema/mentalState.graphql')),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: appsync.AuthorizationType.API_KEY,
                    apiKeyConfig: {
                        expires: cdk.Expiration.after(cdk.Duration.days(365)),
                    },
                },
                additionalAuthorizationModes: [
                    {
                        authorizationType: appsync.AuthorizationType.IAM,
                    },
                ],
            },
            logConfig: {
                fieldLogLevel: appsync.FieldLogLevel.ALL,
            },
        })

        // Local None data source for pub/sub
        const noneDataSource = api.addNoneDataSource('PubSubDataSource')
        noneDataSource.createResolver('PublishResolver', {
            typeName: 'Mutation',
            fieldName: 'publishMentalStateUpdate',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2018-05-29",
          "payload": $util.toJson($context.arguments)
        }
      `),
            responseMappingTemplate: appsync.MappingTemplate.fromString(`
        $util.toJson($context.result)
      `),
        })

        // Dummy query resolver needed by AppSync
        noneDataSource.createResolver('QueryResolver', {
            typeName: 'Query',
            fieldName: 'getCurrentState',
            requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2018-05-29",
          "payload": null
        }
      `),
            responseMappingTemplate: appsync.MappingTemplate.fromString(`
        null
      `),
        })

        // 2. DynamoDB Table for Live State (with Streams enabled)
        const mentalStateTable = new dynamodb.Table(this, 'PebbleLiveMentalState', {
            tableName: `pebble-live-mental-state-${envName}`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            stream: dynamodb.StreamViewType.NEW_IMAGE,
            removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            timeToLiveAttribute: 'ttl',
        })

        // 3. Lambda: Evaluate/Update Mental State (triggered by EventBridge)
        const updateMentalStateLambda = new nodejs.NodejsFunction(this, 'UpdateMentalStateLambda', {
            functionName: `pebble-update-mental-state-${envName}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: join(__dirname, '../lambda/updateMentalState.ts'),
            handler: 'handler',
            environment: {
                TABLE_NAME: mentalStateTable.tableName,
            },
        })
        mentalStateTable.grantWriteData(updateMentalStateLambda)

        const eventBus = events.EventBus.fromEventBusName(this, 'PebbleEventBus', `pebble-events-${envName}`)
        new events.Rule(this, 'RunSubmitCompletedRule', {
            eventBus,
            eventPattern: {
                detailType: ['pebble-event'],
                detail: {
                    eventName: ['run.completed', 'submit.completed'],
                },
            },
            targets: [new targets.LambdaFunction(updateMentalStateLambda)],
        })

        // 4. Lambda: Publish to AppSync (triggered by DDB Stream)
        const publishLambda = new nodejs.NodejsFunction(this, 'PublishToAppSyncLambda', {
            functionName: `pebble-publish-appsync-${envName}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: join(__dirname, '../lambda/publishMentalStateToAppSync.ts'),
            handler: 'handler',
            environment: {
                APPSYNC_ENDPOINT: api.graphqlUrl,
                REGION: cdk.Stack.of(this).region,
            },
        })

        api.grantMutation(publishLambda, 'publishMentalStateUpdate')

        publishLambda.addEventSource(new lambdaEventSources.DynamoEventSource(mentalStateTable, {
            startingPosition: lambda.StartingPosition.TRIM_HORIZON,
            batchSize: 5,
            bisectBatchOnError: true,
            retryAttempts: 3,
        }))

        // Outputs for the frontend
        new cdk.CfnOutput(this, 'AppSyncGraphqlUrl', {
            value: api.graphqlUrl,
            exportName: `AppSyncGraphqlUrl-${envName}`,
        })
        if (api.apiKey) {
            new cdk.CfnOutput(this, 'AppSyncApiKey', {
                value: api.apiKey,
                exportName: `AppSyncApiKey-${envName}`,
            })
        }
    }
}
