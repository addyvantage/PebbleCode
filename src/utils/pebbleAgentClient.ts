/**
 * Client for the Pebble Agent endpoint.
 * POSTs to /api/pebble-agent and returns typed AgentResponse.
 */

export type HelpTier = 1 | 2 | 3

export interface AgentResponse {
    tier: HelpTier
    intent: string
    reasoning_brief: string
    steps: string[]
    hints: string[]
    patch_suggestion: string | null
    safety_flags: string[]
}

export interface AgentRequestInput {
    tier: HelpTier
    question: string
    codeExcerpt: string
    language: string
    runStatus: string
    runMessage: string
    failingSummary: string
    unitTitle: string
    unitConcept: string
    struggleContext: {
        runFailStreak: number
        timeStuckSeconds: number
        lastErrorType: string | null
        level: number
    }
    signal?: AbortSignal
}

const AGENT_TIMEOUT_MS = 25_000

export async function askPebbleAgent(input: AgentRequestInput): Promise<AgentResponse> {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS)

    // Bridge external abort signal
    const onExternalAbort = () => controller.abort()
    if (input.signal) {
        if (input.signal.aborted) {
            controller.abort()
        } else {
            input.signal.addEventListener('abort', onExternalAbort, { once: true })
        }
    }

    try {
        const { signal: _, ...body } = input

        const response = await fetch('/api/pebble-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        })

        if (!response.ok) {
            const errBody = await response.text().catch(() => '')
            throw new Error(`Agent request failed (HTTP ${response.status}): ${errBody.slice(0, 200)}`)
        }

        const data = await response.json() as AgentResponse
        return data
    } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            // Return a minimal fallback on timeout/abort
            return {
                tier: input.tier,
                intent: 'Request timed out',
                reasoning_brief: 'The request was cancelled or timed out. Try again with a simpler question.',
                steps: [],
                hints: ['Try breaking your question into smaller parts.'],
                patch_suggestion: null,
                safety_flags: ['timeout'],
            }
        }
        throw err
    } finally {
        window.clearTimeout(timer)
        input.signal?.removeEventListener('abort', onExternalAbort)
    }
}
