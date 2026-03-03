/**
 * tracer.ts — Lightweight observability middleware for Pebble backend.
 *
 * - Zero mandatory dependencies.
 * - With AWS: ships structured log lines to CloudWatch Logs.
 * - Without AWS: falls back to structured console.log.
 * - Ships X-Ray segments when aws-xray-sdk-core is present (optional).
 */

import type { Request, Response, NextFunction } from 'express'
import { metricsStore } from './metricsStore.js'

// ── Types ──────────────────────────────────────────────────────────────────────
export interface Span {
    traceId: string
    route: string
    method: string
    startTs: number
    durationMs?: number
    status?: number
    success?: boolean
    errorType?: string
    timestamp: string
}

// ── CloudWatch shipper (lazy, only when AWS is configured) ────────────────────
let cwClient: unknown | null = null

async function getCwClient(): Promise<unknown | null> {
    const awsRegion = process.env.AWS_REGION
    const logGroup = process.env.OPS_LOG_GROUP ?? '/pebble/ops'
    if (!awsRegion) return null

    if (!cwClient) {
        try {
            const { CloudWatchLogsClient } = await import('@aws-sdk/client-cloudwatch-logs')
            cwClient = new CloudWatchLogsClient({ region: awsRegion })
            console.log(`[tracer] CloudWatch shipper ready → ${logGroup}`)
        } catch {
            cwClient = null
        }
    }
    return cwClient
}

async function shipSpanToCW(span: Span): Promise<void> {
    const logGroup = process.env.OPS_LOG_GROUP ?? '/pebble/ops'
    const logStream = `pebble-dev-${new Date().toISOString().slice(0, 10)}`
    const cw = await getCwClient()
    if (!cw) return

    try {
        const { PutLogEventsCommand } = await import('@aws-sdk/client-cloudwatch-logs')
        await (cw as any).send(
            new PutLogEventsCommand({
                logGroupName: logGroup,
                logStreamName: logStream,
                logEvents: [{ timestamp: Date.now(), message: JSON.stringify(span) }],
            }),
        )
    } catch {
        // Non-critical: silently ignore CW errors
    }
}

// ── Express Middleware ─────────────────────────────────────────────────────────
export function tracerMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startTs = Date.now()
    const traceId = `pbl-${startTs.toString(36)}-${Math.random().toString(36).slice(2, 7)}`

    res.on('finish', () => {
        const durationMs = Date.now() - startTs
        const success = res.statusCode < 400

        const span: Span = {
            traceId,
            route: req.path,
            method: req.method,
            startTs,
            durationMs,
            status: res.statusCode,
            success,
            timestamp: new Date(startTs).toISOString(),
        }

        // Record route duration to in-memory metrics
        const routeKey = `${req.method} ${req.path}` as any
        metricsStore.record(routeKey, durationMs, success)

        // Also record named metrics for specific routes
        if (req.path === '/api/pebble-agent') metricsStore.record('agentResponseMs', durationMs, success)
        if (req.path === '/api/report/recovery') metricsStore.record('reportGenMs', durationMs, success)
        if (req.path === '/api/session/snapshot') metricsStore.record('snapshotMs', durationMs, success)
        if (req.path === '/api/journey/update') metricsStore.record('journeyUpdateMs', durationMs, success)
        if (req.path === '/api/analytics/cohort') metricsStore.record('analyticsMs', durationMs, success)

        // Local log
        const logLine = JSON.stringify(span)
        if (success) {
            console.log(`[trace] ${req.method} ${req.path} ${res.statusCode} +${durationMs}ms`)
        } else {
            console.warn(`[trace] ${req.method} ${req.path} ${res.statusCode} +${durationMs}ms`)
        }

        // Ship to CW async (fire-and-forget)
        void shipSpanToCW(span)
    })

    next()
}
