import { storageKeys } from './storageKeys'

export type SessionInsight = {
  sessionId: string
  struggleScorePeak: number
  recoveryMode: 'guided' | 'skipped'
  recoveryEffectivenessScore: number
  totalRecoveryTime: number
  timeToDecisionSec: number
  timeInGuidedFixSec: number
  applyFixUsed: boolean
  timestamp: number
}

function toSessionInsight(value: unknown): SessionInsight | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<SessionInsight>

  if (
    typeof candidate.sessionId !== 'string' ||
    typeof candidate.struggleScorePeak !== 'number' ||
    (candidate.recoveryMode !== 'guided' && candidate.recoveryMode !== 'skipped') ||
    typeof candidate.recoveryEffectivenessScore !== 'number' ||
    typeof candidate.totalRecoveryTime !== 'number' ||
    typeof candidate.timestamp !== 'number'
  ) {
    return null
  }

  return {
    sessionId: candidate.sessionId,
    struggleScorePeak: candidate.struggleScorePeak,
    recoveryMode: candidate.recoveryMode,
    recoveryEffectivenessScore: candidate.recoveryEffectivenessScore,
    totalRecoveryTime: candidate.totalRecoveryTime,
    timeToDecisionSec:
      typeof candidate.timeToDecisionSec === 'number' ? candidate.timeToDecisionSec : 0,
    timeInGuidedFixSec:
      typeof candidate.timeInGuidedFixSec === 'number' ? candidate.timeInGuidedFixSec : 0,
    applyFixUsed:
      typeof candidate.applyFixUsed === 'boolean'
        ? candidate.applyFixUsed
        : candidate.recoveryMode === 'guided',
    timestamp: candidate.timestamp,
  }
}

export function getSessionInsights() {
  if (typeof window === 'undefined') {
    return [] as SessionInsight[]
  }

  const raw = window.localStorage.getItem(storageKeys.sessionInsights)
  if (!raw) {
    return [] as SessionInsight[]
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return [] as SessionInsight[]
    }

    return parsed.map(toSessionInsight).filter((entry): entry is SessionInsight => entry !== null)
  } catch {
    return [] as SessionInsight[]
  }
}

export function appendSessionInsight(nextInsight: SessionInsight) {
  if (typeof window === 'undefined') {
    return
  }

  const existing = getSessionInsights()
  const next = [...existing, nextInsight].slice(-120)
  window.localStorage.setItem(storageKeys.sessionInsights, JSON.stringify(next))
}
