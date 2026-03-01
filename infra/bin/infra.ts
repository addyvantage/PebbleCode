#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { BackendStack } from "../lib/backend-stack";
import { HostingStack } from "../lib/hosting-stack";
import { PipelineStack } from "../lib/pipeline-stack";

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
