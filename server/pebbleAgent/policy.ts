/**
 * Tier policy enforcement and safety filters for the Pebble Agent.
 * Runs server-side only — never in the browser bundle.
 */
import type { AgentResponse, HelpTier } from './types.ts'

// ── Secrets patterns (never leak these) ────────────────────────────────────
const SECRET_PATTERNS = [
    /AKIA[0-9A-Z]{16}/g,                          // AWS access key
    /aws[_-]?secret[_-]?access[_-]?key\s*[:=]/gi, // AWS secret label
    /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g,           // Bearer tokens
    /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,   // Private keys
    /ghp_[a-zA-Z0-9]{36}/g,                       // GitHub PAT
    /sk-[a-zA-Z0-9]{20,}/g,                       // OpenAI-style keys
]

// ── Unsafe code patterns ───────────────────────────────────────────────────
const UNSAFE_CODE_PATTERNS = [
    /\beval\s*\(/gi,
    /\bexec\s*\(/gi,
    /\bos\.system\s*\(/gi,
    /\bsubprocess\.\w+\s*\(/gi,
    /\brm\s+-rf\s+\//gi,
    /\b__import__\s*\(/gi,
]

/**
 * Scans text for secrets and unsafe patterns.
 * Returns the cleaned text + list of safety flags raised.
 */
export function runSafetyFilter(text: string): { cleaned: string; flags: string[] } {
    const flags: string[] = []
    let cleaned = text

    for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(cleaned)) {
            flags.push('secret_redacted')
            cleaned = cleaned.replace(pattern, '[REDACTED]')
        }
        pattern.lastIndex = 0 // reset global regex
    }

    for (const pattern of UNSAFE_CODE_PATTERNS) {
        if (pattern.test(cleaned)) {
            flags.push('unsafe_code_warning')
        }
        pattern.lastIndex = 0
    }

    return { cleaned, flags }
}

/**
 * Enforces tier policy on an agent response.
 * - Tier 1: strips code blocks > 3 lines, removes patch_suggestion
 * - Tier 2: strips code blocks > 6 lines, removes patch_suggestion
 * - Tier 3: allows everything
 */
export function enforceTierPolicy(tier: HelpTier, response: AgentResponse): AgentResponse {
    const result = { ...response, tier }

    if (tier <= 2) {
        // Remove patch suggestions for non-T3
        result.patch_suggestion = null
    }

    const maxCodeLines = tier === 1 ? 3 : tier === 2 ? 6 : Infinity

    // Scan steps and hints for code blocks exceeding the limit
    result.steps = result.steps.map(step => stripLongCodeBlocks(step, maxCodeLines, tier))
    result.hints = result.hints.map(hint => stripLongCodeBlocks(hint, maxCodeLines, tier))

    // Apply safety filter to all text fields
    const allText = [
        result.reasoning_brief,
        ...result.steps,
        ...result.hints,
        result.patch_suggestion ?? '',
    ].join('\n')

    const { flags } = runSafetyFilter(allText)
    result.safety_flags = [...new Set([...result.safety_flags, ...flags])]

    // Clean each field individually
    result.reasoning_brief = runSafetyFilter(result.reasoning_brief).cleaned
    result.steps = result.steps.map(s => runSafetyFilter(s).cleaned)
    result.hints = result.hints.map(h => runSafetyFilter(h).cleaned)
    if (result.patch_suggestion) {
        result.patch_suggestion = runSafetyFilter(result.patch_suggestion).cleaned
    }

    return result
}

function stripLongCodeBlocks(text: string, maxLines: number, tier: HelpTier): string {
    // Match fenced code blocks
    return text.replace(/```[\s\S]*?```/g, (block) => {
        const lines = block.split('\n')
        if (lines.length - 2 > maxLines) { // subtract opening/closing fence
            return `\`\`\`\n[Code block redacted — Tier ${tier} limits code to ${maxLines} lines. Request Tier 3 for full solution.]\n\`\`\``
        }
        return block
    })
}

/**
 * Returns the tier-appropriate system instruction for the Bedrock prompt.
 */
export function getTierInstruction(tier: HelpTier): string {
    switch (tier) {
        case 1:
            return `TIER 1 RULES (STRICT):
- Provide HINTS ONLY. Never give full solutions or complete code.
- Maximum 3 lines of code in any hint.
- Guide the student to think, don't solve for them.
- Focus on: what concept to review, what direction to look.`
        case 2:
            return `TIER 2 RULES:
- Explain the root cause of the error clearly.
- Provide guided approach/steps to fix it.
- Show small code snippets (max 6 lines) to illustrate a concept.
- Do NOT give the full working solution.`
        case 3:
            return `TIER 3 RULES:
- Full guided fix allowed. You may provide near-complete solutions.
- Include a patch_suggestion with a small diff showing the fix.
- Still explain WHY the fix works, don't just dump code.`
    }
}
