/**
 * Phase 9: Weekly Growth Ledger Narrator
 *
 * Premium weekly mentor recap with:
 * - personalized stat summary
 * - language-aware script generation
 * - voice-mode preferences (auto / Polly / device)
 * - robust Polly → browser speech fallback
 */

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { ChevronDown, ChevronUp, Mic, Play, RefreshCw, Square, Volume2 } from 'lucide-react'
import {
  normalizeAppLanguageCode,
  resolvePollyVoiceSupport,
  type AppLanguageCode,
  type RecapVoiceMode,
} from '../../../shared/recapVoice'
import { Card } from '../ui/Card'
import { useAuth } from '../../hooks/useAuth'
import { getLanguageOption, type LanguageCode } from '../../i18n/languages'
import { useI18n } from '../../i18n/useI18n'
import {
  dateKeyForTimeZone,
  selectCurrentStreak,
  selectDailyCompletions,
} from '../../lib/analyticsDerivers'
import {
  getAnalyticsState,
  subscribeAnalytics,
} from '../../lib/analyticsStore'
import type {
  AnalyticsErrorType,
  AnalyticsEvent,
  AssistAnalyticsEvent,
  RunAnalyticsEvent,
  SubmitAnalyticsEvent,
} from '../../lib/analyticsStore'
import {
  isBrowserSpeechSynthesisAvailable,
  loadBrowserVoices,
  speakRecapWithBrowser,
  stopBrowserSpeech,
} from '../../lib/recapSpeech'
import {
  loadWeeklyRecapVoicePreferences,
  saveWeeklyRecapVoicePreferences,
  type WeeklyRecapVoicePreferences,
} from '../../lib/weeklyRecapPreferences'

type RecapPlayback = {
  mode: RecapVoiceMode
  provider: 'polly' | 'device'
  appLanguage: AppLanguageCode
  locale: string
  pollyVoiceId?: string
  pollyLanguageCode?: string
  preferredBrowserVoiceURI?: string
  reason?: string
}

type RecapTone = 'celebratory' | 'encouraging' | 'reflective' | 'empathetic' | 'determined'

type RecapData = {
  script: string
  audioUrl?: string
  generatedAt: string
  weekStart: string
  tone: RecapTone
  usedHumor: boolean
  playback: RecapPlayback
}

type RecapSummaryPayload = {
  appLanguage: AppLanguageCode
  trackLanguage: string
  userName: string | null
  solvesLast7: number
  solvesDelta: number
  daysActiveLast7: number
  streakDays: number
  streakDelta: number
  biggestStruggle: string | null
  trendDirection: 'improving' | 'stable' | 'worsening'
  attemptsLast7: number
  passRateLast7: number
  passRateDelta: number
  guidanceReliancePct: number
  guidanceRelianceDeltaPct: number
  avgRecoveryTimeSec: number
  avgRecoveryTimeDeltaSec: number
  hardestSolvedDifficulty: null
}

const DAY_MS = 24 * 60 * 60 * 1000

function isAttemptEvent(event: AnalyticsEvent): event is RunAnalyticsEvent | SubmitAnalyticsEvent {
  return event.type === 'run' || event.type === 'submit'
}

function isAssistEvent(event: AnalyticsEvent): event is AssistAnalyticsEvent {
  return event.type === 'assist'
}

function isAttemptSuccess(event: RunAnalyticsEvent | SubmitAnalyticsEvent) {
  return event.type === 'run' ? event.passed : event.accepted
}

function computeAverageRecoveryTimeSec(attempts: Array<RunAnalyticsEvent | SubmitAnalyticsEvent>) {
  if (attempts.length === 0) {
    return 0
  }

  const sorted = [...attempts].sort((left, right) => left.ts - right.ts)
  let pendingFailureTs: number | null = null
  const recoveries: number[] = []

  for (const attempt of sorted) {
    const success = isAttemptSuccess(attempt)
    if (!success) {
      if (pendingFailureTs === null) {
        pendingFailureTs = attempt.ts
      }
      continue
    }

    if (pendingFailureTs !== null) {
      const deltaSec = Math.max(1, (attempt.ts - pendingFailureTs) / 1000)
      recoveries.push(deltaSec)
      pendingFailureTs = null
    }
  }

  if (recoveries.length === 0) {
    return 0
  }

  return Math.round(recoveries.reduce((sum, value) => sum + value, 0) / recoveries.length)
}

