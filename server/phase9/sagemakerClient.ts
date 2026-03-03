/**
 * Phase 9: SageMaker Runtime wrapper for Streak Risk Predictor.
 *
 * Expects a SageMaker endpoint that accepts JSON feature payloads and
 * returns { score: number, label: "low"|"medium"|"high" }.
 *
 * Falls back to localHeuristicRisk() if the endpoint is unavailable or
 * RISK_MODE=local is set.
 */

import type { RiskFeatures, RiskResult } from './riskFeatures.ts'
import { localHeuristicRisk } from './riskFeatures.ts'

/**
 * Invokes a SageMaker endpoint. Throws on any error so the caller
 * can decide whether to fall back to the local model.
 */
async function invokeSageMakerEndpoint(
  features: RiskFeatures,
  endpointName: string,
  region: string,
): Promise<RiskResult> {
  const { SageMakerRuntimeClient, InvokeEndpointCommand } = await import('@aws-sdk/client-sagemaker-runtime')
  const client = new SageMakerRuntimeClient({ region })

  try {
    const payload = JSON.stringify({
      streak_days: features.streakDays,
      days_active_last7: features.daysActiveLast7,
      avg_recovery_ms_last7: features.avgRecoveryTimeMsLast7,
      guidance_reliance_last7: features.guidanceRelianceLast7,
      autonomy_rate_last7: features.autonomyRateLast7,
      breakpoints_last7: features.breakpointsLast7,
      solves_last7: features.solvesLast7,
      late_night_last7: features.lateNightSessionsLast7,
      trend: features.trendDirection,
    })

    const response = await client.send(
      new InvokeEndpointCommand({
        EndpointName: endpointName,
        Body: Buffer.from(payload),
        ContentType: 'application/json',
        Accept: 'application/json',
      }),
    )

    const bodyBytes = response.Body
      ? await response.Body.transformToByteArray()
      : null
    if (!bodyBytes) throw new Error('SageMaker returned empty body')

    const parsed = JSON.parse(Buffer.from(bodyBytes).toString('utf-8')) as unknown

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as Record<string, unknown>).score !== 'number'
    ) {
      throw new Error('SageMaker response missing score field')
    }

    const raw = parsed as Record<string, unknown>
    const score = Math.min(100, Math.max(0, Math.round(raw.score as number)))
    const rawLabel = raw.label
    const label =
      rawLabel === 'low' || rawLabel === 'medium' || rawLabel === 'high'
        ? rawLabel
        : score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low'

    // SageMaker provides score + label; use local model for human-readable factors/actions
    const local = localHeuristicRisk(features)
    return { ...local, score, label, model: 'sagemaker' }
  } finally {
    client.destroy()
  }
}

/**
 * Entry point: tries SageMaker if configured, falls back to local heuristic.
 * Never throws — always returns a valid RiskResult.
 */
export async function computeRisk(features: RiskFeatures): Promise<RiskResult> {
  const riskMode = (process.env.RISK_MODE ?? 'auto') as 'auto' | 'aws' | 'local'
  const endpointName = process.env.SAGEMAKER_ENDPOINT_NAME
  const region = process.env.SAGEMAKER_REGION ?? process.env.AWS_REGION ?? 'us-east-1'

  const useAws = (riskMode === 'aws' || riskMode === 'auto') && !!endpointName

  if (useAws) {
    try {
      return await invokeSageMakerEndpoint(features, endpointName!, region)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn('[risk] SageMaker failed, falling back to local model:', msg.slice(0, 120))
    }
  }

  return localHeuristicRisk(features)
}
