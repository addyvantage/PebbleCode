# Pebble — AWS Hosting Infrastructure

CDK v2 stack that provisions a **private S3 bucket + CloudFront distribution** for hosting the Pebble frontend SPA.

| Feature | Detail |
|---|---|
| S3 access | Private — Block Public Access, no website endpoint |
| CloudFront origin auth | Origin Access Control (OAC) — not legacy OAI |
| HTTPS | Viewer protocol redirect HTTP → HTTPS |
| Compression | gzip + brotli at the edge |
| SPA routing | 403 + 404 → `/index.html` (200) for React Router deep links |
| Asset caching | `/assets/*` 1-year immutable; `index.html` 60 s |
| Encryption | SSE-S3 |
| Versioning | Enabled |

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 18 |
| npm | 9 |
| AWS CLI | 2 |
| AWS CDK CLI | 2.130 (installed locally via `npm ci`) |

AWS credentials must be configured (`aws configure` or `~/.aws/credentials`). The IAM principal needs permissions to create S3, CloudFront, and IAM resources (or attach `AdministratorAccess` for a dev account).

---

## Step-by-step

### 1 — Install CDK dependencies

```bash
cd infra
npm ci
```

### 2 — Bootstrap CDK (once per AWS account + region)

CDK bootstrap creates a staging S3 bucket and IAM roles used during `cdk deploy`. Skip if you've already bootstrapped this account/region.

```bash
# Replace <ACCOUNT_ID> and <REGION> with your values.
# Example: npx cdk bootstrap aws://123456789012/us-east-1
npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
```

To find your account ID:
```bash
aws sts get-caller-identity --query Account --output text
```

### 3 — Preview the CloudFormation changes (optional)

```bash
npx cdk diff
```

### 4 — Deploy the stack

```bash
npx cdk deploy
```

CDK will display the IAM + resource changes and prompt for confirmation. After ~3–5 minutes the stack outputs will appear:

```
Outputs:
PebbleHostingStack.CloudFrontDistributionDomainName = abc123.cloudfront.net
PebbleHostingStack.CloudFrontDistributionId         = EDFDVBD6EXAMPLE
PebbleHostingStack.S3BucketName                     = pebblehostingstack-sitebucketXXX
```

### 5 — Build and upload the frontend

```bash
# From the REPO ROOT (not /infra):
bash infra/scripts/deploy-frontend.sh
```

The script will:
1. Run `npm ci` + `npm run build` (outputs `./dist/`)
2. Sync `./dist/` to S3 with per-file-type `Cache-Control` headers
3. Create a CloudFront `/*` invalidation

**Environment variable overrides:**

```bash
AWS_REGION=ap-south-1 \
AWS_PROFILE=my-profile \
STACK_NAME=PebbleHostingStack \
bash infra/scripts/deploy-frontend.sh
```

### 6 — Verify the deployment

Replace `<domain>` with the `CloudFrontDistributionDomainName` output value.

```bash
DOMAIN=abc123.cloudfront.net   # replace with your value

# Home page (should return HTTP 200, content-type: text/html)
curl -sI "https://$DOMAIN/" | grep -E "HTTP|content-type|cache-control"

# Deep-link SPA route (React Router path — should return 200, not 404)
curl -sI "https://$DOMAIN/dashboard" | grep -E "HTTP|content-type"

# Hashed asset (should return 200 + 1-year cache header)
# Find a real asset name from the dist/assets/ folder first.
curl -sI "https://$DOMAIN/assets/index-BxC2aFkP.js" | grep -E "HTTP|cache-control"

# HTTP → HTTPS redirect (should return 301)
curl -sI "http://$DOMAIN/" | grep "HTTP"
```

---

## Removal policy

By default the S3 bucket is **retained** when you run `cdk destroy` (protects against accidental data loss).

To allow full teardown:

```bash
npx cdk destroy --context removalPolicy=DESTROY
```

> **Warning:** `DESTROY` will also delete all objects in the bucket. Make sure you have a backup or can rebuild from source.

---

## Re-deploying after code changes

Just re-run the deploy script from the repo root:

```bash
bash infra/scripts/deploy-frontend.sh
```

No `cdk deploy` is needed unless you change infrastructure (the CDK stack itself).

