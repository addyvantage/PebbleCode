# Pebble Prototype

Pebble is a calm, behavior-aware AI learning companion for developers.
This repo is a React + Vite frontend with:

- Local Express dev API (`server/dev-server.ts`)
- Vercel API routes (`/api/*`)
- Unified code runner endpoint: `POST /api/run`

## Local setup

### Prerequisites

- Node.js (includes `node` and `npm`)
- `python3`
- `g++`
- JDK 17+ (`javac` and `java`)

### Install and run full stack

```bash
npm install
npm run dev:full
```

Open `http://localhost:5173/session/1`.

Vite proxies `/api/*` to `http://localhost:3001` in local dev.

## Phase 0: Telemetry & Feature Flags (AWS Foundation)

This repository includes a foundation for the AWS roadmap, starting with an Event Pipeline and Feature Flags.

### Local Testing

1. Start the dev server normally (`npm run dev:full`).
2. Without AWS credentials, the local dev server will buffer and safely discard telemetry events (Run, Submit, Chat).
3. To test AWS ingestion, copy `.env.example` to `.env.local` and add your AWS credentials.
4. With credentials, actions in the app will be forwarded to the `ingestEvents` Lambda.

### Deploying the Foundation

The AWS Infrastructure (EventBridge, Lambda, DynamoDB) is defined in the `infra/` folder using CDK.

```bash
cd infra
npm install
npm run deploy
```

Once deployed, you can verify events are landing in the cloud rollup table using the demo script:

```bash
npx tsx scripts/demo_queries.ts
```

## Phase 2: Agentic Pebble Coach

The Pebble Coach chat is now an **agentic system** with structured responses, tiered help enforcement, and safety filters.

### Tiered Help System

| Tier | Label | Behavior |
|------|-------|----------|
| T1 | Hint only | No code solutions, max 3 code lines, conceptual guidance |
| T2 | Explain | Root cause explanation, guided approach, max 6 code lines |
| T3 | Full fix | Near-complete solutions + patch suggestions allowed |

**Tier selector**: Three pills (`T1` `T2` `T3`) appear below the quick actions in the chat panel. T1 is the default.

### Agent Architecture

The agent runs a **server-side** observe/plan/act/respond loop:
1. **Observe**: Reads student code + run results via internal tools
2. **Plan**: Builds a Bedrock prompt with tier-specific constraints
3. **Act**: Calls Bedrock for structured JSON response
4. **Respond**: Enforces tier policy + safety filters, returns `AgentResponse`

### Local Fallback

Without Bedrock credentials (`AWS_REGION` / `BEDROCK_MODEL_ID`), the agent returns **canned tier-appropriate responses** so `npm run dev:full` always works.

### Safety Filters

- AWS keys, tokens, private keys are auto-redacted
- Code blocks exceeding tier limits are stripped
- Unsafe code patterns (eval, exec, etc.) are flagged

## Phase 3: Safety & Policy Layer

All LLM responses are post-processed through a shared safety pipeline (`server/safety/`).

### How it works

1. **Secret redaction** (`redact.ts`): regex-based detection of AWS keys, tokens, private keys, GitHub PATs, API keys, env var dumps → auto-redacted
2. **Unsafe content blocking** (`policy.ts`): blocks credential theft, keyloggers, ransomware, reverse shells, destructive commands → returns safe refusal
3. **Tier enforcement** (`policy.ts`): detects full-solution phrases + counts consecutive code lines → blocks violations in T1/T2
4. **Bedrock Guardrails** (`guardrails.ts`): if `BEDROCK_GUARDRAIL_ID` is set, wraps model calls with guardrail evaluation

### Configuration

| Env var | Default | Purpose |
|---------|---------|---------|
| `BEDROCK_GUARDRAIL_ID` | _(empty)_ | Guardrail from Bedrock console |
| `BEDROCK_GUARDRAIL_VERSION` | `DRAFT` | Guardrail version |
| `SAFETY_MODE` | `auto` | `auto`=local fallback, `strict`=always block, `off`=dev debug |

### Running the smoke test

```bash
npx tsx scripts/safety_smoke.ts
```

### Tier behavior under safety

| Tier | Code line limit | Full solution? | Patch suggestion? |
|------|-----------------|----------------|-------------------|
| T1 | 4 lines max | Blocked | Blocked |
| T2 | 8 lines max | Blocked | Blocked |
| T3 | Unlimited | Allowed | Allowed |

## Phase 4: Live Mental Presence

