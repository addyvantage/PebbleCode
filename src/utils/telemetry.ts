export type TelemetrySnapshot = {
  keysPerSecond: number
  idleSeconds: number
  backspaceBurstCount: number
  runAttempts: number
  repeatErrorCount: number
}

type StruggleContext = {
  runStatus: 'idle' | 'error' | 'success'
  phase: 'struggle' | 'recovery' | 'complete'
  isAfk?: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function computeStruggleScore(
  snapshot: TelemetrySnapshot,
  context: StruggleContext,
) {
  // Weighting keeps early noise low: idle/backspace rise slowly, repeated failures carry most weight, and success/recovery damp quickly.
  let score = 16

  if (!context.isAfk) {
    score += Math.min(18, snapshot.idleSeconds * 1.2)
  }
  score += Math.min(14, snapshot.backspaceBurstCount * 2.8)
  score += Math.min(36, snapshot.repeatErrorCount * 7.5)

  if (!context.isAfk && snapshot.keysPerSecond < 1) {
    score += (1 - snapshot.keysPerSecond) * 12
  }

  if (snapshot.keysPerSecond > 2.1) {
    score -= Math.min(12, (snapshot.keysPerSecond - 2.1) * 7)
  }

  if (context.phase === 'recovery') {
    score -= 20
  }

  if (context.runStatus === 'success') {
    score -= 32
  }

  if (context.runStatus === 'error' && snapshot.runAttempts > 1) {
    score += 4
  }

  return clamp(Math.round(score), 0, 100)
}
