/** Shared types for the Pebble Safety & Policy layer. */

export type SafetyMode = 'auto' | 'strict' | 'off'

export type HelpTier = 1 | 2 | 3

export interface SafetyResult {
    /** The sanitized output text */
    text: string
    /** Whether the output was allowed through */
    allowed: boolean
    /** Safety flags raised during processing */
    flags: string[]
    /** If blocked, the reason */
    blockedReason?: string
}

export interface GuardrailConfig {
    guardrailId: string
    guardrailVersion: string
    region: string
    modelId: string
}

export interface SafetyCheckInput {
    text: string
    tier: HelpTier
    mode: SafetyMode
    /** If provided, also sanitize JSON fields */
    json?: {
        hints?: string[]
        steps?: string[]
        patch_suggestion?: string | null
        reasoning_brief?: string
    }
}

export interface SafetyCheckOutput {
    text: string
    flags: string[]
    allowed: boolean
    blockedReason?: string
    json?: {
        hints: string[]
        steps: string[]
        patch_suggestion: string | null
        reasoning_brief: string
    }
}
