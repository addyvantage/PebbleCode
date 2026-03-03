/**
 * buildRecoveryReport.ts
 * Pure function: takes raw session data, returns a structured report object.
 * No AWS / IO dependencies — fully testable in isolation.
 */

export interface SessionEvent {
    eventName: string
    timestamp: string
    runtimeMs?: number
    exitCode?: number
    tierUsed?: string
    errorType?: string
    accepted?: boolean
    passed?: boolean
}

export interface RecoveryReport {
    userId: string
    sessionId: string
    problemId: string
    generatedAt: string
    totalAttempts: number
    totalRuns: number
    totalSubmits: number
    avgRecoveryTimeSec: number
    autonomyRate: number       // % of attempts using T1 or T2
    hintUsageRate: number      // % of attempts that triggered a hint
    finalOutcome: 'success' | 'partial' | 'incomplete'
    fastestRunMs: number | null
    errorBreakdown: Record<string, number>
}

export function buildRecoveryReport(
    userId: string,
    sessionId: string,
    problemId: string,
    events: SessionEvent[],
): RecoveryReport {
    const runs = events.filter(e => e.eventName === 'run.completed')
    const submits = events.filter(e => e.eventName === 'submit.completed')
    const allAttempts = [...runs, ...submits]

    const successfulSubmit = submits.find(e => e.accepted || e.passed)
    const finalOutcome: RecoveryReport['finalOutcome'] = successfulSubmit
        ? 'success'
        : submits.length > 0
            ? 'partial'
            : 'incomplete'

    const runtimes = allAttempts
        .map(e => e.runtimeMs)
        .filter((ms): ms is number => typeof ms === 'number')

    const avgRecoveryTimeSec = runtimes.length
        ? Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length / 1000)
        : 0

    // Autonomy = used T1 or T2 tier (not T3 / full solution)
    const autonomousAttempts = allAttempts.filter(e =>
        e.tierUsed === 'T1' || e.tierUsed === 'T2',
    )
    const autonomyRate = allAttempts.length
        ? Math.round((autonomousAttempts.length / allAttempts.length) * 100)
        : 100 // if no data, assume autonomous

    // Hint usage: attempts where assistant was called (tierUsed is set at all)
    const hintsUsed = allAttempts.filter(e => e.tierUsed !== undefined)
    const hintUsageRate = allAttempts.length
        ? Math.round((hintsUsed.length / allAttempts.length) * 100)
        : 0

    const errorBreakdown: Record<string, number> = {}
    for (const evt of allAttempts) {
        if (evt.errorType) {
            errorBreakdown[evt.errorType] = (errorBreakdown[evt.errorType] ?? 0) + 1
        }
    }

    return {
        userId,
        sessionId,
        problemId,
        generatedAt: new Date().toISOString(),
        totalAttempts: allAttempts.length,
        totalRuns: runs.length,
        totalSubmits: submits.length,
        avgRecoveryTimeSec,
        autonomyRate,
        hintUsageRate,
        finalOutcome,
        fastestRunMs: runtimes.length ? Math.min(...runtimes) : null,
        errorBreakdown,
    }
}
