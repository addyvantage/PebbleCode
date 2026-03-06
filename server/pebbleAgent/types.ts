/** Shared types for the Pebble Agent loop. */

export type HelpTier = 1 | 2 | 3

export interface AgentRequest {
    tier: HelpTier
    question: string
    codeExcerpt: string
    language: string
    executionMode?: 'function' | 'stdio'
    requiredSignature?: string
    detectedSignature?: string
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
}

export interface AgentResponse {
    tier: HelpTier
    intent: string
    reasoning_brief: string
    steps: string[]
    hints: string[]
    patch_suggestion: string | null
    safety_flags: string[]
}

/** Tool definitions — these run server-side only, pulling data from the request. */
export type ToolName =
    | 'read_current_code_excerpt'
    | 'read_last_run_results'
    | 'generate_next_step_patch'

export interface ToolResult {
    tool: ToolName
    output: string
}
