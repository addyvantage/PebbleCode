#!/usr/bin/env node
/**
 * dev_smoke_all.mjs — Pebble dev runtime smoke test
 *
 * Usage:
 *   node scripts/dev_smoke_all.mjs
 *   # or after adding "smoke" to package.json scripts:
 *   npm run smoke
 *
 * Expects the backend to already be running (npm run dev:backend or dev:full).
 * Optionally pass --backend-port=PORT and --frontend-port=PORT.
 */

import { spawn } from 'child_process'

// ── Config ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const getArg = (name, fallback) => {
  const match = args.find(a => a.startsWith(`--${name}=`))
  return match ? match.split('=')[1] : fallback
}

const BACKEND_PORT  = Number(getArg('backend-port',  process.env.PORT ?? '3001'))
const FRONTEND_PORT = Number(getArg('frontend-port', '5173'))
const BACKEND_URL   = `http://localhost:${BACKEND_PORT}`
const FRONTEND_URL  = `http://localhost:${FRONTEND_PORT}`
const SPAWN_BACKEND = args.includes('--spawn')
const WAIT_TIMEOUT_MS = 20_000

// ── Colours ───────────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN   = '\x1b[36m'
const RESET  = '\x1b[0m'
const BOLD   = '\x1b[1m'

const pass = msg => console.log(`  ${GREEN}✓${RESET}  ${msg}`)
const fail = msg => console.log(`  ${RED}✗${RESET}  ${msg}`)
const skip = msg => console.log(`  ${YELLOW}~${RESET}  ${msg}`)
const info = msg => console.log(`  ${CYAN}${msg}${RESET}`)

let backendProc = null
let failures = 0

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(8000) })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* not JSON */ }
  return { status: res.status, ok: res.ok, json, text, contentType: res.headers.get('content-type') ?? '' }
}

async function waitForHealth(maxMs = WAIT_TIMEOUT_MS) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    try {
      const { status } = await fetchJSON(`${BACKEND_URL}/api/health`)
      if (status === 200) return true
    } catch { /* not ready yet */ }
    await new Promise(r => setTimeout(r, 300))
  }
  return false
}

function check(label, { status, json, contentType, text }, { expectStatus = 200, expectJson = true } = {}) {
  const statusOk = status === expectStatus
  const isJson = contentType.includes('application/json') || (json !== null)
  const jsonOk = !expectJson || isJson

  if (!statusOk) {
    fail(`${label} → HTTP ${status} (expected ${expectStatus})`)
    failures++
    return false
  }
  if (!jsonOk) {
    fail(`${label} → non-JSON response (${contentType}) — body starts: ${text.slice(0, 80)}`)
    failures++
    return false
  }
  // Only flag ok:false as a failure when we expect a 200-range success response.
  // For deliberate error status codes (4xx, 5xx in expectStatus), ok:false is correct.
  if (expectStatus < 400 && expectJson && json && json.ok === false) {
    fail(`${label} → ok:false — ${JSON.stringify(json).slice(0, 120)}`)
    failures++
    return false
  }
  pass(`${label} → ${status} ${isJson ? '(JSON ✓)' : '(body ✓)'}`)
  return true
}

