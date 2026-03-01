#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { HostingStack } from "../lib/hosting-stack";

const app = new cdk.App();

new HostingStack(app, "PebbleHostingStack", {
  // Resolve account + region from the environment (set by AWS CLI / CDK_DEFAULT_* env vars).
  // This keeps the stack portable across accounts and regions without hardcoding.
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: "Pebble frontend hosting — S3 (private) + CloudFront with OAC",
});
