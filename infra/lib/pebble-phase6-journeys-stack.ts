import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import * as events from 'aws-cdk-lib/aws-events'
import * as eventTargets from 'aws-cdk-lib/aws-events-targets'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import { join } from 'path'

export class PebblePhase6JourneysStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const isProd = process.env.PEBBLE_ENV === 'prod'
        const envName = isProd ? 'prod' : 'dev'

        // ── 1. DynamoDB: Learning Journeys ───────────────────────────────────────
        const journeysTable = new dynamodb.Table(this, 'LearningJourneysTable', {
            tableName: `pebble-learning-journeys-${envName}`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'journeyId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            timeToLiveAttribute: 'ttl',
        })

        // ── 2. Lambda: Journey Transition Handler ────────────────────────────────
        const journeyTransitionLambda = new nodejs.NodejsFunction(this, 'JourneyTransitionLambda', {
            functionName: `pebble-journey-transition-${envName}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: join(__dirname, '../lambda/journeyTransition.ts'),
            handler: 'handler',
            timeout: cdk.Duration.seconds(15),
            environment: {
                TABLE_NAME: journeysTable.tableName,
            },
        })
        journeysTable.grantReadWriteData(journeyTransitionLambda)

        // ── 3. Step Functions: PebbleLearningJourneyMachine ─────────────────────
        //
        // States: START_SESSION → WARM_UP → PRACTICE_BLOCK → CHALLENGE_PROBLEM
        //         → RECOVERY_PHASE → REFLECTION → COMPLETE
        //
        // The Lambda decides which state to advance to based on input metrics.
        // We use a single Lambda task node so the workflow is simple and fast.

        const transitionTask = new tasks.LambdaInvoke(this, 'EvaluateJourneyTransition', {
            lambdaFunction: journeyTransitionLambda,
            outputPath: '$.Payload',
        })

        const completeState = new sfn.Succeed(this, 'JourneyComplete', {
            comment: 'Learning journey session complete',
        })

        const journeyChoice = new sfn.Choice(this, 'IsJourneyDone')
            .when(sfn.Condition.stringEquals('$.currentPhase', 'COMPLETE'), completeState)
            .otherwise(new sfn.Succeed(this, 'PhaseAdvanced'))

        const stateMachineDef = transitionTask.next(journeyChoice)

        const journeyMachine = new sfn.StateMachine(this, 'PebbleLearningJourneyMachine', {
            stateMachineName: `PebbleLearningJourneyMachine-${envName}`,
            definitionBody: sfn.DefinitionBody.fromChainable(stateMachineDef),
            stateMachineType: sfn.StateMachineType.EXPRESS, // Fast, low-cost, event-driven
            tracingEnabled: true,
        })

        // ── 4. Lambda: Journey Advance (EventBridge → Step Functions) ────────────
        const journeyAdvanceLambda = new nodejs.NodejsFunction(this, 'JourneyAdvanceLambda', {
            functionName: `pebble-journey-advance-${envName}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: join(__dirname, '../lambda/journeyAdvance.ts'),
            handler: 'handler',
            timeout: cdk.Duration.seconds(10),
            environment: {
                STATE_MACHINE_ARN: journeyMachine.stateMachineArn,
                TABLE_NAME: journeysTable.tableName,
            },
        })

        journeyMachine.grantStartExecution(journeyAdvanceLambda)
        journeysTable.grantReadData(journeyAdvanceLambda)

        // ── 5. EventBridge: Trigger on session events ────────────────────────────
        const eventBus = events.EventBus.fromEventBusName(this, 'PebbleEventBus', `pebble-events-${envName}`)

        new events.Rule(this, 'JourneyAdvanceTriggerRule', {
            eventBus,
            eventPattern: {
                detailType: ['pebble-event'],
                detail: {
                    eventName: ['run.completed', 'submit.completed', 'pebble_chat.response_received'],
                },
            },
            targets: [new eventTargets.LambdaFunction(journeyAdvanceLambda)],
        })

        // ── Outputs ───────────────────────────────────────────────────────────────
        new cdk.CfnOutput(this, 'JourneysTableName', {
            value: journeysTable.tableName,
            exportName: `JourneysTableName-${envName}`,
        })
        new cdk.CfnOutput(this, 'JourneyMachineArn', {
            value: journeyMachine.stateMachineArn,
            exportName: `JourneyMachineArn-${envName}`,
        })
    }
}