// ── Optional backend spawner ───────────────────────────────────────────────────
function spawnBackend() {
  console.log(`\n${CYAN}Spawning backend on port ${BACKEND_PORT}…${RESET}`)
  backendProc = spawn('npx', ['tsx', 'server/dev-server.ts'], {
    env: { ...process.env, PORT: String(BACKEND_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  backendProc.stdout.on('data', d => process.stdout.write(`  [backend] ${d}`))
  backendProc.stderr.on('data', d => process.stderr.write(`  [backend] ${d}`))
  backendProc.on('exit', code => {
    if (code !== null && code !== 0) console.error(`${RED}Backend exited with code ${code}${RESET}`)
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${BOLD}Pebble Dev Smoke Test${RESET}`)
  console.log(`  Backend:  ${BACKEND_URL}`)
  console.log(`  Frontend: ${FRONTEND_URL}`)

  if (SPAWN_BACKEND) {
    spawnBackend()
  }

  // 1) Wait for backend
  console.log(`\n${BOLD}[1] Waiting for backend health…${RESET}`)
  const healthy = await waitForHealth()
  if (!healthy) {
    fail(`Backend not reachable at ${BACKEND_URL}/api/health after ${WAIT_TIMEOUT_MS}ms`)
    fail(`Make sure 'npm run dev:backend' (or dev:full) is running`)
    process.exit(1)
  }
  pass(`Backend healthy at ${BACKEND_URL}/api/health`)

  // 2) Backend route tests
  console.log(`\n${BOLD}[2] Testing backend routes (direct: ${BACKEND_URL})${RESET}`)

  const ANON = { headers: { 'x-user-id': 'anonymous' } }
  const JSON_ANON = { headers: { 'x-user-id': 'anonymous', 'Content-Type': 'application/json' } }

  // Health
  check('GET /api/health',
    await fetchJSON(`${BACKEND_URL}/api/health`))

  // Flags
  check('GET /api/flags',
    await fetchJSON(`${BACKEND_URL}/api/flags`))

  // Journey
  check('GET /api/journey/current',
    await fetchJSON(`${BACKEND_URL}/api/journey/current`, ANON))

  check('POST /api/journey/update',
    await fetchJSON(`${BACKEND_URL}/api/journey/update`, {
      method: 'POST',
      ...JSON_ANON,
      body: JSON.stringify({ userId: 'anonymous', recoveryTimeMs: 60000, struggleScore: 40, autonomyDelta: 5 }),
    }))

  // Risk
  check('GET /api/risk/current',
    await fetchJSON(`${BACKEND_URL}/api/risk/current`, ANON))

  check('POST /api/risk/recompute',
    await fetchJSON(`${BACKEND_URL}/api/risk/recompute`, {
      method: 'POST',
      ...JSON_ANON,
      body: JSON.stringify({ features: { streakDays: 3, daysActiveLast7: 4, avgRecoveryTimeMsLast7: 0,
        guidanceRelianceLast7: 0.2, autonomyRateLast7: 0.8, breakpointsLast7: 0,
        solvesLast7: 5, lateNightSessionsLast7: 0, trendDirection: 'stable' } }),
    }))

  // Weekly Recap
  check('GET /api/growth/weekly-recap/latest',
    await fetchJSON(`${BACKEND_URL}/api/growth/weekly-recap/latest`, ANON))

  check('POST /api/growth/weekly-recap',
    await fetchJSON(`${BACKEND_URL}/api/growth/weekly-recap`, {
      method: 'POST',
      ...JSON_ANON,
      body: JSON.stringify({ summary: { solvesLast7: 3, daysActiveLast7: 4, streakDays: 3,
        biggestStruggle: null, trendDirection: 'stable', language: 'python' } }),
    }))

  // Snapshot
  check('POST /api/session/snapshot',
    await fetchJSON(`${BACKEND_URL}/api/session/snapshot`, {
      method: 'POST',
      ...JSON_ANON,
      body: JSON.stringify({ problemId: 'smoke-test-001', finalCode: 'print("hello")',
        language: 'python', status: 'accepted', runtimeMs: 100, recoveryTimeMs: 0, userId: 'anonymous' }),
    }))

  // Report recovery (PDF — just check status + content-type)
  {
    const r = await fetchJSON(`${BACKEND_URL}/api/report/recovery`, {
      method: 'POST',
      ...JSON_ANON,
      body: JSON.stringify({ userId: 'anonymous', sessionId: 'smoke-session',
        problemId: 'smoke-001', events: [] }),
    })
    // Recovery report returns JSON with downloadUrl OR streams PDF
    if (r.status === 200) {
      pass(`POST /api/report/recovery → ${r.status} (${r.json ? 'JSON ✓' : r.contentType})`)
    } else {
      fail(`POST /api/report/recovery → ${r.status} — ${r.text.slice(0, 120)}`)
      failures++
    }
  }

  // Report download — only test if recovery gave us a filename
  // (PDF is served via sendFile, content-type is application/pdf)
  {
    const r = await fetchJSON(`${BACKEND_URL}/api/report/download/smoke-nonexistent.pdf`)
    // Expect a 404 (file not found) NOT a 404 "Cannot GET" HTML
    if (r.status === 404 && r.json !== null) {
      pass(`GET /api/report/download/:filename → 404 JSON (route registered ✓)`)
    } else if (r.status === 404 && r.text.includes('Cannot GET')) {
      fail(`GET /api/report/download/:filename → Express 404 HTML — route NOT registered`)
      failures++
    } else {
      pass(`GET /api/report/download/:filename → ${r.status} (route registered ✓)`)
    }
  }

  // Analytics cohort
  check('GET /api/analytics/cohort',
    await fetchJSON(`${BACKEND_URL}/api/analytics/cohort`, ANON))

  // Run (basic validation response)
  check('POST /api/run (validation)',
    await fetchJSON(`${BACKEND_URL}/api/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }), { expectStatus: 400 })

  // Telemetry
  check('POST /api/telemetry',
    await fetchJSON(`${BACKEND_URL}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'smoke_test', ts: Date.now() }),
    }))

  // 3) Proxy test through Vite (tries configured port, then auto-incremented port)
  console.log(`\n${BOLD}[3] Testing Vite proxy${RESET}`)
  let viteUp = false
  let viteUrl = FRONTEND_URL
  for (const tryPort of [FRONTEND_PORT, FRONTEND_PORT + 1]) {
    try {
      const url = `http://localhost:${tryPort}/api/health`
      const viteCheck = await fetchJSON(url)
      if (viteCheck.status === 200 && viteCheck.json?.ok) {
        viteUrl = `http://localhost:${tryPort}`
        viteUp = true
        pass(`Vite proxy (port ${tryPort}) → /api/health proxied correctly`)
        if (tryPort !== FRONTEND_PORT) {
          info(`Note: Vite is on port ${tryPort} (${FRONTEND_PORT} was already in use) — this is fine`)
        }
        break
      }
    } catch { /* not on this port */ }
  }
  if (!viteUp) {
    skip(`Vite not reachable at ${FRONTEND_URL} or ${FRONTEND_URL.replace(String(FRONTEND_PORT), String(FRONTEND_PORT+1))} — skipping proxy checks (run dev:frontend to enable)`)
  }

  if (viteUp) {
    // Test a few key routes through Vite proxy
    for (const [label, url, opts] of [
      ['Vite→ GET /api/journey/current', `${viteUrl}/api/journey/current`, ANON],
      ['Vite→ GET /api/risk/current',    `${viteUrl}/api/risk/current`,    ANON],
      ['Vite→ GET /api/flags',           `${viteUrl}/api/flags`,           {}],
    ]) {
      try {
        check(label, await fetchJSON(url, opts))
      } catch (err) {
        fail(`${label} → fetch error: ${err.message}`)
        failures++
      }
    }
  }

  // 4) Summary
  console.log(`\n${BOLD}[4] Summary${RESET}`)
  if (failures === 0) {
    console.log(`\n${GREEN}${BOLD}ALL CHECKS PASSED${RESET} — no red console spam expected\n`)
  } else {
    console.log(`\n${RED}${BOLD}${failures} CHECK(S) FAILED${RESET}\n`)
    console.log(`${YELLOW}If you still see 404s:${RESET}`)
    console.log(`  1. Confirm backend is running: ${BOLD}curl ${BACKEND_URL}/api/health${RESET}`)
    console.log(`  2. Kill stale processes and restart: ${BOLD}npm run dev:kill && npm run dev:full${RESET}`)
    console.log(`  3. Confirm Vite proxy target in vite.config.ts targets ${BOLD}localhost:${BACKEND_PORT}${RESET}`)
  }

  if (backendProc) backendProc.kill()
  process.exit(failures > 0 ? 1 : 0)
}

main().catch(err => {
  console.error(`${RED}Fatal error:${RESET}`, err)
  if (backendProc) backendProc.kill()
  process.exit(1)
})
