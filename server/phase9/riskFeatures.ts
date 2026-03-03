/**
 * Phase 9: Streak Risk Predictor — feature types + local heuristic model.
 *
 * All computation runs on features derived from client-side analytics.
 * No code, secrets, or raw events are accepted or stored here.
 */

export type RiskFeatures = {
  streakDays: number               // current streak
  daysActiveLast7: number          // days with ≥1 solve in last 7 days
  avgRecoveryTimeMsLast7: number   // average ms to recover from failure
  guidanceRelianceLast7: number    // assist/attempt ratio in [0,1]
  autonomyRateLast7: number        // 1 - guidanceRelianceLast7
  breakpointsLast7: number         // struggle clusters in last 7 days
  solvesLast7: number              // submit.accepted count in last 7 days
  lateNightSessionsLast7: number   // sessions between 22:00–04:00
  trendDirection: 'improving' | 'stable' | 'worsening'
}

export type RiskLabel = 'low' | 'medium' | 'high'

export type RiskResult = {
  score: number        // 0–100 (higher = more likely to break streak)
  label: RiskLabel
  factors: string[]   // 3 "why" phrases shown to user
  actions: string[]   // 3 recommended next steps
  model: 'sagemaker' | 'local'
  computedAt: string  // ISO timestamp
}

/**
 * Deterministic heuristic model used when SageMaker is unavailable.
 * Produces stable, human-readable results for hackathon demos.
 */
export function localHeuristicRisk(f: RiskFeatures): RiskResult {
  let score = 0

  // Streak component (weight 30) — fewer days = more risk
  if (f.streakDays === 0) score += 30
  else if (f.streakDays < 3) score += 22
  else if (f.streakDays < 7) score += 12
  else score += 4

  // Activity component (weight 25) — inactive days = risk
  if (f.daysActiveLast7 <= 1) score += 25
  else if (f.daysActiveLast7 <= 3) score += 16
  else if (f.daysActiveLast7 <= 5) score += 8
  else score += 2

  // Solves component (weight 20) — low output = risk
  if (f.solvesLast7 <= 1) score += 20
  else if (f.solvesLast7 <= 3) score += 12
  else if (f.solvesLast7 <= 6) score += 5
  else score += 0

  // Guidance reliance (weight 12) — high reliance = risk
  if (f.guidanceRelianceLast7 > 0.7) score += 12
  else if (f.guidanceRelianceLast7 > 0.5) score += 7
  else if (f.guidanceRelianceLast7 > 0.3) score += 3

  // Struggle clusters (weight 8)
  if (f.breakpointsLast7 >= 5) score += 8
  else if (f.breakpointsLast7 >= 3) score += 5
  else if (f.breakpointsLast7 >= 1) score += 2

  // Trend signal (weight 5)
  if (f.trendDirection === 'worsening') score += 5
  else if (f.trendDirection === 'stable') score += 2

  score = Math.min(100, Math.max(0, score))
  const label: RiskLabel = score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low'

  // ── Factor explanations ───────────────────────────────────────────────
  const factors: string[] = []

  if (f.streakDays === 0) {
    factors.push('No active streak — one missed day set it to zero')
  } else if (f.streakDays < 3) {
    factors.push(`Streak is only ${f.streakDays} day${f.streakDays === 1 ? '' : 's'} — one miss resets it`)
  } else if (f.daysActiveLast7 < 4) {
    factors.push(`Only ${f.daysActiveLast7} active days this week — consistency dropping`)
  } else {
    factors.push(`${f.streakDays}-day streak is healthy — keep daily check-ins`)
  }

  if (f.solvesLast7 <= 2) {
    factors.push('Low solve count this week reduces confidence momentum')
  } else if (f.guidanceRelianceLast7 > 0.5) {
    factors.push('High guidance reliance may signal growing cognitive load')
  } else {
    factors.push('Solve velocity is healthy — maintain the pace')
  }

  if (f.trendDirection === 'worsening') {
    factors.push('Performance trending down over the last two weeks')
  } else if (f.breakpointsLast7 >= 3) {
    factors.push(`${f.breakpointsLast7} struggle clusters detected this week`)
  } else {
    factors.push('Error recovery time is within a healthy range')
  }

  // ── Recommended actions ──────────────────────────────────────────────
  const actions: string[] = []

  if (f.daysActiveLast7 < 5) {
    actions.push('Commit to one 15-min session every day this week')
  } else {
    actions.push('Keep current daily pace — consistency is the foundation')
  }

  if (f.guidanceRelianceLast7 > 0.4) {
    actions.push('Attempt one problem fully before asking for hints')
  } else if (f.solvesLast7 < 3) {
    actions.push('Pick 2 warm-up problems to rebuild momentum')
  } else {
    actions.push('Challenge yourself with a harder problem to grow')
  }

  if (f.trendDirection === 'worsening') {
    actions.push('Review your last 3 mistakes to find a pattern to fix')
  } else {
    actions.push('Log a short reflection after each session')
  }

  return { score, label, factors, actions, model: 'local', computedAt: new Date().toISOString() }
}
