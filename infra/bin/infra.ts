#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { BackendStack } from "../lib/backend-stack";
import { HostingStack } from "../lib/hosting-stack";
import { PipelineStack } from "../lib/pipeline-stack";
import { PebblePhase4Stack } from "../lib/pebble-phase4-stack";
import { PebblePhase5AnalyticsStack } from "../lib/pebble-phase5-analytics-stack";
import { PebblePhase6JourneysStack } from "../lib/pebble-phase6-journeys-stack";
import { PebblePhase7FilesStack } from "../lib/pebble-phase7-files-stack";
import { PebblePhase8ObservabilityStack } from "../lib/pebble-phase8-observability-stack";
import { PebblePhase9PremiumStack } from "../lib/pebble-phase9-premium-stack";

const app = new cdk.App();

// Resolve account + region from the environment (set by AWS CLI / CDK_DEFAULT_* env vars).
const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// ── Stack 1: Backend (Lambda + API Gateway) ────────────────────────────────────
//
// Always deployed — no extra context required.
// Exports apiDomain so HostingStack can wire CloudFront → API Gateway.
const backendStack = new BackendStack(app, "PebbleBackendStack", {
  env,
  description: "Pebble API backend — Lambda + API Gateway HTTP API",
});

// ── Stack 2: Hosting (S3 + CloudFront) ────────────────────────────────────────
//
// Wires /api/* CloudFront behavior to the API Gateway domain from BackendStack.
// Always deployed — no extra context required.
const hostingStack = new HostingStack(app, "PebbleHostingStack", {
  env,
  description: "Pebble frontend hosting — S3 (private) + CloudFront with OAC",
  apiOriginDomain: backendStack.apiDomain,
});

// ── Phase 4: Live Mental Presence ───────────────────────────────────────────
new PebblePhase4Stack(app, "PebblePhase4Stack", {
  env,
  description: "Phase 4 AppSync Live API + Streams + Lambdas",
});

// ── Phase 5: Cohort Analytics (Athena + S3 + Glue) ────────────────────────
new PebblePhase5AnalyticsStack(app, "PebblePhase5AnalyticsStack", {
  env,
  description: "Phase 5 S3 Event Lake + Glue Catalog + Athena Named Queries",
});

// ── Phase 6: Orchestrated Learning Journeys ────────────────────────────
new PebblePhase6JourneysStack(app, "PebblePhase6JourneysStack", {
  env,
  description: "Phase 6 Step Functions Learning Journeys + DynamoDB",
});

// ── Phase 7: PDF Reports + Session Snapshots ───────────────────────────
new PebblePhase7FilesStack(app, "PebblePhase7FilesStack", {
  env,
  description: "Phase 7 S3 PDF Reports + DynamoDB Session Snapshots",
});

// ── Phase 8: Observability (CloudWatch + X-Ray) ────────────────────────
new PebblePhase8ObservabilityStack(app, "PebblePhase8ObservabilityStack", {
  env,
  description: "Phase 8 CloudWatch Log Group + X-Ray IAM Policy",
});

// ── Phase 9: Premium Demo — SageMaker + Polly ──────────────────────────
new PebblePhase9PremiumStack(app, "PebblePhase9PremiumStack", {
  env,
  description: "Phase 9 SageMaker Streak Risk Predictor + Polly Weekly Recap Narrator",
});

// ── Stack 3: CI/CD pipeline (CodePipeline + CodeBuild) ────────────────────────
//
// Only synthesized when codestarConnectionArn is provided via --context.
// Omitting the ARN is fine — BackendStack + HostingStack deploy independently.
//
// Required context (pass via --context or add to cdk.json):
//   codestarConnectionArn  — ARN of a CodeStar Connection (GitHub App).
//                            Create one in: AWS Console → Developer Tools → Connections.
//                            The connection must be set to AVAILABLE before the first run.
//
// Optional context (defaults defined in cdk.json):
//   githubOwner            — GitHub org or username          (default: addyvantage)
//   githubRepo             — Repository name                 (default: pebble-prototype-dev)
//   githubBranch           — Branch that triggers deploys    (default: main)
//
// Example:
//   npx cdk deploy --all \
//     --context codestarConnectionArn=arn:aws:codestar-connections:ap-south-1:123456789012:connection/UUID

const codestarConnectionArn: string | undefined =
  app.node.tryGetContext("codestarConnectionArn");

if (codestarConnectionArn) {
  new PipelineStack(app, "PebblePipelineStack", {
    env,
    description: "Pebble CI/CD — CodePipeline auto-deploys main branch to CloudFront",

    // Pass the live L2 construct references — CDK handles cross-stack CF exports automatically.
    siteBucket: hostingStack.siteBucket,
    distribution: hostingStack.distribution,

    githubOwner: app.node.tryGetContext("githubOwner") ?? "addyvantage",
    githubRepo: app.node.tryGetContext("githubRepo") ?? "pebble-prototype-dev",
    githubBranch: app.node.tryGetContext("githubBranch") ?? "main",
    codestarConnectionArn,
  });
}
