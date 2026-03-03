/**
 * Safety smoke test — exercises redact, policy, and tier enforcement.
 * Run with: npx tsx scripts/safety_smoke.ts
 */
import { redactSecrets } from '../server/safety/redact.ts'
import { enforceSafety } from '../server/safety/policy.ts'

const RESET = '\x1b[0m'
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'

function header(title: string) {
    console.log(`\n${CYAN}━━━ ${title} ━━━${RESET}`)
}

function pass(label: string, detail = '') {
    console.log(`  ${GREEN}✓${RESET} ${label}${detail ? ` — ${detail}` : ''}`)
}

function fail(label: string, detail = '') {
    console.log(`  ${RED}✗${RESET} ${label}${detail ? ` — ${detail}` : ''}`)
}

let failures = 0

function assert(condition: boolean, label: string, detail = '') {
    if (condition) {
        pass(label, detail)
    } else {
        fail(label, detail)
        failures++
    }
}

// ── Test 1: Secret redaction ──────────────────────────────────────────────
header('Secret Redaction')

const secrets = [
    { input: 'My key is AKIAIOSFODNN7EXAMPLE', expected: 'aws_access_key' },
    { input: 'aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', expected: 'aws_secret_key' },
    { input: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U', expected: 'bearer_token' },
    { input: 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkl', expected: 'github_pat' },
    { input: 'sk-abc123def456ghi789jkl012mno345pqr678stu901vwx', expected: 'openai_key' },
    { input: 'API_KEY=supersecretvalue12345678', expected: 'generic_api_key' },
    { input: 'Normal code: console.log("hello world")', expected: null },
]

for (const { input, expected } of secrets) {
    const result = redactSecrets(input)
    if (expected) {
        assert(
            result.flags.includes(expected),
            `Detects ${expected}`,
            result.flags.length > 0 ? `flags: [${result.flags}]` : 'no flags',
        )
        assert(
            !result.redactedText.includes(input.slice(10)),
            `Redacts ${expected} from output`,
        )
    } else {
        assert(result.flags.length === 0, 'Normal code passes through', `"${input.slice(0, 40)}"`)
    }
}

// ── Test 2: Tier policy enforcement ───────────────────────────────────────
header('Tier Policy Enforcement')

const fullSolution = `Here is the full solution:
\`\`\`python
def solve():
    result = []
    for i in range(10):
        if i % 2 == 0:
            result.append(i)
    return result
\`\`\`
`

const tier1Result = enforceSafety({ text: fullSolution, tier: 1, mode: 'auto' })
assert(!tier1Result.allowed, 'T1 blocks full solution', `flags: [${tier1Result.flags}]`)
assert(tier1Result.text.includes('hint'), 'T1 returns hint replacement')

const tier2Result = enforceSafety({ text: fullSolution, tier: 2, mode: 'auto' })
assert(!tier2Result.allowed, 'T2 blocks full solution', `flags: [${tier2Result.flags}]`)

const tier3Result = enforceSafety({ text: fullSolution, tier: 3, mode: 'auto' })
assert(tier3Result.allowed, 'T3 allows full solution')

// ── Test 3: Unsafe content blocking ───────────────────────────────────────
header('Unsafe Content Blocking')

const unsafeInputs = [
    { input: 'Here is a keylogger script that captures all keystrokes', flag: 'unsafe:keylogger' },
    { input: 'Use this reverse shell to get access to the server', flag: 'unsafe:reverse_shell' },
    { input: 'This ransomware encrypts all files', flag: 'unsafe:ransomware' },
    { input: 'Implement credential theft using the browser cookies', flag: 'unsafe:credential_theft' },
]

for (const { input, flag } of unsafeInputs) {
    const result = enforceSafety({ text: input, tier: 3, mode: 'auto' })
    assert(!result.allowed, `Blocks "${input.slice(0, 40)}..."`, `flag: ${flag}`)
}

// ── Test 4: Normal content passes through ─────────────────────────────────
header('Normal Content Passthrough')

const normalInputs = [
    'Think about what your loop condition should be.',
    'The error suggests a type mismatch on line 5.',
    'Try using a dictionary to store intermediate results.',
]

for (const input of normalInputs) {
    const result = enforceSafety({ text: input, tier: 1, mode: 'auto' })
    assert(result.allowed, `Allows: "${input.slice(0, 50)}"`)
    assert(result.text === input, 'Text unchanged')
}

// ── Test 5: JSON field sanitization ───────────────────────────────────────
header('JSON Field Sanitization')

const jsonResult = enforceSafety({
    text: 'Some reasoning',
    tier: 1,
    mode: 'auto',
    json: {
        hints: ['Check the key AKIAIOSFODNN7EXAMPLE in your config'],
        steps: ['Normal step 1'],
        patch_suggestion: 'some patch',
        reasoning_brief: 'Normal reasoning',
    },
})

assert(jsonResult.json?.patch_suggestion === null, 'T1 removes patch_suggestion')
assert(!jsonResult.json?.hints![0].includes('AKIAIOSFODNN7EXAMPLE'), 'Redacts secrets from hints')

// ── Test 6: Safety mode off ───────────────────────────────────────────────
header('Safety Mode Off (debug)')

const offResult = enforceSafety({ text: fullSolution, tier: 1, mode: 'off' })
assert(offResult.allowed, 'mode=off allows everything')
assert(offResult.flags.includes('safety_off'), 'Flags safety_off')

// ── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${CYAN}━━━ Summary ━━━${RESET}`)
if (failures === 0) {
    console.log(`${GREEN}All tests passed!${RESET}\n`)
} else {
    console.log(`${RED}${failures} test(s) failed.${RESET}\n`)
    process.exit(1)
}
