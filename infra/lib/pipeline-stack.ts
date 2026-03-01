import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as iam from "aws-cdk-lib/aws-iam";

export interface PipelineStackProps extends cdk.StackProps {
  /** The existing site bucket from HostingStack. */
  siteBucket: s3.IBucket;
  /** The existing CloudFront distribution from HostingStack. */
  distribution: cloudfront.IDistribution;
  /** GitHub org or user (e.g. "addyvantage"). */
  githubOwner: string;
  /** GitHub repository name (e.g. "pebble-prototype-dev"). */
  githubRepo: string;
  /** Branch that triggers deploys (default "main"). */
  githubBranch: string;
  /**
   * ARN of a CodeStar Connection (GitHub App connection).
   * Create one in the AWS Console → Developer Tools → Connections,
   * then paste the ARN here via --context or cdk.json.
   * The connection must be in AVAILABLE status before the pipeline can run.
   */
  codestarConnectionArn: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const {
      siteBucket,
      distribution,
      githubOwner,
      githubRepo,
      githubBranch,
      codestarConnectionArn,
    } = props;

    // -------------------------------------------------------------------------
    // Artifact bucket — stores CodePipeline stage artifacts (source zip, etc.).
    // Ephemeral by nature; expire after 30 days to keep costs minimal.
    // -------------------------------------------------------------------------
    const artifactBucket = new s3.Bucket(this, "ArtifactBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: "expire-artifacts",
          enabled: true,
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    // -------------------------------------------------------------------------
    // CodeBuild project — runs inside AWS; no local credentials needed.
    //
    // Build steps mirror deploy-frontend.sh but run entirely in the pipeline:
    //   1. npm ci + npm run build  (Vite → dist/)
    //   2. aws s3 sync in 3 passes with per-type Cache-Control headers
    //   3. aws cloudfront create-invalidation /*
    // -------------------------------------------------------------------------
    const buildProject = new codebuild.PipelineProject(this, "BuildProject", {
      projectName: "PebbleFrontendBuild",
      description: "Build Pebble Vite app and deploy to S3 + invalidate CloudFront",

      environment: {
        // Standard 7.0 = Amazon Linux 2023 + Node 20 runtime support.
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: false,
      },

      environmentVariables: {
        // Resolved at synth time from CDK cross-stack references.
        BUCKET_NAME: {
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: siteBucket.bucketName,
        },
        DISTRIBUTION_ID: {
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: distribution.distributionId,
        },
        // Force AWS CLI to use the stack's region (CloudFront invalidation is
        // always signed against us-east-1 but the CLI resolves it correctly).
        AWS_DEFAULT_REGION: {
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: this.region,
        },
      },

      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          install: {
            "runtime-versions": { nodejs: 20 },
            commands: [
              // Print versions for build log visibility.
              "echo \"Node $(node --version)  npm $(npm --version)\"",
              "npm ci",
            ],
          },
          build: {
            commands: [
              "npm run build",

              // Fail fast if Vite didn't produce a dist/ directory.
              "[ -d dist ] || (echo 'ERROR: dist/ not found after build.' && exit 1)",

              // ── S3 sync — three passes for per-type Cache-Control ────────────
              //
              // Pass 1: index.html (and any other HTML files)
              //   • no-cache: browsers always revalidate before using cached copy
              //   • --delete: removes stale HTML objects from S3 (e.g. renamed pages)
              "aws s3 sync dist/ \"s3://$BUCKET_NAME\"" +
                " --delete" +
                " --exclude \"*\" --include \"*.html\"" +
                " --cache-control \"no-cache, no-store, must-revalidate\"" +
                " --content-type \"text/html; charset=utf-8\"",

              // Pass 2: Vite hashed assets (js, css, wasm, json, images under /assets/)
              //   • Vite embeds a content hash in every filename → immutable 1-year cache.
              "aws s3 sync dist/ \"s3://$BUCKET_NAME\"" +
                " --exclude \"*\" --include \"assets/*\"" +
                " --cache-control \"public, max-age=31536000, immutable\"",

              // Pass 3: Everything else (icons, manifest, robots.txt, SVGs at root, etc.)
              //   • 1-hour cache — short enough to update quickly, long enough to reduce origin hits.
              "aws s3 sync dist/ \"s3://$BUCKET_NAME\"" +
                " --exclude \"*.html\" --exclude \"assets/*\"" +
                " --cache-control \"public, max-age=3600\"",

              // ── CloudFront invalidation ───────────────────────────────────────
              // /* counts as a single path — always within the free 1,000 paths/month tier.
              "aws cloudfront create-invalidation" +
                " --distribution-id \"$DISTRIBUTION_ID\"" +
                " --paths \"/*\"",
            ],
          },
        },
      }),
    });

    // -------------------------------------------------------------------------
    // Least-privilege IAM grants for CodeBuild
    //
    // CDK auto-grants CodeBuild access to the artifact bucket.
    // We add only the permissions the build script actually needs.
    // -------------------------------------------------------------------------

    // S3: read+write objects in the site bucket (for aws s3 sync --delete).
    buildProject.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "S3SiteBucketObjects",
        effect: iam.Effect.ALLOW,
        actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
        resources: [siteBucket.arnForObjects("*")],
      }),
    );

    // S3: list the site bucket (required by aws s3 sync to detect deletions).
    buildProject.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "S3SiteBucketList",
        effect: iam.Effect.ALLOW,
        actions: ["s3:ListBucket"],
        resources: [siteBucket.bucketArn],
      }),
    );

    // CloudFront: create cache invalidations on the specific distribution only.
    buildProject.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "CloudFrontInvalidate",
        effect: iam.Effect.ALLOW,
        actions: ["cloudfront:CreateInvalidation"],
        resources: [
          `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
        ],
      }),
    );

    // -------------------------------------------------------------------------
    // CodePipeline — Source (GitHub via CodeStar) → Build (CodeBuild)
    // -------------------------------------------------------------------------
    const sourceArtifact = new codepipeline.Artifact("SourceArtifact");

    const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
      pipelineName: "PebbleFrontendPipeline",
      pipelineType: codepipeline.PipelineType.V2,

      // Use our private artifact bucket — avoids CodePipeline creating a default one.
      artifactBucket,

      // Single-account deployment — no cross-account KMS key needed (saves cost).
      crossAccountKeys: false,

      stages: [
        {
          // ── Stage 1: Source ─────────────────────────────────────────────────
          // CodeStar Connection (GitHub App) polls for new commits on the branch
          // and triggers the pipeline automatically on every push.
          stageName: "Source",
          actions: [
            new actions.CodeStarConnectionsSourceAction({
              actionName: "GitHub_Source",
              connectionArn: codestarConnectionArn,
              owner: githubOwner,
              repo: githubRepo,
              branch: githubBranch,
              output: sourceArtifact,
              // triggerOnPush defaults to true — pipeline runs on every branch push.
            }),
          ],
        },
        {
          // ── Stage 2: Build + Deploy ─────────────────────────────────────────
          // CodeBuild checks out the source, builds the Vite app, syncs to S3,
          // and invalidates CloudFront — all in one build phase.
          stageName: "Build",
          actions: [
            new actions.CodeBuildAction({
              actionName: "Build_and_Deploy",
              project: buildProject,
              input: sourceArtifact,
            }),
          ],
        },
      ],
    });

    // Grant the pipeline permission to use the CodeStar Connection.
    // CDK does not auto-grant this — it must be explicit.
    pipeline.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "UseCodeStarConnection",
        effect: iam.Effect.ALLOW,
        actions: ["codestar-connections:UseConnection"],
        resources: [codestarConnectionArn],
      }),
    );

    // -------------------------------------------------------------------------
    // Outputs
    // -------------------------------------------------------------------------
    new cdk.CfnOutput(this, "PipelineName", {
      value: pipeline.pipelineName,
      description: "CodePipeline name",
    });

    new cdk.CfnOutput(this, "PipelineConsoleUrl", {
      value: `https://${this.region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.pipelineName}/view`,
      description: "Direct link to the pipeline in the AWS Console",
    });
  }
}