The Insights dashboard features real-time KPI updates powered by an **EventBridge → Lambda → DynamoDB Streams → AppSync** architecture.
- Real-time metrics (Recovery Effectiveness, Guidance Reliance, Streak, etc.) push to the client over WebSockets (`graphql-ws` protocol).
- A zero-dependency AppSync WebSocket client is used to maintain a small frontend bundle.
- A local offline mock fallback is included in the Vite dev server (`/api/live-events` via SSE) to allow live offline demos.

## Phase 5: Cohort Analytics (Athena + Glue + S3)

The Insights dashboard replaces simple local metric averages with powerful cohort-level aggregations driven by **AWS Athena**.
- **S3 Event Lake**: An EventBridge Lambda securely strips PII/code and archives raw `run|submit` events to S3 partitioned by date (NDJSON).
- **Glue Data Catalog**: Maps the S3 partitions to a queryable schema using `JsonSerDe`.
- **Athena Execution**: The Node.js dev server uses `@aws-sdk/client-athena` to parallelize queries (e.g., *Avg Recovery by Difficulty*, *Autonomy Rate by Language*) directly from the datalake.
- **Local Fallback**: Included offline mode gracefully supplies mock cohort data when AWS credentials are not present, ensuring reliable hackathon demos.

## Phase 6: Orchestrated Learning Journeys (Step Functions)

Pebble now provides each user a **stateful learning arc** through seven progressive phases:
`Warm-Up → Practice Block → Challenge → Recovery Phase → Reflection → Complete`

### Flow
1. `run.completed` / `submit.completed` fires → EventBridge trigger → **`journeyAdvanceLambda`** → starts **Step Functions Express Execution**.
2. `journeyTransitionLambda` evaluates `recoveryTimeMs`, `autonomyScore`, and `struggleScore` against advancement rules and writes the new phase + `recommendedNextDifficulty` to DynamoDB.
3. The **`GET /api/journey/current`** endpoint surfaces this state to the frontend (or returns a local mock offline).
4. The **"Your Learning Journey" card** on the home page shows the current phase, a confidence bar, and a tailored *Resume Journey* CTA.

### Local Dev (Offline)
```bash
# No AWS creds needed — journey card and APIs work fully via in-memory fallback
npm run dev:full
```

### Environment Variables (when deploying)
| Variable | Description |
|---|---|
| `JOURNEYS_TABLE_NAME` | DDB table name (e.g. `pebble-learning-journeys-dev`) |
| `JOURNEY_STATE_MACHINE_ARN` | ARN of the Step Functions workflow |



## Phase 7: PDF Reports & Session Snapshots

Two user-facing file export features powered by S3 + DynamoDB (or local fallbacks):

### A — Export Recovery Report
Click **"Export Report"** in the session header to generate a styled A4 PDF of your session:
- Total attempts, run/submit split, avg recovery time, autonomy rate, hint usage, error breakdown — all computed from telemetry events.
- **With AWS**: PDF uploaded to `s3://pebble-session-reports/{userId}/{sessionId}.pdf`, served via a signed URL.
- **Without AWS**: PDF written to `/tmp/pebble-reports/` and served via a local download endpoint.

### B — Share Session Snapshot
Click **"Share Session"** in the session header to generate a shareable link:
- Captures problem ID, language, run status, and timing metadata (no raw code or secrets).
- Link is copied to clipboard automatically and shown in a toast.
- **With AWS**: Stored in `pebble-session-snapshots` DynamoDB table (7-day TTL).
- **Without AWS**: Stored in-memory; links resolve for the duration of the dev server session.

### Environment Variables (when deploying)
| Variable | Description |
|---|---|
| `REPORTS_BUCKET_NAME` | S3 bucket name (e.g. `pebble-session-reports-123456789-dev`) |
| `SNAPSHOTS_TABLE_NAME` | DDB table name (e.g. `pebble-session-snapshots-dev`) |

## Phase 8: Observability + Admin Ops Dashboard

Production-grade backend observability with a live admin-only monitoring page.

### How it works
- **`server/observability/tracer.ts`**: Express middleware mounted at the top of all routes. Emits `{ route, method, durationMs, status, success, timestamp }` spans to `console` (local) or **CloudWatch Logs** (when `AWS_REGION` + `OPS_LOG_GROUP` are set). Zero npm dependencies mandatory.
- **`server/observability/metricsStore.ts`**: Rolling in-memory circular buffer (100 samples) → computes avg, p95, min, max, and error rate per metric key (`agentResponseMs`, `reportGenMs`, `snapshotMs`, `journeyUpdateMs`, `analyticsMs`).

