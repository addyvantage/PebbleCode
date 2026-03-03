import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'

export class PebblePhase7FilesStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const isProd = process.env.PEBBLE_ENV === 'prod'
        const envName = isProd ? 'prod' : 'dev'

        // ── 1. S3: Session Reports Bucket ────────────────────────────────────────
        const reportsBucket = new s3.Bucket(this, 'SessionReportsBucket', {
            bucketName: `pebble-session-reports-${this.account}-${envName}`,
            removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: !isProd,
            lifecycleRules: [
                // Expire reports after 30 days to keep costs down
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

        // ── 2. DynamoDB: Session Snapshots Table ──────────────────────────────────
        const snapshotsTable = new dynamodb.Table(this, 'SessionSnapshotsTable', {
            tableName: `pebble-session-snapshots-${envName}`,
            partitionKey: { name: 'snapshotId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            timeToLiveAttribute: 'ttl', // snapshots expire in 7 days
        })

        // ── Outputs ───────────────────────────────────────────────────────────────
        new cdk.CfnOutput(this, 'ReportsBucketName', {
            value: reportsBucket.bucketName,
            exportName: `ReportsBucketName-${envName}`,
        })
        new cdk.CfnOutput(this, 'SnapshotsTableName', {
            value: snapshotsTable.tableName,
            exportName: `SnapshotsTableName-${envName}`,
        })
    }
}
