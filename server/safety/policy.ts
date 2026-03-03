/**
 * Tier enforcement and unsafe content blocking.
 * Runs post-model — ensures the model response respects tier limits
 * and contains no malicious guidance, regardless of what the model produced.
 */
import { redactSecrets } from './redact.ts'
import type { HelpTier, SafetyCheckInput, SafetyCheckOutput } from './types.ts'

// ── Full-solution detection heuristics ─────────────────────────────────────

const FULL_SOLUTION_PHRASES = [
    /here\s+(is|are)\s+(the\s+)?(full|complete|entire|final)\s+(solution|code|implementation|answer)/i,
    /full\s+working\s+(solution|code|implementation)/i,
    /complete\s+(solution|implementation|code)\s*(below|here|:)/i,
    /here'?s?\s+(the\s+)?(corrected|fixed|final)\s+(version|code|solution)/i,
    /replace\s+(your\s+)?(entire|whole|full)\s+(code|file|solution)\s+with/i,
]

/**
 * Counts consecutive lines that look like code (indented, or inside fences).
 */
function countMaxConsecutiveCodeLines(text: string): number {
    const lines = text.split('\n')
    let maxRun = 0
    let currentRun = 0
    let inFence = false

    for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('```')) {
            inFence = !inFence
            continue
        }
        if (inFence) {
            currentRun++
            maxRun = Math.max(maxRun, currentRun)
        } else if (/^\s{2,}\S/.test(line) || /^(def |class |function |const |let |var |import |from |return |if |for |while )/.test(trimmed)) {
            currentRun++
            maxRun = Math.max(maxRun, currentRun)
        } else {
            currentRun = 0
        }
    }

    return maxRun
}

function hasFullSolutionMarker(text: string): boolean {
    return FULL_SOLUTION_PHRASES.some(re => re.test(text))
}

// ── Unsafe content patterns ────────────────────────────────────────────────

