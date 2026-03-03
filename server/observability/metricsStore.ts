/**
 * metricsStore.ts — Rolling in-memory metrics collector.
 *
 * Stores the last N samples per named metric key.
 * Provides avg, p95, min, max, count, and the raw sample array.
 */

const WINDOW = 100 // keep last 100 samples per key

interface Sample {
    value: number
    success: boolean
    ts: number
}

export interface MetricSummary {
    key: string
    count: number
    avg: number
    p95: number
    min: number
    max: number
    errorRate: number  // 0–100 %
    samples: number[]  // last 20 for sparkline
}

class MetricsStore {
    private data = new Map<string, Sample[]>()

    record(key: string, valueMs: number, success = true): void {
        if (!this.data.has(key)) this.data.set(key, [])
        const arr = this.data.get(key)!
        arr.push({ value: valueMs, success, ts: Date.now() })
        // Trim to window
        if (arr.length > WINDOW) arr.splice(0, arr.length - WINDOW)
    }

    getSummary(key: string): MetricSummary | null {
        const arr = this.data.get(key)
        if (!arr || arr.length === 0) return null

        const sorted = [...arr].sort((a, b) => a.value - b.value)
        const values = sorted.map(s => s.value)
        const count = values.length
        const avg = Math.round(values.reduce((a, b) => a + b, 0) / count)
        const p95 = values[Math.floor(count * 0.95)] ?? values[count - 1]
        const min = values[0]
        const max = values[count - 1]
        const failures = arr.filter(s => !s.success).length
        const errorRate = Math.round((failures / count) * 100)

        return {
            key,
            count,
            avg,
            p95,
            min,
            max,
            errorRate,
            samples: arr.slice(-20).map(s => s.value),
        }
    }

    getAllSummaries(): MetricSummary[] {
        const out: MetricSummary[] = []
        for (const key of this.data.keys()) {
            const s = this.getSummary(key)
            if (s) out.push(s)
        }
        return out
    }

    /** Structured snapshot for the /api/admin/ops-metrics endpoint */
    getOpsSnapshot(): {
        agentResponseMs: MetricSummary | null
        reportGenMs: MetricSummary | null
        snapshotMs: MetricSummary | null
        journeyUpdateMs: MetricSummary | null
        analyticsMs: MetricSummary | null
        apiErrorRate: number
        totalRequests: number
        updatedAt: string
    } {
        const allKeys = [...this.data.keys()]

        // Total requests = sum of all route-level samples
        const totalRequests = allKeys.reduce((acc, k) => acc + (this.data.get(k)?.length ?? 0), 0)

        // Overall error rate from all samples
        const allSamples = allKeys.flatMap(k => this.data.get(k) ?? [])
        const totalErrors = allSamples.filter(s => !s.success).length
        const apiErrorRate = allSamples.length > 0
            ? Math.round((totalErrors / allSamples.length) * 100)
            : 0

        return {
            agentResponseMs: this.getSummary('agentResponseMs'),
            reportGenMs: this.getSummary('reportGenMs'),
            snapshotMs: this.getSummary('snapshotMs'),
            journeyUpdateMs: this.getSummary('journeyUpdateMs'),
            analyticsMs: this.getSummary('analyticsMs'),
            apiErrorRate,
            totalRequests,
            updatedAt: new Date().toISOString(),
        }
    }

    /** Seed mock data for local offline demo */
    seedMockData(): void {
        const seed = (key: string, baseMs: number, spread: number) => {
            for (let i = 0; i < 20; i++) {
                const v = Math.max(10, Math.round(baseMs + (Math.random() - 0.5) * spread))
                this.record(key, v, Math.random() > 0.05)
            }
        }
        seed('agentResponseMs', 1200, 600)
        seed('reportGenMs', 340, 120)
        seed('snapshotMs', 80, 40)
        seed('journeyUpdateMs', 95, 50)
        seed('analyticsMs', 2800, 900)
    }
}

export const metricsStore = new MetricsStore()

// Seed mock data immediately so OpsPage has something to show on first load
metricsStore.seedMockData()
