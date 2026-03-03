import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as glue from 'aws-cdk-lib/aws-glue'
import * as athena from 'aws-cdk-lib/aws-athena'
import { join } from 'path'

export class PebblePhase5AnalyticsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const isProd = process.env.PEBBLE_ENV === 'prod'
        const envName = isProd ? 'prod' : 'dev'

        // 1. S3 Event Lake
        const eventLakeBucket = new s3.Bucket(this, 'PebbleEventLake', {
            bucketName: `pebble-event-lake-${this.account}-${envName}`,
            removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: !isProd,
            lifecycleRules: isProd ? [{ expiration: cdk.Duration.days(365) }] : [],
        })

        // 2. Lambda to Archive Events to S3
        const archiveEventsLambda = new nodejs.NodejsFunction(this, 'ArchiveEventsLambda', {
            functionName: `pebble-archive-events-${envName}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: join(__dirname, '../lambda/archiveEvents.ts'),
            handler: 'handler',
            environment: {
                BUCKET_NAME: eventLakeBucket.bucketName,
            },
            timeout: cdk.Duration.seconds(10), // Give it time for S3 put
            memorySize: 256,
        })

        eventLakeBucket.grantWrite(archiveEventsLambda)

        // Trigger on run.completed and submit.completed
        const eventBus = events.EventBus.fromEventBusName(this, 'PebbleEventBus', `pebble-events-${envName}`)
        new events.Rule(this, 'ArchiveAnalyticsEventsRule', {
            eventBus,
            eventPattern: {
                detailType: ['pebble-event'],
                detail: {
                    eventName: ['run.completed', 'submit.completed'],
                },
            },
            targets: [new targets.LambdaFunction(archiveEventsLambda)],
        })

        // 3. Glue Catalog (Database + Table)
        const databaseName = `pebble_analytics_${envName}`
        const tableName = `pebble_events`

        new glue.CfnDatabase(this, 'AnalyticsDatabase', {
            catalogId: this.account,
            databaseInput: {
                name: databaseName,
                description: 'Database for Pebble Phase 5 Cohort Analytics',
            },
        })

        // Create the external table pointing to S3 archive prefix
        new glue.CfnTable(this, 'AnalyticsEventsTable', {
            catalogId: this.account,
            databaseName: databaseName,
            tableInput: {
                name: tableName,
                tableType: 'EXTERNAL_TABLE',
                parameters: {
                    classification: 'json',
                },
                storageDescriptor: {
                    location: `s3://${eventLakeBucket.bucketName}/archive/`,
                    inputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
                    outputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
                    compressed: false,
                    serdeInfo: {
                        serializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
                    },
                    columns: [
                        { name: 'event_type', type: 'string' },
                        { name: 'timestamp', type: 'bigint' },
                        { name: 'problem_id', type: 'string' },
                        { name: 'language', type: 'string' },
                        { name: 'difficulty', type: 'string' },
                        { name: 'tier_used', type: 'string' },
                        { name: 'recovery_time_ms', type: 'int' },
                        { name: 'struggle_score', type: 'int' },
                        { name: 'user_hash', type: 'string' },
                    ],
                },
                partitionKeys: [
                    { name: 'year', type: 'string' },
                    { name: 'month', type: 'string' },
                    { name: 'day', type: 'string' },
                ],
            },
        })

        // 4. Athena Named Queries
        // Query A: Avg Recovery Time by Difficulty
        new athena.CfnNamedQuery(this, 'AvgRecoveryTimeQuery', {
            database: databaseName,
            name: `pebble_avg_recovery_by_difficulty_${envName}`,
            queryString: `
        SELECT difficulty, AVG(recovery_time_ms) as avg_recovery_time_ms
        FROM ${tableName}
        WHERE event_type = 'submit.completed'
        GROUP BY difficulty;
      `,
        })

        // Query B: Autonomy Rate by Language (T1/T2 out of all runs/submits)
        new athena.CfnNamedQuery(this, 'AutonomyRateQuery', {
            database: databaseName,
            name: `pebble_autonomy_rate_by_language_${envName}`,
            queryString: `
        SELECT language, 
               CAST(SUM(CASE WHEN tier_used IN ('T1', 'T2') THEN 1 ELSE 0 END) AS DOUBLE) 
               / COUNT(*) AS autonomy_rate_pct
        FROM ${tableName}
        GROUP BY language;
      `,
        })

        // Query C: Breakpoints per Skill Cohort (simulated by struggle_score > 50)
        new athena.CfnNamedQuery(this, 'BreakpointsQuery', {
            database: databaseName,
            name: `pebble_breakpoints_per_skill_${envName}`,
            queryString: `
        SELECT 
          CASE WHEN struggle_score > 70 THEN 'Beginner'
               WHEN struggle_score > 30 THEN 'Intermediate'
               ELSE 'Advanced' END AS skill_cohort,
          COUNT(*) as breakpoint_count
        FROM ${tableName}
        WHERE event_type = 'run.completed'
        GROUP BY 1;
      `,
        })

        // Outputs
        new cdk.CfnOutput(this, 'EventLakeBucketName', {
            value: eventLakeBucket.bucketName,
            exportName: `EventLakeBucketName-${envName}`,
        })
        new cdk.CfnOutput(this, 'AthenaDatabaseName', {
            value: databaseName,
            exportName: `AthenaDatabaseName-${envName}`,
        })
    }
}