function determineTrendDirection(lastRate: number, previousRate: number): RecapSummaryPayload['trendDirection'] {
  const delta = lastRate - previousRate
  if (delta > 0.08) {
    return 'improving'
  }
  if (delta < -0.08) {
    return 'worsening'
  }
  return 'stable'
}

function normalizePlayback(raw: unknown, appLanguage: AppLanguageCode): RecapPlayback {
  const fallback: RecapPlayback = {
    mode: 'auto',
    provider: 'device',
    appLanguage,
    locale: getLanguageOption(appLanguage as LanguageCode).locale,
    reason: 'no_audio_generated',
  }

  if (!raw || typeof raw !== 'object') {
    return fallback
  }

  const source = raw as Record<string, unknown>
  const modeRaw = source.mode
  const providerRaw = source.provider
  const mode: RecapVoiceMode =
    modeRaw === 'auto' || modeRaw === 'polly' || modeRaw === 'device'
      ? modeRaw
      : fallback.mode

  return {
    mode,
    provider: providerRaw === 'polly' ? 'polly' : 'device',
    appLanguage: normalizeAppLanguageCode(source.appLanguage, appLanguage),
    locale: typeof source.locale === 'string' ? source.locale : fallback.locale,
    pollyVoiceId: typeof source.pollyVoiceId === 'string' ? source.pollyVoiceId : undefined,
    pollyLanguageCode: typeof source.pollyLanguageCode === 'string' ? source.pollyLanguageCode : undefined,
    preferredBrowserVoiceURI:
      typeof source.preferredBrowserVoiceURI === 'string'
        ? source.preferredBrowserVoiceURI
        : undefined,
    reason: typeof source.reason === 'string' ? source.reason : undefined,
  }
}

function normalizeRecapData(raw: unknown, appLanguage: AppLanguageCode): RecapData | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const data = raw as Record<string, unknown>
  const script = typeof data.script === 'string' ? data.script.trim() : ''
  if (!script) {
    return null
  }

  const toneRaw = data.tone
  const tone: RecapTone = (
    toneRaw === 'celebratory'
    || toneRaw === 'encouraging'
    || toneRaw === 'reflective'
    || toneRaw === 'empathetic'
    || toneRaw === 'determined'
  )
    ? toneRaw
    : 'encouraging'

  return {
    script,
    audioUrl: typeof data.audioUrl === 'string' ? data.audioUrl : undefined,
    generatedAt: typeof data.generatedAt === 'string' ? data.generatedAt : new Date().toISOString(),
    weekStart: typeof data.weekStart === 'string' ? data.weekStart : new Date().toISOString().slice(0, 10),
    tone,
    usedHumor: Boolean(data.usedHumor),
    playback: normalizePlayback(data.playback, appLanguage),
  }
}