---

## File structure

```
infra/
├── bin/
│   └── infra.ts            # CDK app entry point (HostingStack + PipelineStack)
├── lib/
│   ├── hosting-stack.ts    # S3 + CloudFront stack
│   └── pipeline-stack.ts   # CodePipeline CI/CD stack
├── scripts/
│   └── deploy-frontend.sh  # Manual deploy fallback (build → S3 sync → invalidation)
├── cdk.json                # CDK config + feature flags + GitHub defaults
├── package.json
├── tsconfig.json
└── README.md               # this file
```

---

## Auto Deploy (CI/CD)

Once set up, every push to `main` automatically builds and deploys the frontend:

```
GitHub push → CodeStar Connection → CodePipeline → CodeBuild → S3 sync → CloudFront invalidation
```

### Prerequisites

Everything from the manual deploy section, plus:
- A GitHub App connection (CodeStar Connection) created in the AWS Console.

### Step 1 — Create a GitHub App connection

1. Open **AWS Console → Developer Tools → Connections** (in `ap-south-1`)
   - Direct URL: `https://ap-south-1.console.aws.amazon.com/codesuite/settings/connections`
2. Click **Create connection** → choose **GitHub**
3. Enter a connection name (e.g. `pebble-github`)
4. Click **Connect to GitHub** → authorize the AWS Connector GitHub App for your account/org
5. Click **Connect** — the connection will show status **Pending**
6. Copy the **Connection ARN** — it looks like:
   ```
   arn:aws:codestar-connections:ap-south-1:389593335956:connection/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
   You will need this ARN in Step 3.

> **Important:** The connection stays **Pending** until you activate it (Step 5 below). The pipeline will not run until it is **Available**.

### Step 2 — Install CDK dependencies

```bash
cd infra && npm ci
```

### Step 3 — Deploy both stacks

Pass the CodeStar Connection ARN via `--context`. The GitHub owner/repo/branch already default to the right values in `cdk.json`.

```bash
cd infra
npx cdk deploy --all \
  --context codestarConnectionArn=arn:aws:codestar-connections:ap-south-1:389593335956:connection/YOUR-UUID
```

This deploys (or updates) two CloudFormation stacks:
- `PebbleHostingStack` — S3 + CloudFront (unchanged from before)
- `PebblePipelineStack` — CodePipeline + CodeBuild + IAM roles

Stack outputs include:
```
PebblePipelineStack.PipelineName       = PebbleFrontendPipeline
PebblePipelineStack.PipelineConsoleUrl = https://ap-south-1.console.aws.amazon.com/codesuite/...
```

### Step 4 — Activate the GitHub connection

After the pipeline stack deploys, the connection must be manually activated once:

1. Go to **AWS Console → Developer Tools → Connections**
2. Find your connection (status: **Pending**)
3. Click **Update pending connection**
4. Authorize in the GitHub OAuth popup
5. Status changes to **Available** ✓

### Step 5 — Trigger and verify

Push any change to the `main` branch:

```bash
git commit --allow-empty -m "trigger pipeline"
git push origin main
```

Then watch the pipeline:
1. Open the `PipelineConsoleUrl` from the stack output
2. **Source** stage turns green in ~10 seconds (GitHub checkout)
3. **Build** stage takes ~3–4 minutes (npm ci + vite build + s3 sync + invalidation)
4. Refresh `https://d17oosn01y6068.cloudfront.net` — changes are live

### Overriding GitHub context

To use a different repo or branch without editing `cdk.json`:

```bash
npx cdk deploy --all \
  --context codestarConnectionArn=arn:aws:codestar-connections:... \
  --context githubOwner=myorg \
  --context githubRepo=my-fork \
  --context githubBranch=production
```

---

## Estimated AWS costs (ap-south-1, low traffic)

| Service | Approx. cost |
|---|---|
| S3 storage (< 1 GB) | < $0.03 / month |
| CloudFront (PriceClass 200, < 10 GB egress) | < $1 / month |
| CloudFront invalidations (first 1,000 paths/month) | Free |
| CodePipeline (1 active pipeline) | $1 / month |
| CodeBuild (< 100 build-minutes/month) | Free tier |

Costs scale with traffic. See [CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/) for details.
