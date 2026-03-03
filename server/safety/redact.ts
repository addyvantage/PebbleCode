/**
 * Secret redaction module.
 * Deterministic regex-based detection and redaction of common secrets.
 * Designed to catch obvious leaks without over-redacting normal code.
 */

interface RedactResult {
    redactedText: string
    flags: string[]
}

// ── Secret patterns ────────────────────────────────────────────────────────
// Each entry: [pattern, flag name, replacement]
const SECRET_RULES: Array<{ pattern: RegExp; flag: string; replacement: string }> = [
    // AWS Access Key ID (always 20 uppercase alphanumeric, prefixed AKIA)
    {
        pattern: /\bAKIA[0-9A-Z]{16}\b/g,
        flag: 'aws_access_key',
        replacement: 'AKIA[REDACTED]',
    },
    // AWS Secret Access Key (40 chars base64-like, often after = or :)
    {
        pattern: /(?<=aws_secret_access_key\s*[:=]\s*['"]?)[A-Za-z0-9/+=]{35,45}\b/gi,
        flag: 'aws_secret_key',
        replacement: '[REDACTED_SECRET]',
    },
    // Generic AWS secret key label (redact the whole line value)
    {
        pattern: /\b(aws[_-]?secret[_-]?access[_-]?key)\s*[:=]\s*\S+/gi,
        flag: 'aws_secret_key',
        replacement: '$1=[REDACTED]',
    },
    // AWS Session Token
    {
        pattern: /\b(aws[_-]?session[_-]?token)\s*[:=]\s*\S+/gi,
        flag: 'aws_session_token',
        replacement: '$1=[REDACTED]',
    },
    // Bearer tokens (JWT-like or opaque)
    {
        pattern: /Bearer\s+[A-Za-z0-9\-._~+/]{20,}[=]*/g,
        flag: 'bearer_token',
        replacement: 'Bearer [REDACTED]',
    },
    // Private keys (PEM format)
    {
        pattern: /-----BEGIN\s+(RSA\s+|EC\s+|DSA\s+|OPENSSH\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(RSA\s+|EC\s+|DSA\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/g,
        flag: 'private_key',
        replacement: '[PRIVATE_KEY_REDACTED]',
    },
    // GitHub PAT (ghp_, gho_, ghu_, ghs_, ghr_)
    {
        pattern: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/g,
        flag: 'github_pat',
        replacement: '[GITHUB_TOKEN_REDACTED]',
    },
    // OpenAI-style keys (sk-...)
    {
        pattern: /\bsk-[A-Za-z0-9]{20,}\b/g,
        flag: 'openai_key',
        replacement: '[API_KEY_REDACTED]',
    },
    // Slack tokens (xoxb-, xoxp-, xoxs-, xoxa-)
    {
        pattern: /\bxox[bpsa]-[A-Za-z0-9\-]{10,}\b/g,
        flag: 'slack_token',
        replacement: '[SLACK_TOKEN_REDACTED]',
    },
    // Generic API key assignments (e.g., API_KEY=..., apiKey: "...")
    {
        pattern: /\b(api[_-]?key|apikey)\s*[:=]\s*['"]?[A-Za-z0-9\-._]{16,}['"]?/gi,
        flag: 'generic_api_key',
        replacement: '$1=[REDACTED]',
    },
    // Env var dumps (lines like SECRET_SOMETHING=value)
    {
        pattern: /^((?:SECRET|TOKEN|PASSWORD|CREDENTIAL|AUTH)[A-Z_]*)\s*=\s*\S+$/gm,
        flag: 'env_var_dump',
        replacement: '$1=[REDACTED]',
    },
]

/**
 * Redacts secrets from text.
 * Returns the cleaned text + list of unique flags for what was found.
 */
export function redactSecrets(text: string): RedactResult {
    const flags = new Set<string>()
    let redacted = text

    for (const rule of SECRET_RULES) {
        // Reset lastIndex for global regexes
        rule.pattern.lastIndex = 0
        if (rule.pattern.test(redacted)) {
            flags.add(rule.flag)
        }
        rule.pattern.lastIndex = 0
        redacted = redacted.replace(rule.pattern, rule.replacement)
    }

    return {
        redactedText: redacted,
        flags: [...flags],
    }
}

/**
 * Redacts secrets from a log message (for safe console output).
 * More aggressive than output redaction — removes anything that looks sensitive.
 */
export function redactForLog(text: string): string {
    const { redactedText } = redactSecrets(text)
    // Additionally truncate to prevent huge log dumps
    return redactedText.length > 500 ? `${redactedText.slice(0, 500)}...[truncated]` : redactedText
}
