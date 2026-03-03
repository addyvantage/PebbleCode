import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'

/**
 * Phase 9: Premium AWS Demo Features
 *  - SageMaker Streak Risk Predictor (DynamoDB storage)
 *  - Polly Weekly Growth Ledger Narrator (DynamoDB + S3 audio)
 */
export class PebblePhase9PremiumStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const isProd = process.env.PEBBLE_ENV === 'prod'
        const envName = isProd ? 'prod' : 'dev'

        // ── 1. DynamoDB: Streak Risk Predictions ─────────────────────────────────
        const riskTable = new dynamodb.Table(this, 'RiskPredictionsTable', {
            tableName: `PebbleRiskPredictions-${envName}`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'weekStart', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            timeToLiveAttribute: 'ttl',  // predictions expire after 30 days
        })

        // ── 2. DynamoDB: Weekly Recap Metadata ───────────────────────────────────
        const recapsTable = new dynamodb.Table(this, 'WeeklyRecapsTable', {
            tableName: `PebbleWeeklyRecaps-${envName}`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'weekStart', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            timeToLiveAttribute: 'ttl',  // recaps expire after 30 days
        })

        // ── 3. S3: Weekly Recap Audio ─────────────────────────────────────────────
        const audioBucket = new s3.Bucket(this, 'RecapAudioBucket', {
            bucketName: `pebble-weekly-recaps-${this.account}-${envName}`,
            removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: !isProd,
            lifecycleRules: [
                // Audio files expire after 30 days to control costs
                { expiration: cdk.Duration.days(30) },
            ],
            cors: [
                {
                    allowedMethods: [s3.HttpMethods.GET],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                },
            ],
        })

        // ── Outputs ───────────────────────────────────────────────────────────────
        new cdk.CfnOutput(this, 'RiskPredictionsTableName', {
            value: riskTable.tableName,
            exportName: `RiskPredictionsTableName-${envName}`,
            description: 'DynamoDB table for SageMaker streak risk predictions',
        })

        new cdk.CfnOutput(this, 'WeeklyRecapsTableName', {
            value: recapsTable.tableName,
            exportName: `WeeklyRecapsTableName-${envName}`,
            description: 'DynamoDB table for Polly weekly recap metadata',
        })

        new cdk.CfnOutput(this, 'RecapAudioBucketName', {
            value: audioBucket.bucketName,
            exportName: `RecapAudioBucketName-${envName}`,
            description: 'S3 bucket for Polly-generated weekly recap MP3 files',
        })
    }
}