const UNSAFE_PATTERNS: Array<{ pattern: RegExp; category: string; description: string }> = [
    { pattern: /credential\s*(theft|steal|exfil)/i, category: 'credential_theft', description: 'Credential theft instructions' },
    { pattern: /keylog(ger|ging)/i, category: 'keylogger', description: 'Keylogger code' },
    { pattern: /ransom(ware)?/i, category: 'ransomware', description: 'Ransomware-related' },
    { pattern: /reverse\s*shell/i, category: 'reverse_shell', description: 'Reverse shell instructions' },
    { pattern: /token\s*(exfil|steal|grab|harvest)/i, category: 'token_exfil', description: 'Token exfiltration' },
    { pattern: /\bpersistence\s*(mechanism|backdoor)/i, category: 'persistence', description: 'Persistence/backdoor mechanism' },
    { pattern: /\bexploit\s+(kit|chain|code)\b/i, category: 'exploit', description: 'Exploit code' },
    { pattern: /(?:wget|curl)\s+.*\|\s*(?:bash|sh|python)/i, category: 'remote_exec', description: 'Remote code execution via pipe' },
    { pattern: /\brm\s+-rf\s+\/(?!\w)/g, category: 'destructive_command', description: 'Destructive filesystem command' },
    { pattern: /\b__import__\s*\(\s*['"]os['"]\s*\)/i, category: 'python_os_import', description: 'Dangerous Python OS import' },
    { pattern: /exec\s*\(\s*['"].*(?:rm|del|format|mkfs)/i, category: 'exec_destructive', description: 'Destructive exec call' },
]

function checkUnsafeContent(text: string): { safe: boolean; flags: string[]; descriptions: string[] } {
    const flags: string[] = []
    const descriptions: string[] = []

    for (const rule of UNSAFE_PATTERNS) {
        rule.pattern.lastIndex = 0
        if (rule.pattern.test(text)) {
            flags.push(rule.category)
            descriptions.push(rule.description)
        }
    }

    return { safe: flags.length === 0, flags, descriptions }
}

// ── Tier-appropriate safe replacement messages ─────────────────────────────

function getSafeReplacement(tier: HelpTier, reason: string): string {
    if (tier === 1) {
        return `💡 I can give you a hint instead.\n\nThink about what your code should do step by step. Focus on the core concept and trace through your logic. What does the expected output look like?\n\n_(Response adjusted: ${reason})_`
    }
    if (tier === 2) {
        return `🔍 Let me explain the approach without giving the full answer.\n\nLook at your error output — it tells you exactly which case fails. Compare your logic against the expected behavior for that input. The fix is usually a small adjustment to one condition or calculation.\n\n_(Response adjusted: ${reason})_`
    }
    return `🔧 I'd normally provide a guided fix here, but this specific content was blocked for safety.\n\nTry re-phrasing your question, and I'll give you a safe, helpful answer.\n\n_(${reason})_`
}

// ── Main policy enforcement ────────────────────────────────────────────────

/**
 * Enforces tier policy + unsafe content checks + secret redaction on model output.
 * This is the single entry point for all post-model safety processing.
 */
export function enforceSafety(input: SafetyCheckInput): SafetyCheckOutput {
    const allFlags: string[] = []
    let text = input.text
    let allowed = true
    let blockedReason: string | undefined

    // Skip all checks if safety is explicitly off (dev debug only)
    if (input.mode === 'off') {
        return { text, flags: ['safety_off'], allowed: true }
    }

    // Step 1: Redact secrets from text
    const { redactedText, flags: secretFlags } = redactSecrets(text)
    text = redactedText
    allFlags.push(...secretFlags)

    // Step 2: Check for unsafe content
    const unsafeCheck = checkUnsafeContent(text)
    if (!unsafeCheck.safe) {
        allFlags.push(...unsafeCheck.flags.map(f => `unsafe:${f}`))
        // Block entirely in strict mode or for severe categories
        const severe = unsafeCheck.flags.some(f =>
            ['credential_theft', 'keylogger', 'ransomware', 'reverse_shell', 'token_exfil', 'persistence'].includes(f),
        )
        if (input.mode === 'strict' || severe) {
            allowed = false
            blockedReason = `Blocked: ${unsafeCheck.descriptions.join(', ')}`
            text = getSafeReplacement(input.tier, blockedReason)
            return { text, flags: allFlags, allowed, blockedReason }
        }
    }

    // Step 3: Tier policy enforcement (T1 and T2 only)
    if (input.tier <= 2) {
        const maxCodeLines = input.tier === 1 ? 4 : 8
        const codeLineCount = countMaxConsecutiveCodeLines(text)
        const hasSolutionMarker = hasFullSolutionMarker(text)

        if (hasSolutionMarker || codeLineCount > maxCodeLines) {
            allFlags.push('tier_policy_violation')
            allowed = false
            blockedReason = input.tier === 1
                ? 'Tier 1 allows hints only — full solutions are blocked'
                : 'Tier 2 allows explanations — full solutions are blocked'
            text = getSafeReplacement(input.tier, blockedReason)
            return { text, flags: allFlags, allowed, blockedReason }
        }
    }

    // Step 4: Process JSON fields if provided
    let jsonOutput = input.json ? { ...input.json } as SafetyCheckOutput['json'] : undefined
    if (input.json && jsonOutput) {
        // Redact secrets from all JSON fields
        if (input.json.hints) {
            jsonOutput!.hints = input.json.hints.map(h => redactSecrets(h).redactedText)
        }
        if (input.json.steps) {
            jsonOutput!.steps = input.json.steps.map(s => redactSecrets(s).redactedText)
        }
        if (input.json.patch_suggestion) {
            jsonOutput!.patch_suggestion = redactSecrets(input.json.patch_suggestion).redactedText
        }
        if (input.json.reasoning_brief) {
            jsonOutput!.reasoning_brief = redactSecrets(input.json.reasoning_brief).redactedText
        }

        // Block patch_suggestion in T1/T2
        if (input.tier <= 2 && jsonOutput!.patch_suggestion) {
            jsonOutput!.patch_suggestion = null
            allFlags.push('patch_blocked_tier')
        }

        // Check code length in steps/hints for T1/T2
        if (input.tier <= 2) {
            const maxLines = input.tier === 1 ? 4 : 8
            jsonOutput!.hints = jsonOutput!.hints!.map(h => {
                if (countMaxConsecutiveCodeLines(h) > maxLines) {
                    allFlags.push('hint_code_stripped')
                    return h.replace(/```[\s\S]*?```/g, `\`\`\`\n[Code block removed — Tier ${input.tier} limit]\n\`\`\``)
                }
                return h
            })
            jsonOutput!.steps = jsonOutput!.steps!.map(s => {
                if (countMaxConsecutiveCodeLines(s) > maxLines) {
                    allFlags.push('step_code_stripped')
                    return s.replace(/```[\s\S]*?```/g, `\`\`\`\n[Code block removed — Tier ${input.tier} limit]\n\`\`\``)
                }
                return s
            })
        }
    }

    return { text, flags: allFlags, allowed, blockedReason, json: jsonOutput }
}