### API
| Route | Auth | Description |
|---|---|---|
| `GET /api/admin/ops-metrics` | `X-Admin-Token` header | Returns full metrics snapshot |

### Admin Ops Page
Navigate to `/ops` when logged in as an admin account (`adityasingh0929@gmail.com`):
- **6 KPI cards** with avg, p95, and error-rate per metric
- **SVG Sparkline** (last 20 samples) per card — no chart library
- **"Live Ops" badge** when the 5s polling succeeds
- Non-admin accounts are immediately redirected to Home

### Environment Variables
| Variable | Description |
|---|---|
| `OPS_LOG_GROUP` | CloudWatch Log Group name (default: `/pebble/ops`) |
| `ADMIN_OPS_TOKEN` | Secret token for `X-Admin-Token` header (default: `dev-admin`) |
| `VITE_ADMIN_TOKEN` | Frontend token mirroring the above (for local dev) |





- Placement now uses 7 questions per attempt: 4 MCQ + 3 coding.
- Questions come from a larger per-language bank and rotate weekly.
- Selection is deterministic for a week using `(language + level + week-bucket)` seeding, so the same profile sees the same set until the next weekly bucket.

## How curriculum works

- Curriculum content lives in `src/content/paths/{python,javascript,cpp,java}.json`.
- Each path contains ordered units with:
  - `id`, `title`, `concept`, `prompt`
  - `starterCode`
  - `tests` (`input` + `expected`)
  - `hints`
- The session page loads the selected language path and renders:
  - left: unit list with progress
  - center: Monaco editor + run tests + output
  - right: Pebble chat panel with quick actions
- When you click Run tests, Pebble executes each test via `/api/run` and summarizes failures for coaching context.
- User learning state is stored in localStorage key `pebbleUserState`:
  - selected language and level
  - current unit id
  - completed unit ids
  - recent chat summary

## Unified run endpoint

`POST /api/run`

Request body:

```json
{
  "language": "python",
  "code": "print(2+2)",
  "stdin": "",
  "timeoutMs": 4000
}
```

Supported `language` values:

- `python`
- `javascript`
- `cpp`
- `java`

Response shape (always):

```json
{
  "ok": true,
  "exitCode": 0,
  "stdout": "4\n",
  "stderr": "",
  "timedOut": false,
  "durationMs": 12
}
```

Execution limits:

- default timeout: `4000ms`
- max timeout: `6000ms`
- code size limit: `50000` chars
- stdout/stderr truncation: `16000` chars each
- per-run temp dir: `.pebble_tmp/<runId>` (auto-cleaned)

## Local runner mode

Local backend mode is controlled by:

- `PEBBLE_RUNNER_MODE=local` (default)
- `PEBBLE_RUNNER_MODE=remote`

Remote mode requires:

- `AWS_REGION`
- `RUNNER_LAMBDA_NAME`
- Optional static creds: `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`

Example:

```bash
PEBBLE_RUNNER_MODE=remote npm run dev:backend
```

## Smoke tests (local)

```bash
curl -sS -X POST http://localhost:5173/api/run \
  -H "Content-Type: application/json" \
  -d '{"language":"python","code":"print(2+2)","stdin":"","timeoutMs":4000}'

curl -sS -X POST http://localhost:5173/api/run \
  -H "Content-Type: application/json" \
  -d '{"language":"javascript","code":"console.log(2+2)","stdin":"","timeoutMs":4000}'

curl -sS -X POST http://localhost:5173/api/run \
  -H "Content-Type: application/json" \
  -d '{"language":"cpp","code":"#include <iostream>\nint main(){std::cout<<(2+2)<<std::endl;return 0;}","stdin":"","timeoutMs":4000}'

curl -sS -X POST http://localhost:5173/api/run \
  -H "Content-Type: application/json" \
  -d '{"language":"java","code":"public class Main { public static void main(String[] args){ System.out.println(2+2); } }","stdin":"","timeoutMs":4000}'
```

## Runner deploy

Multi-language Lambda runner container files are in `runner/container/`.

### Deploy with AWS SAM (container)

```bash
cd runner/container
sam build -t template.yaml
sam deploy --guided -t template.yaml
```

Capture output:

- `RunnerFunctionName`
- `RunnerFunctionArn`

Set Vercel env vars:

- `PEBBLE_RUNNER_MODE=remote`
- `AWS_REGION`
- `RUNNER_LAMBDA_NAME` (or ARN)
- Optional: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

### Deployed smoke test

```bash
curl -sS -X POST https://<your-app>.vercel.app/api/run \
  -H "Content-Type: application/json" \
  -d '{"language":"python","code":"print(40+2)","stdin":"","timeoutMs":4000}'
```

