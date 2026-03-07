export type RiskFeatures = {
  streakDays: number
  daysActiveLast7: number
  avgRecoveryTimeMsLast7: number
  guidanceRelianceLast7: number
  autonomyRateLast7: number
  breakpointsLast7: number
  solvesLast7: number
  lateNightSessionsLast7: number
  trendDirection: 'improving' | 'stable' | 'worsening'
}

export type RiskLabel = 'low' | 'medium' | 'high'

export type RiskResult = {
  score: number
  label: RiskLabel
  factors: string[]
  actions: string[]
  model: 'sagemaker' | 'local'
  computedAt: string
}

export function localHeuristicRisk(f: RiskFeatures): RiskResult {
  let score = 0

  if (f.streakDays === 0) score += 30
  else if (f.streakDays < 3) score += 22
  else if (f.streakDays < 7) score += 12
  else score += 4

  if (f.daysActiveLast7 <= 1) score += 25
  else if (f.daysActiveLast7 <= 3) score += 16
  else if (f.daysActiveLast7 <= 5) score += 8
  else score += 2

  if (f.solvesLast7 <= 1) score += 20
  else if (f.solvesLast7 <= 3) score += 12
  else if (f.solvesLast7 <= 6) score += 5

  if (f.guidanceRelianceLast7 > 0.7) score += 12
  else if (f.guidanceRelianceLast7 > 0.5) score += 7
  else if (f.guidanceRelianceLast7 > 0.3) score += 3

  if (f.breakpointsLast7 >= 5) score += 8
  else if (f.breakpointsLast7 >= 3) score += 5
  else if (f.breakpointsLast7 >= 1) score += 2

  if (f.trendDirection === 'worsening') score += 5
  else if (f.trendDirection === 'stable') score += 2

  score = Math.min(100, Math.max(0, score))
  const label: RiskLabel = score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low'

  const factors: string[] = []

  if (f.streakDays === 0) {
    factors.push('No active streak right now, so one more skipped day compounds quickly.')
  } else if (f.streakDays < 3) {
    factors.push(`The streak is only ${f.streakDays} day${f.streakDays === 1 ? '' : 's'}, so consistency is still fragile.`)
  } else if (f.daysActiveLast7 < 4) {
    factors.push(`Only ${f.daysActiveLast7} active days were recorded this week, which weakens momentum.`)
  } else {
    factors.push(`${f.streakDays}-day streak is healthy. The main goal is to keep the daily rhythm stable.`)
  }

  if (f.solvesLast7 <= 2) {
    factors.push('Low solve volume this week suggests momentum has not fully settled yet.')
  } else if (f.guidanceRelianceLast7 > 0.5) {
    factors.push('Guidance reliance is elevated, which can signal rising cognitive load.')
  } else {
    factors.push('Solve velocity is in a healthy range for the last seven days.')
  }

  if (f.trendDirection === 'worsening') {
    factors.push('Recent pass-rate trend is slipping compared with the previous week.')
  } else if (f.breakpointsLast7 >= 3) {
    factors.push(`${f.breakpointsLast7} struggle clusters appeared this week, which is worth addressing early.`)
  } else {
    factors.push('Recovery time remains within a stable range, which helps protect the streak.')
  }

  const actions: string[] = []

  if (f.daysActiveLast7 < 5) {
    actions.push('Commit to one short daily practice session for the next seven days.')
  } else {
    actions.push('Keep the current daily pace and protect it with one easy warm-up problem.')
  }

  if (f.guidanceRelianceLast7 > 0.4) {
    actions.push('Try one problem without hints first, then use Coach only after the first failed run.')
  } else if (f.solvesLast7 < 3) {
    actions.push('Use two quick wins to rebuild momentum before taking on a harder session.')
  } else {
    actions.push('Use one stretch problem this week to turn consistency into growth.')
  }

  if (f.trendDirection === 'worsening') {
    actions.push('Review the last few failed attempts and fix one repeated pattern deliberately.')
  } else {
    actions.push('End each session with one short reflection so the next run starts clearer.')
  }

  return {
    score,
    label,
    factors,
    actions,
    model: 'local',
    computedAt: new Date().toISOString(),
  }
}
