/**
 * Bedrock Guardrails adapter.
 * If guardrail env vars are present, wraps Bedrock calls with guardrail evaluation.
 * Otherwise, returns null to indicate local-only safety mode.
 */
import { BedrockRuntimeClient, InvokeModelCommand, type InvokeModelCommandInput } from '@aws-sdk/client-bedrock-runtime'
import type { GuardrailConfig, HelpTier, SafetyMode } from './types.ts'
import { enforceSafety } from './policy.ts'
import { redactForLog } from './redact.ts'

/**
 * Reads guardrail configuration from environment variables.
 * Returns null if guardrails aren't configured (local fallback mode).
 */
export function getGuardrailConfig(): GuardrailConfig | null {
    const guardrailId = process.env.BEDROCK_GUARDRAIL_ID
    const guardrailVersion = process.env.BEDROCK_GUARDRAIL_VERSION || 'DRAFT'
    const region = process.env.AWS_REGION
    const modelId = process.env.BEDROCK_MODEL_ID

    if (!guardrailId || !region || !modelId) {
        return null
    }

    return { guardrailId, guardrailVersion, region, modelId }
}

/**
 * Gets the current safety mode from environment.
 */
export function getSafetyMode(): SafetyMode {
    const mode = process.env.SAFETY_MODE as SafetyMode | undefined
    if (mode === 'off' || mode === 'strict') return mode
    return 'auto' // default
}

interface CallModelInput {
    userText: string
    systemText: string
    tier: HelpTier
    maxTokens?: number
    temperature?: number
}

interface CallModelOutput {
    text: string
    safetyFlags: string[]
    guardrailUsed: boolean
    blocked: boolean
    blockedReason?: string
}

/**
 * Calls the model with safety applied.
 * - If Bedrock Guardrails are configured, sends to Bedrock with guardrail config attached.
 * - Always applies local post-model safety (redact + tier policy) regardless.
 * - If no AWS creds at all, returns a message indicating local-only mode.
 */
export async function callModelWithSafety(input: CallModelInput): Promise<CallModelOutput> {
    const config = getGuardrailConfig()
    const mode = getSafetyMode()

    // Safe logging: never log full user code
    console.log(`[safety] mode=${mode} tier=${input.tier} guardrails=${config ? 'enabled' : 'local'} userTextLen=${input.userText.length}`)

    let rawModelText = ''
    let guardrailUsed = false
    const allFlags: string[] = []

    if (config) {
        // ── Bedrock with Guardrails ──────────────────────────────────────────
        guardrailUsed = true
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

        const clientConfig: ConstructorParameters<typeof BedrockRuntimeClient>[0] = {
            region: config.region,
        }
        if (accessKeyId && secretAccessKey) {
            clientConfig.credentials = { accessKeyId, secretAccessKey }
        }

        const client = new BedrockRuntimeClient(clientConfig)

        try {
            const commandInput: InvokeModelCommandInput = {
                modelId: config.modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    anthropic_version: 'bedrock-2023-05-31',
                    max_tokens: input.maxTokens ?? 400,
                    temperature: input.temperature ?? 0.35,
                    system: input.systemText,
                    messages: [
                        {
                            role: 'user',
                            content: [{ type: 'text', text: input.userText }],
                        },
                    ],
                }),
                guardrailIdentifier: config.guardrailId,
                guardrailVersion: config.guardrailVersion,
            }

            const response = await client.send(new InvokeModelCommand(commandInput))
            const responseBody = new TextDecoder().decode(response.body)

            if (!responseBody) {
                allFlags.push('bedrock_empty_response')
                rawModelText = ''
            } else {
                try {
                    const parsed = JSON.parse(responseBody) as Record<string, unknown>

                    // Check if guardrail blocked the response
                    const guardrailAction = parsed['amazon-bedrock-guardrailAction'] as string | undefined
                    if (guardrailAction === 'BLOCKED') {
                        allFlags.push('guardrail_blocked')
                        rawModelText = ''
                    } else {
                        // Extract text from content array
                        const content = parsed.content as Array<{ type?: string; text?: string }> | undefined
                        rawModelText = content?.find(c => c.type === 'text')?.text?.trim() ?? ''
                    }

                    // Check for guardrail trace
                    const trace = parsed['amazon-bedrock-trace'] as Record<string, unknown> | undefined
                    if (trace?.guardrail) {
                        const guardrailTrace = trace.guardrail as Record<string, unknown>
                        if (guardrailTrace.inputAssessment || guardrailTrace.outputAssessment) {
                            allFlags.push('guardrail_assessed')
                        }
                    }
                } catch {
                    allFlags.push('bedrock_malformed_json')
                    rawModelText = ''
                }
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error'
            console.error('[safety] Bedrock call failed:', redactForLog(errMsg))
            allFlags.push('bedrock_error')
            rawModelText = ''
        } finally {
            client.destroy()
        }
    }

    // If no model text (no Bedrock, or Bedrock failed/blocked), we let the
    // caller handle it — return empty text with flags
    if (!rawModelText && guardrailUsed) {
        // Guardrail blocked or Bedrock failed — apply local safety to a refusal
        const safetyResult = enforceSafety({
            text: 'I can\'t help with that specific request. Try rephrasing your question.',
            tier: input.tier,
            mode,
        })
        return {
            text: safetyResult.text,
            safetyFlags: [...allFlags, ...safetyResult.flags],
            guardrailUsed,
            blocked: true,
            blockedReason: allFlags.includes('guardrail_blocked')
                ? 'Blocked by Bedrock Guardrails'
                : 'Bedrock returned empty response',
        }
    }

    // ── Local post-model safety (always runs) ───────────────────────────────
    const safetyResult = enforceSafety({
        text: rawModelText,
        tier: input.tier,
        mode,
    })

    return {
        text: safetyResult.text,
        safetyFlags: [...allFlags, ...safetyResult.flags],
        guardrailUsed,
        blocked: !safetyResult.allowed,
        blockedReason: safetyResult.blockedReason,
    }
}