## Notes

- `/api/pebble` remains unchanged.
- Do not run untrusted code without infrastructure sandboxing/isolation.

## Phase 9: Premium AWS Demo — SageMaker + Polly

Phase 9 adds two premium AI features visible on the **Insights / Dashboard** page:

### A. Streak Risk Predictor (SageMaker)

Predicts whether the user will break their coding streak in the next 7 days.

| Output | Description |
|--------|-------------|
| `score` | 0–100 risk score (higher = more likely to break streak) |
| `label` | `low` / `medium` / `high` |
| `factors` | 3 human-readable "why" phrases |
| `actions` | 3 recommended next steps |
| `model` | `sagemaker` or `local` (heuristic fallback) |

**How it works:**
1. The frontend computes 9 features from local analytics events (streak, solves, reliance ratio, etc.)
2. `POST /api/risk/recompute` sends features → SageMaker endpoint (or local heuristic if unconfigured)
3. Result stored in DynamoDB `PebbleRiskPredictions-dev` with a 30-day TTL
4. `GET /api/risk/current` returns the latest stored result

**Env vars:**
| Variable | Default | Purpose |
|----------|---------|---------|
| `SAGEMAKER_ENDPOINT_NAME` | _(empty)_ | Real SageMaker endpoint name (optional) |
| `SAGEMAKER_REGION` | `AWS_REGION` | Region for SageMaker (defaults to `AWS_REGION`) |
| `RISK_MODE` | `auto` | `auto`=try SageMaker→fallback, `aws`=require SageMaker, `local`=always local |
| `RISK_PREDICTIONS_TABLE_NAME` | `PebbleRiskPredictions-dev` | DynamoDB table (Phase 9 CDK) |

---

### B. Weekly Growth Ledger Narrator (Polly)

Generates a ~30-60 second personalized audio recap of the user's last 7 days.

**What it covers:**
- Major wins (problems solved)
- Biggest struggle type
- Improvement trend vs. previous week
- 1 encouragement line
- 1 concrete next action

**How it works:**
1. The frontend computes a weekly summary (solves, streak, biggest error type, trend direction)
2. `POST /api/growth/weekly-recap` sends summary → builds a clean script → calls Polly Neural TTS
3. MP3 uploaded to S3 `pebble-weekly-recaps-{account}-dev`; presigned URL returned
4. `GET /api/growth/weekly-recap/latest` retrieves the most recent recap
5. **Offline fallback:** if AWS is not configured, returns the script text only

**Env vars:**
| Variable | Default | Purpose |
|----------|---------|---------|
| `POLLY_VOICE_ID` | `Joanna` | Polly Neural voice (Joanna, Matthew, Amy, Brian, Aria) |
| `RECAP_MODE` | `auto` | `auto`=try Polly→fallback, `aws`=require Polly, `local`=script-only |
| `WEEKLY_RECAPS_TABLE_NAME` | `PebbleWeeklyRecaps-dev` | DynamoDB table (Phase 9 CDK) |
| `RECAP_AUDIO_BUCKET_NAME` | _(empty)_ | S3 bucket for MP3 files (Phase 9 CDK) |

---

### Phase 9 Demo — 2-Minute Checklist

Run the full stack (no AWS credentials needed for offline mode):

```bash
npm run dev:full
```

Open `http://localhost:5173` → navigate to **Insights**.

| Step | What to do | Expected result |
|------|-----------|-----------------|
| 1 | Scroll to **Streak Risk** card | Score pill loads automatically (local model) |
| 2 | Click **Recompute** | Score refreshes with factors + actions |
| 3 | Scroll to **Weekly Pebble Recap** card | "No recap generated yet" message |
| 4 | Click **Generate recap** | Script generated; "Show script" reveals narration text |
| 5 | _(AWS mode)_ Add `AWS_REGION` + `POLLY_VOICE_ID` to `.env.local` | **Play recap** button appears; click to hear Polly audio |
| 6 | _(AWS mode)_ Add `SAGEMAKER_ENDPOINT_NAME` to `.env.local` | Risk label shows `⚡ SageMaker` instead of `🔧 Local model` |

### Deploy Phase 9 CDK Stack

```bash
cd infra
npm install
npx cdk deploy PebblePhase9PremiumStack
```

Capture stack outputs and set them in `.env.local`:
- `RISK_PREDICTIONS_TABLE_NAME`
- `WEEKLY_RECAPS_TABLE_NAME`
- `RECAP_AUDIO_BUCKET_NAME`