function extractRecapSummary(
  events: AnalyticsEvent[],
  input: {
    appLanguage: AppLanguageCode
    trackLanguage: string
    userName: string | null
  },
): RecapSummaryPayload {
  const now = Date.now()
  const last7Start = now - 7 * DAY_MS
  const prev7Start = now - 14 * DAY_MS

  const attemptsLast7 = events.filter(
    (event): event is RunAnalyticsEvent | SubmitAnalyticsEvent =>
      isAttemptEvent(event) && event.ts >= last7Start,
  )
  const attemptsPrev7 = events.filter(
    (event): event is RunAnalyticsEvent | SubmitAnalyticsEvent =>
      isAttemptEvent(event) && event.ts >= prev7Start && event.ts < last7Start,
  )
  const assistsLast7 = events.filter(
    (event): event is AssistAnalyticsEvent => isAssistEvent(event) && event.ts >= last7Start,
  )
  const assistsPrev7 = events.filter(
    (event): event is AssistAnalyticsEvent => isAssistEvent(event) && event.ts >= prev7Start && event.ts < last7Start,
  )

  const solvesLast7 = attemptsLast7.filter(
    (event) => event.type === 'submit' && event.accepted,
  ).length
  const solvesPrev7 = attemptsPrev7.filter(
    (event) => event.type === 'submit' && event.accepted,
  ).length

  const passRateLast7 = attemptsLast7.length > 0
    ? attemptsLast7.filter(isAttemptSuccess).length / attemptsLast7.length
    : 0
  const passRatePrev7 = attemptsPrev7.length > 0
    ? attemptsPrev7.filter(isAttemptSuccess).length / attemptsPrev7.length
    : passRateLast7

  const guidanceReliancePct = attemptsLast7.length > 0
    ? Math.round((assistsLast7.length / attemptsLast7.length) * 100)
    : 0
  const guidanceReliancePrevPct = attemptsPrev7.length > 0
    ? Math.round((assistsPrev7.length / attemptsPrev7.length) * 100)
    : guidanceReliancePct

  const avgRecoveryTimeSec = computeAverageRecoveryTimeSec(attemptsLast7)
  const prevRecoveryTimeSec = computeAverageRecoveryTimeSec(attemptsPrev7)

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const dailyCompletions = selectDailyCompletions(events, tz)
  const todayKey = dateKeyForTimeZone(now, tz)
  const streakDays = selectCurrentStreak(dailyCompletions, todayKey).streak
  const prevAnchorKey = dateKeyForTimeZone(last7Start - DAY_MS, tz)
  const prevStreakDays = selectCurrentStreak(dailyCompletions, prevAnchorKey).streak

  const activeDaySet = new Set<string>()
  for (const event of attemptsLast7) {
    activeDaySet.add(dateKeyForTimeZone(event.ts, tz))
  }

  const errorCounts: Partial<Record<AnalyticsErrorType, number>> = {}
  for (const event of attemptsLast7) {
    if (!isAttemptSuccess(event) && event.errorType) {
      errorCounts[event.errorType] = (errorCounts[event.errorType] ?? 0) + 1
    }
  }
  const biggestStruggle = Object.entries(errorCounts)
    .sort((left, right) => right[1] - left[1])[0]?.[0] ?? null

  return {
    appLanguage: input.appLanguage,
    trackLanguage: input.trackLanguage,
    userName: input.userName,
    solvesLast7,
    solvesDelta: solvesLast7 - solvesPrev7,
    daysActiveLast7: activeDaySet.size,
    streakDays,
    streakDelta: streakDays - prevStreakDays,
    biggestStruggle,
    trendDirection: determineTrendDirection(passRateLast7, passRatePrev7),
    attemptsLast7: attemptsLast7.length,
    passRateLast7,
    passRateDelta: (passRateLast7 - passRatePrev7) * 100,
    guidanceReliancePct,
    guidanceRelianceDeltaPct: guidanceReliancePct - guidanceReliancePrevPct,
    avgRecoveryTimeSec,
    avgRecoveryTimeDeltaSec: avgRecoveryTimeSec - prevRecoveryTimeSec,
    hardestSolvedDifficulty: null,
  }
}

function friendlyPlaybackStatus(recap: RecapData | null) {
  if (!recap) {
    return 'Generate your recap to hear this week’s mentor summary.'
  }
  if (recap.playback.provider === 'polly' && recap.audioUrl) {
    return `Cloud voice ready (${recap.playback.pollyVoiceId ?? 'Polly'} · ${recap.playback.locale}).`
  }
  if (recap.playback.mode === 'device') {
    return 'Using your device voice preference for this recap.'
  }
  return 'Audio voice unavailable right now — script is ready and device voice is available.'
}

