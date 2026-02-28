type RunLanguage = 'python' | 'javascript' | 'cpp' | 'java' | 'c'

export type RunRequestPayload = {
  language: RunLanguage
  code: string
  stdin?: string
  timeoutMs?: number
}

export type RunApiResponse = {
  ok: boolean
  exitCode: number | null
  stdout: string
  stderr: string
  timedOut: boolean
  durationMs: number
}

const DEFAULT_TIMEOUT_MS = 15_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeRunResponse(payload: unknown): RunApiResponse {
  if (!isRecord(payload)) {
    return {
      ok: false,
      exitCode: null,
      stdout: '',
      stderr: 'Runner returned an invalid response.',
      timedOut: false,
      durationMs: 0,
    }
  }

  return {
    ok: payload.ok === true,
    exitCode: typeof payload.exitCode === 'number' || payload.exitCode === null ? payload.exitCode : null,
    stdout: typeof payload.stdout === 'string' ? payload.stdout : '',
    stderr: typeof payload.stderr === 'string' ? payload.stderr : '',
    timedOut: payload.timedOut === true,
    durationMs: typeof payload.durationMs === 'number' ? payload.durationMs : 0,
  }
}

async function parseJsonSafely(response: Response) {
  const text = await response.text().catch(() => '')
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export async function requestRunApi(
  payload: RunRequestPayload,
  options?: { requestTimeoutMs?: number },
): Promise<RunApiResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    Math.max(1_000, options?.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS),
  )

  try {
    const response = await fetch('/api/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        language: payload.language === 'c' ? 'cpp' : payload.language,
      }),
      signal: controller.signal,
    })

    const parsed = await parseJsonSafely(response)
    const normalized = normalizeRunResponse(parsed)
    if (!response.ok) {
      const message = normalized.stderr.trim() || `Runner request failed with status ${response.status}.`
      return {
        ...normalized,
        ok: false,
        stderr: message,
      }
    }

    return normalized
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        ok: false,
        exitCode: null,
        stdout: '',
        stderr: 'Runner request timed out while waiting for /api/run.',
        timedOut: true,
        durationMs: 0,
      }
    }

    return {
      ok: false,
      exitCode: null,
      stdout: '',
      stderr: 'Failed to reach /api/run.',
      timedOut: false,
      durationMs: 0,
    }
  } finally {
    clearTimeout(timeout)
  }
}
