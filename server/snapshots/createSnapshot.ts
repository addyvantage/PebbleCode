import { randomUUID } from 'crypto'

export interface SnapshotPayload {
    problemId: string
    finalCode: string
    language: string
    status: string
    runtimeMs: number
    recoveryTimeMs: number
    userId?: string
}

export interface Snapshot extends SnapshotPayload {
    snapshotId: string
    createdAt: string
    shareUrl: string
}

/**
 * Creates a secure snapshot record (no secrets, trimmed code).
 * Returns the id + URL — storage handled by caller.
 */
export function buildSnapshot(payload: SnapshotPayload, baseUrl: string): Snapshot {
    const snapshotId = randomUUID()
    const shareUrl = `${baseUrl}/share/${snapshotId}`

    // Sanitize: trim code, strip anything secret-looking
    const safeCode = payload.finalCode
        .slice(0, 5000) // hard cap
        .replace(/(?:api[_-]?key|secret|token|password)\s*=\s*['"]?[^\s'"]{4,}['"]?/gi, '[REDACTED]')

    return {
        snapshotId,
        problemId: payload.problemId,
        finalCode: safeCode,
        language: payload.language,
        status: payload.status,
        runtimeMs: payload.runtimeMs,
        recoveryTimeMs: payload.recoveryTimeMs,
        userId: payload.userId,
        createdAt: new Date().toISOString(),
        shareUrl,
    }
}