export function WeeklyRecapWidget({ trackLanguage = 'python' }: { trackLanguage?: string }) {
  const { lang } = useI18n()
  const auth = useAuth()
  const analyticsState = useSyncExternalStore(subscribeAnalytics, getAnalyticsState, getAnalyticsState)

  const appLanguage = normalizeAppLanguageCode(lang)
  const languageOption = getLanguageOption(appLanguage as LanguageCode)
  const userScope = auth.user?.userId ?? auth.profile?.userId ?? 'guest'
  const recapUserName = useMemo(
    () =>
      auth.profile?.displayName?.trim()
      || auth.profile?.username?.trim()
      || auth.user?.email?.split('@')[0]
      || null,
    [auth.profile?.displayName, auth.profile?.username, auth.user?.email],
  )

  const [voicePrefs, setVoicePrefs] = useState<WeeklyRecapVoicePreferences>(() =>
    loadWeeklyRecapVoicePreferences('guest'))
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([])
  const [recapData, setRecapData] = useState<RecapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [scriptExpanded, setScriptExpanded] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [playingProvider, setPlayingProvider] = useState<'polly' | 'device' | null>(null)
  const [lastDeviceVoiceName, setLastDeviceVoiceName] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mountedRef = useRef(true)

  const pollySupport = useMemo(
    () =>
      resolvePollyVoiceSupport({
        appLanguage,
        preferredVoiceId: voicePrefs.preferredPollyVoiceId,
      }),
    [appLanguage, voicePrefs.preferredPollyVoiceId],
  )

  const summary = useMemo(
    () =>
      extractRecapSummary(analyticsState.events, {
        appLanguage,
        trackLanguage,
        userName: recapUserName,
      }),
    [analyticsState.updatedAt, analyticsState.events, appLanguage, recapUserName, trackLanguage],
  )

  const refreshBrowserVoices = useCallback(async () => {
    if (!isBrowserSpeechSynthesisAvailable()) {
      setBrowserVoices([])
      return
    }
    const voices = await loadBrowserVoices()
    if (!mountedRef.current) {
      return
    }
    setBrowserVoices(voices)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    setVoicePrefs(loadWeeklyRecapVoicePreferences(userScope))
  }, [userScope])

  useEffect(() => {
    saveWeeklyRecapVoicePreferences(userScope, voicePrefs)
  }, [userScope, voicePrefs])

  useEffect(() => {
    void refreshBrowserVoices()

    if (!isBrowserSpeechSynthesisAvailable()) {
      return () => {}
    }

    const synthesis = window.speechSynthesis
    const onVoicesChanged = () => {
      void refreshBrowserVoices()
    }

    synthesis.addEventListener('voiceschanged', onVoicesChanged)
    return () => {
      synthesis.removeEventListener('voiceschanged', onVoicesChanged)
    }
  }, [refreshBrowserVoices])

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    stopBrowserSpeech()
    if (mountedRef.current) {
      setPlaying(false)
      setPlayingProvider(null)
    }
  }, [])

  useEffect(
    () => () => {
      stopPlayback()
    },
    [stopPlayback],
  )

  const fetchLatestRecap = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/growth/weekly-recap/latest', {
        headers: { 'x-user-id': userScope },
      })
      if (!response.ok) {
        throw new Error('recap_latest_unavailable')
      }
      const payload = await response.json() as { ok: boolean; data: unknown }
      if (!mountedRef.current) {
        return
      }
      if (payload.ok && payload.data) {
        setRecapData(normalizeRecapData(payload.data, appLanguage))
      } else {
        setRecapData(null)
      }
    } catch {
      if (mountedRef.current) {
        setRecapData(null)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [appLanguage, userScope])

  useEffect(() => {
    void fetchLatestRecap()
  }, [fetchLatestRecap])

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    setErrorMsg(null)
    stopPlayback()

    try {
      const response = await fetch('/api/growth/weekly-recap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userScope,
        },
        body: JSON.stringify({
          summary,
          voice: voicePrefs,
        }),
      })

      if (!response.ok) {
        throw new Error('recap_generation_failed')
      }

      const payload = await response.json() as { ok: boolean; data: unknown }
      if (!payload.ok) {
        throw new Error('recap_generation_failed')
      }

      const normalized = normalizeRecapData(payload.data, appLanguage)
      if (!normalized) {
        throw new Error('recap_payload_invalid')
      }

      if (!mountedRef.current) {
        return
      }
      setRecapData(normalized)
      setScriptExpanded(false)
    } catch {
      if (mountedRef.current) {
        setErrorMsg('Could not generate this week’s recap right now. Please try again in a moment.')
      }
    } finally {
      if (mountedRef.current) {
        setGenerating(false)
      }
    }
  }, [appLanguage, stopPlayback, summary, userScope, voicePrefs])

  const handlePlay = useCallback(async () => {
    if (!recapData) {
      return
    }

    if (playing) {
      stopPlayback()
      return
    }

    setErrorMsg(null)

    const shouldUsePollyAudio = recapData.playback.provider === 'polly' && Boolean(recapData.audioUrl)
    if (shouldUsePollyAudio && recapData.audioUrl) {
      try {
        const audio = new Audio(recapData.audioUrl)
        audioRef.current = audio
        audio.addEventListener('ended', () => {
          audioRef.current = null
          if (mountedRef.current) {
            setPlaying(false)
            setPlayingProvider(null)
          }
        })
        audio.addEventListener('error', () => {
          audioRef.current = null
          if (mountedRef.current) {
            setPlaying(false)
            setPlayingProvider(null)
            setErrorMsg('Cloud audio was unavailable, but the recap script is ready.')
          }
        })
        await audio.play()
        if (mountedRef.current) {
          setPlaying(true)
          setPlayingProvider('polly')
        }
        return
      } catch {
        if (mountedRef.current) {
          setPlaying(false)
          setPlayingProvider(null)
        }
      }
    }

    if (!isBrowserSpeechSynthesisAvailable()) {
      setErrorMsg('Audio voice unavailable right now — script is ready.')
      return
    }

    try {
      const result = await speakRecapWithBrowser({
        text: recapData.script,
        appLanguage: recapData.playback.appLanguage,
        locale: recapData.playback.locale,
        preferredVoiceURI: voicePrefs.preferredBrowserVoiceURI,
      })
      if (mountedRef.current) {
        setPlaying(true)
        setPlayingProvider('device')
        setLastDeviceVoiceName(result.voice?.name ?? null)
      }
      await result.done
      if (mountedRef.current) {
        setPlaying(false)
        setPlayingProvider(null)
      }
    } catch {
      if (mountedRef.current) {
        setPlaying(false)
        setPlayingProvider(null)
        setErrorMsg('Audio voice unavailable right now — script is ready.')
      }
    }
  }, [playing, recapData, stopPlayback, voicePrefs.preferredBrowserVoiceURI])

  const handleVoiceModeChange = useCallback((mode: RecapVoiceMode) => {
    setVoicePrefs((current) => ({
      ...current,
      mode,
    }))
  }, [])

  const handlePollyVoiceChange = useCallback((voiceId: string) => {
    setVoicePrefs((current) => ({
      ...current,
      preferredPollyVoiceId: voiceId || null,
    }))
  }, [])

  const handleBrowserVoiceChange = useCallback((voiceURI: string) => {
    setVoicePrefs((current) => ({
      ...current,
      preferredBrowserVoiceURI: voiceURI || null,
    }))
  }, [])

  const formattedWeek = recapData?.weekStart
    ? new Date(`${recapData.weekStart}T00:00:00Z`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    : null

  const canPlay = Boolean(recapData) && (
    Boolean(recapData?.audioUrl && recapData.playback.provider === 'polly')
    || isBrowserSpeechSynthesisAvailable()
  )

  const selectedBrowserVoiceName = browserVoices.find(
    (voice) => voice.voiceURI === voicePrefs.preferredBrowserVoiceURI,
  )?.name

  return (
    <Card padding="sm" interactive className="space-y-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-base font-semibold tracking-tight text-pebble-text-primary">
            Weekly Pebble Recap
          </p>
          <p className="text-sm text-pebble-text-secondary">
            Personal mentor summary for your last 7 days
            {formattedWeek ? ` · week of ${formattedWeek}` : ''}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-pebble-border/30 bg-pebble-chip-surface/55 px-3 py-1 text-xs font-medium tracking-wide text-pebble-text-secondary">
          <Mic className="h-3.5 w-3.5" aria-hidden />
          {languageOption.romanizedName}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <label className="space-y-1 rounded-xl border border-pebble-border/30 bg-pebble-overlay/[0.03] p-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">
            Voice mode
          </span>
          <select
            value={voicePrefs.mode}
            onChange={(event) => handleVoiceModeChange(event.target.value as RecapVoiceMode)}
            className="w-full rounded-lg border border-pebble-border/35 bg-pebble-chip-surface/70 px-2 py-1.5 text-sm text-pebble-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pebble-accent/45"
          >
            <option value="auto">Auto (Polly, then device)</option>
            <option value="polly">Prefer Polly</option>
            <option value="device">Device voice only</option>
          </select>
        </label>

        <label className="space-y-1 rounded-xl border border-pebble-border/30 bg-pebble-overlay/[0.03] p-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">
            Polly voice
          </span>
          <select
            value={voicePrefs.preferredPollyVoiceId ?? ''}
            onChange={(event) => handlePollyVoiceChange(event.target.value)}
            disabled={!pollySupport.supported || voicePrefs.mode === 'device'}
            className="w-full rounded-lg border border-pebble-border/35 bg-pebble-chip-surface/70 px-2 py-1.5 text-sm text-pebble-text-primary disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pebble-accent/45"
          >
            <option value="">
              {pollySupport.supported ? `Auto (${pollySupport.voiceId ?? 'default'})` : 'Unavailable for this language'}
            </option>
            {pollySupport.availableVoices.map((voiceId) => (
              <option key={voiceId} value={voiceId}>
                {voiceId}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 rounded-xl border border-pebble-border/30 bg-pebble-overlay/[0.03] p-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">
            Device voice
          </span>
          <select
            value={voicePrefs.preferredBrowserVoiceURI ?? ''}
            onChange={(event) => handleBrowserVoiceChange(event.target.value)}
            className="w-full rounded-lg border border-pebble-border/35 bg-pebble-chip-surface/70 px-2 py-1.5 text-sm text-pebble-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pebble-accent/45"
          >
            <option value="">Auto ({languageOption.romanizedName})</option>
            {browserVoices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-pebble-border/28 bg-pebble-overlay/[0.03] px-3 py-2">
        <p className="text-xs text-pebble-text-secondary">{friendlyPlaybackStatus(recapData)}</p>
        {selectedBrowserVoiceName && (
          <p className="mt-1 text-[11px] text-pebble-text-muted">
            Device preference: {selectedBrowserVoiceName}
          </p>
        )}
        {playing && playingProvider === 'device' && lastDeviceVoiceName && (
          <p className="mt-1 text-[11px] text-pebble-text-muted">
            Playing with {lastDeviceVoiceName}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-pebble-text-secondary">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Loading recap…
        </div>
      ) : (
        <>
          {!recapData && (
            <p className="text-sm text-pebble-text-secondary">
              No recap generated yet for this week. Tap generate and Pebble will narrate your momentum.
            </p>
          )}

          {errorMsg && (
            <p className="rounded-lg border border-amber-400/35 bg-amber-300/12 px-3 py-1.5 text-sm text-amber-900 dark:text-amber-200">
              {errorMsg}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePlay}
              disabled={!canPlay}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition
                ${playing
                  ? 'border-pebble-accent/55 bg-pebble-accent/16 text-pebble-accent'
                  : 'border-pebble-border/40 bg-pebble-chip-surface/60 text-pebble-text-secondary hover:border-pebble-border hover:text-pebble-text-primary'
                } disabled:opacity-40`}
            >
              {playing ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? 'Stop' : 'Play recap'}
            </button>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-lg border border-pebble-border/40 bg-pebble-overlay/[0.04] px-3 py-2 text-sm font-medium text-pebble-text-secondary transition hover:border-pebble-border hover:text-pebble-text-primary disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating…' : recapData ? 'Regenerate' : 'Generate recap'}
            </button>

            <button
              onClick={() => setScriptExpanded((value) => !value)}
              disabled={!recapData}
              className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 text-xs text-pebble-text-muted transition hover:border-pebble-border/30 hover:text-pebble-text-secondary disabled:opacity-40"
            >
              {scriptExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {scriptExpanded ? 'Hide script' : 'Show script'}
            </button>
          </div>

          {scriptExpanded && recapData && (
            <div className="rounded-xl border border-pebble-border/35 bg-pebble-canvas/45 px-3 py-2">
              <p className="text-sm leading-relaxed text-pebble-text-secondary">
                {recapData.script}
              </p>
            </div>
          )}

          {recapData && (
            <div className="flex items-center gap-2 text-[11px] text-pebble-text-muted">
              <Volume2 className="h-3.5 w-3.5" />
              {recapData.playback.provider === 'polly' && recapData.audioUrl
                ? `Polly ${recapData.playback.pollyVoiceId ?? ''} · ${recapData.playback.locale}`
                : `Device speech · ${recapData.playback.locale}`}
            </div>
          )}
        </>
      )}
    </Card>
  )
}
