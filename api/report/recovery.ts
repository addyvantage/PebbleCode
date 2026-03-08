import { buildRecoveryReport } from '../../server/reports/buildRecoveryReport.js'
import { generateReportPdf } from '../../server/reports/pdfGenerator.js'

export const config = {
  runtime: 'nodejs',
  maxDuration: 25,
  api: {
    bodyParser: {
      sizeLimit: '300kb',
    },
  },
}

type ReportRequestBody = {
  problemId?: unknown
  problemTitle?: unknown
  difficulty?: unknown
  language?: unknown
  userId?: unknown
  userName?: unknown
  userEmail?: unknown
  avatarUrl?: unknown
  sessionId?: unknown
}

function sendJson(
  res: { status: (code: number) => { json: (payload: unknown) => void }; json: (payload: unknown) => void },
  status: number,
  payload: unknown,
) {
  try {
    res.status(status).json(payload)
  } catch {
    res.json(payload)
  }
}

async function readBody(req: { body?: unknown; on?: (event: string, cb: (chunk: Buffer) => void) => void }) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      return req.body
    }
    try {
      return JSON.stringify(req.body)
    } catch {
      return ''
    }
  }

  if (typeof req.on !== 'function') {
    return ''
  }

  return await new Promise<string>((resolve) => {
    const chunks: Buffer[] = []
    req.on?.('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    req.on?.('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    req.on?.('error', () => {
      resolve('')
    })
  })
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function sanitizeForFilename(value: string, fallback: string, maxLen = 40) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen)
  return slug || fallback
}

export default async function handler(
  req: {
    method?: string
    body?: unknown
    on?: (event: string, cb: (chunk: Buffer) => void) => void
  },
  res: {
    status: (code: number) => { json: (payload: unknown) => void }
    json: (payload: unknown) => void
    setHeader?: (name: string, value: string) => void
  },
) {
  try {
    if (req.method !== 'POST') {
      res.setHeader?.('Allow', 'POST')
      sendJson(res, 405, { error: 'Method not allowed. Use POST.' })
      return
    }

    const rawBody = await readBody(req)
    let body: ReportRequestBody
    try {
      body = rawBody ? (JSON.parse(rawBody) as ReportRequestBody) : {}
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON body.' })
      return
    }

    const userId = asString(body.userId, 'guest')
    const userName = asString(body.userName, 'Guest')
    const userEmail = asString(body.userEmail, '')
    const problemId = asString(body.problemId, 'unknown')
    const sessionId = asString(body.sessionId, `${Date.now()}`)
    const nowIso = new Date().toISOString()

    // Placeholder events for the hackathon prototype route.
    const mockEvents = [
      { eventName: 'run.completed', timestamp: nowIso, runtimeMs: 3200, errorType: 'wrong_answer' },
      { eventName: 'run.completed', timestamp: nowIso, runtimeMs: 2100, errorType: 'wrong_answer' },
      { eventName: 'submit.completed', timestamp: nowIso, runtimeMs: 1400, accepted: true, tierUsed: 'T2' },
    ]

    const report = buildRecoveryReport({
      userId,
      userName,
      userEmail,
      userAvatarUrl: typeof body.avatarUrl === 'string' ? body.avatarUrl : null,
      sessionId,
      problemId,
      problemTitle: asOptionalString(body.problemTitle),
      difficulty: asOptionalString(body.difficulty),
      language: asOptionalString(body.language),
      events: mockEvents,
    })

    const pdfBuffer = await generateReportPdf(report)
    const safeUserSlug = sanitizeForFilename(userName || userId, 'guest', 32)
    const safeProblemSlug = sanitizeForFilename(problemId, 'problem', 40)
    const dateStamp = new Date().toISOString().slice(0, 10)
    const filename = `PebbleRecoveryReport_${safeUserSlug}_${safeProblemSlug}_${dateStamp}.pdf`

    sendJson(res, 200, {
      ok: true,
      filename,
      mimeType: 'application/pdf',
      pdfBase64: pdfBuffer.toString('base64'),
    })
  } catch (error) {
    console.error('[api/report/recovery] failed:', error)
    sendJson(res, 500, { error: 'Report generation failed' })
  }
}
