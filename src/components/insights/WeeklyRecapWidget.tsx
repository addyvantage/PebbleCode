/**
 * Phase 9: Weekly Growth Ledger Narrator
 *
 * Generates and plays a Polly-narrated audio recap of the user's last 7 days.
 * Falls back to a text-only script preview when Polly / AWS is not configured.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { ChevronDown, ChevronUp, Mic, Play, RefreshCw, Volume2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { getAnalyticsState, subscribeAnalytics } from '../../lib/analyticsStore'
import {
  dateKeyForTimeZone,
  selectCurrentStreak,
  selectDailyCompletions,
} from '../../lib/analyticsDerivers'
import type {
  AnalyticsEvent,
  AnalyticsErrorType,
  AssistAnalyticsEvent,
  RunAnalyticsEvent,
  SubmitAnalyticsEvent,
} from '../../lib/analyticsStore'

type RecapData = {
  script: string
  audioUrl?: string
  generatedAt: string
  weekStart: string
}

// ── Summary extraction ────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000

function isSuccess(e: RunAnalyticsEvent | SubmitAnalyticsEvent) {
  return e.type === 'run' ? e.passed : e.accepted
}

function extractRecapSummary(events: AnalyticsEvent[], language: string) {
  const now = Date.now()
  const last7Start = now - 7 * DAY_MS
  const prev7Start = now - 14 * DAY_MS

  const attempts7 = events.filter(
    (e): e is RunAnalyticsEvent | SubmitAnalyticsEvent =>
      (e.type === 'run' || e.type === 'submit') && e.ts >= last7Start,
  )
  const assists7 = events.filter(
    (e): e is AssistAnalyticsEvent => e.type === 'assist' && e.ts >= last7Start,
  )
  const prev7Attempts = events.filter(
    (e): e is RunAnalyticsEvent | SubmitAnalyticsEvent =>
      (e.type === 'run' || e.type === 'submit') &&
      e.ts >= prev7Start && e.ts < last7Start,
  )

  const solvesLast7 = attempts7.filter(
    (e) => e.type === 'submit' && (e as SubmitAnalyticsEvent).accepted,
  ).length

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const dailyMap = selectDailyCompletions(events, tz)
  const todayKey = dateKeyForTimeZone(now, tz)
  const streakDays = selectCurrentStreak(dailyMap, todayKey).streak

  const activeDaySet = new Set<string>()
  for (const e of attempts7) activeDaySet.add(dateKeyForTimeZone(e.ts, tz))
  const daysActiveLast7 = activeDaySet.size

  // Most common error type
  const errorCounts: Partial<Record<AnalyticsErrorType, number>> = {}
  for (const e of events.filter((ev): ev is RunAnalyticsEvent => ev.type === 'run' && !ev.passed && ev.ts >= last7Start)) {
    if (e.errorType) errorCounts[e.errorType] = (errorCounts[e.errorType] ?? 0) + 1
  }
  const biggestStruggle = Object.entries(errorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const last7PassRate = attempts7.length > 0
    ? attempts7.filter(isSuccess).length / attempts7.length
    : 0
  const prev7PassRate = prev7Attempts.length > 0
    ? prev7Attempts.filter(isSuccess).length / prev7Attempts.length
    : last7PassRate

  const diff = last7PassRate - prev7PassRate
  const trendDirection = diff > 0.08 ? 'improving' : diff < -0.08 ? 'worsening' : 'stable'

  // Suppress unused variable warning
  void assists7

  return {
    solvesLast7,
    daysActiveLast7,
    streakDays,
    biggestStruggle,
    trendDirection,
    language,
  } as const
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WeeklyRecapWidget({ language = 'python' }: { language?: string }) {
  const analyticsState = useSyncExternalStore(subscribeAnalytics, getAnalyticsState, getAnalyticsState)
  const [recapData, setRecapData] = useState<RecapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [scriptExpanded, setScriptExpanded] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mountedRef = useRef(true)

  const userId = 'anonymous'

  const summary = useMemo(
    () => extractRecapSummary(analyticsState.events, language),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analyticsState.updatedAt, language],
  )

  // Fetch latest on mount
  useEffect(() => {
    mountedRef.current = true
    fetch('/api/growth/weekly-recap/latest', {
      headers: { 'x-user-id': userId },
    })
      .then((r) => r.json())
      .then((d: { ok: boolean; data: RecapData | null }) => {
        if (mountedRef.current && d.ok && d.data) setRecapData(d.data)
      })
      .catch(() => {})
      .finally(() => { if (mountedRef.current) setLoading(false) })
    return () => { mountedRef.current = false }
  }, [])

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/growth/weekly-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ summary }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const d = await res.json() as { ok: boolean; data: RecapData }
      if (mountedRef.current && d.ok && d.data) {
        setRecapData(d.data)
        setScriptExpanded(false)
      } else if (mountedRef.current) {
        setErrorMsg('Unexpected response from server.')
      }
    } catch (err) {
      if (mountedRef.current) setErrorMsg(err instanceof Error ? err.message : 'Failed to generate recap.')
    } finally {
      if (mountedRef.current) setGenerating(false)
    }
  }, [summary, userId])

  const handlePlay = useCallback(() => {
    if (!recapData?.audioUrl) return
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setPlaying(false)
      return
    }
    const audio = new Audio(recapData.audioUrl)
    audioRef.current = audio
    audio.addEventListener('ended', () => {
      audioRef.current = null
      if (mountedRef.current) setPlaying(false)
    })
    audio.play().then(() => {
      if (mountedRef.current) setPlaying(true)
    }).catch(() => {
      audioRef.current = null
      if (mountedRef.current) setPlaying(false)
    })
  }, [recapData?.audioUrl])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const formattedDate = recapData?.weekStart
    ? new Date(recapData.weekStart + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <Card padding="sm" interactive className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-pebble-text-primary">Weekly Pebble Recap</p>
          <p className="text-sm text-pebble-text-secondary">
            Polly · Narrated growth summary
            {formattedDate ? ` · w/o ${formattedDate}` : ''}
          </p>
        </div>
        <Mic className="h-4 w-4 text-pebble-text-secondary" aria-hidden />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-pebble-text-secondary">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Loading recap…
        </div>
      ) : (
        <>
          {recapData ? (
            <div className="space-y-3">
              {/* Audio player or script preview */}
              {recapData.audioUrl ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlay}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition
                      ${playing
                        ? 'border-pebble-accent/50 bg-pebble-accent/10 text-pebble-accent'
                        : 'border-pebble-border/40 bg-pebble-chip-surface/60 text-pebble-text-secondary hover:border-pebble-border hover:text-pebble-text-primary'
                      }`}
                  >
                    {playing ? (
                      <Volume2 className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {playing ? 'Playing…' : 'Play recap'}
                  </button>
                  <span className="text-xs text-pebble-text-muted">~30-60 sec · Polly Neural</span>
                </div>
              ) : (
                <div className="rounded-lg border border-pebble-border/30 bg-pebble-chip-surface/30 px-3 py-2">
                  <p className="text-xs text-pebble-text-muted">
                    Audio unavailable in offline mode — script preview below
                  </p>
                </div>
              )}

              {/* Script preview (collapsible) */}
              <div>
                <button
                  onClick={() => setScriptExpanded((v) => !v)}
                  className="flex items-center gap-1 text-xs text-pebble-text-muted hover:text-pebble-text-secondary transition"
                >
                  {scriptExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {scriptExpanded ? 'Hide script' : 'Show script'}
                </button>
                {scriptExpanded && (
                  <p className="mt-2 text-sm leading-relaxed text-pebble-text-secondary">
                    {recapData.script}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-pebble-text-secondary">
              No recap generated yet for this week. Click Generate to create one.
            </p>
          )}

          {errorMsg && (
            <p className="text-sm text-red-400">{errorMsg}</p>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg border border-pebble-border/40 bg-pebble-chip-surface/60 px-3 py-1.5 text-sm font-medium text-pebble-text-secondary transition hover:border-pebble-border hover:text-pebble-text-primary disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating…' : recapData ? 'Regenerate recap' : 'Generate recap'}
          </button>
        </>
      )}
    </Card>
  )
}
