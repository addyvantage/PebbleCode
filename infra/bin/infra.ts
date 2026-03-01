#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { HostingStack } from "../lib/hosting-stack";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();

// Resolve account + region from the environment (set by AWS CLI / CDK_DEFAULT_* env vars).
const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// ── Stack 1: Hosting (S3 + CloudFront) ────────────────────────────────────────
const hostingStack = new HostingStack(app, "PebbleHostingStack", {
  env,
  description: "Pebble frontend hosting — S3 (private) + CloudFront with OAC",
});

// ── Stack 2: CI/CD pipeline (CodePipeline + CodeBuild) ────────────────────────
//
// Required context (pass via --context or set in cdk.json):
//   codestarConnectionArn  — ARN of a CodeStar Connection (GitHub App).
//                            Create one in: AWS Console → Developer Tools → Connections.
//                            The connection must be set to AVAILABLE before the first run.
//   githubOwner            — GitHub org or username          (default: addyvantage)
//   githubRepo             — Repository name                 (default: pebble-prototype-dev)
//   githubBranch           — Branch that triggers deploys    (default: main)
//
// Example:
//   npx cdk deploy --all \
//     --context codestarConnectionArn=arn:aws:codestar-connections:ap-south-1:123456789012:connection/UUID

const codestarConnectionArn: string | undefined =
  app.node.tryGetContext("codestarConnectionArn");

if (!codestarConnectionArn) {
  throw new Error(
    "\n" +
    "┌─ Missing required CDK context ──────────────────────────────────────────┐\n" +
    "│  codestarConnectionArn is not set.                                       │\n" +
    "│                                                                          │\n" +
    "│  Steps:                                                                  │\n" +
    "│  1. Open AWS Console → Developer Tools → Connections                     │\n" +
    "│  2. Create a GitHub App connection for your account                      │\n" +
    "│  3. Copy the ARN and pass it:                                            │\n" +
    "│                                                                          │\n" +
    "│  npx cdk deploy --all \\                                                  │\n" +
    "│    --context codestarConnectionArn=arn:aws:codestar-connections:...      │\n" +
    "│                                                                          │\n" +
    "│  See infra/README.md → Auto Deploy (CI/CD) for full instructions.        │\n" +
    "└──────────────────────────────────────────────────────────────────────────┘\n",
  );
}

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
