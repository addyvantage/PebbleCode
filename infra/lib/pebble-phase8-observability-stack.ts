import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as iam from 'aws-cdk-lib/aws-iam'

export class PebblePhase8ObservabilityStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const isProd = process.env.PEBBLE_ENV === 'prod'
        const envName = isProd ? 'prod' : 'dev'

        // ── 1. CloudWatch Log Group ───────────────────────────────────────────────
        const logGroup = new logs.LogGroup(this, 'PebbleOpsLogGroup', {
            logGroupName: `/pebble/ops-${envName}`,
            retention: isProd ? logs.RetentionDays.THREE_MONTHS : logs.RetentionDays.ONE_WEEK,
            removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        })

        // ── 2. IAM Policy for CloudWatch + X-Ray ─────────────────────────────────
        // This policy can be attached to any Lambda execution role in the stack.
        const observabilityPolicy = new iam.ManagedPolicy(this, 'PebbleObservabilityPolicy', {
            managedPolicyName: `pebble-observability-${envName}`,
            description: 'Allows Pebble Lambdas to write CloudWatch Logs and X-Ray traces',
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents',
                        'logs:DescribeLogStreams',
                    ],
                    resources: [logGroup.logGroupArn, `${logGroup.logGroupArn}:*`],
                }),
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'xray:PutTraceSegments',
                        'xray:PutTelemetryRecords',
                        'xray:GetSamplingRules',
                        'xray:GetSamplingTargets',
                    ],
                    resources: ['*'],
                }),
            ],
        })

        // ── Outputs ───────────────────────────────────────────────────────────────
        new cdk.CfnOutput(this, 'OpsLogGroupName', {
            value: logGroup.logGroupName,
            exportName: `OpsLogGroupName-${envName}`,
        })
        new cdk.CfnOutput(this, 'ObservabilityPolicyArn', {
            value: observabilityPolicy.managedPolicyArn,
            exportName: `ObservabilityPolicyArn-${envName}`,
        })
    }
}
