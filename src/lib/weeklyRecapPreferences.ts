import type { RecapVoiceMode } from '../../shared/recapVoice'
import { safeGetJSON, safeSetJSON } from './safeStorage'

const WEEKLY_RECAP_VOICE_PREFS_KEY_PREFIX = 'pebble.weeklyRecap.voicePrefs.v1'

export type WeeklyRecapVoicePreferences = {
  mode: RecapVoiceMode
  preferredPollyVoiceId: string | null
  preferredBrowserVoiceURI: string | null
}

const DEFAULT_WEEKLY_RECAP_VOICE_PREFERENCES: WeeklyRecapVoicePreferences = {
  mode: 'auto',
  preferredPollyVoiceId: null,
  preferredBrowserVoiceURI: null,
}

function sanitizeScope(scope: string) {
  const cleaned = scope.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 64)
  return cleaned || 'guest'
}

function keyForScope(scope: string) {
  return `${WEEKLY_RECAP_VOICE_PREFS_KEY_PREFIX}.${sanitizeScope(scope)}`
}

export function loadWeeklyRecapVoicePreferences(scope: string): WeeklyRecapVoicePreferences {
  const raw = safeGetJSON<Record<string, unknown> | null>(keyForScope(scope), null)
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_WEEKLY_RECAP_VOICE_PREFERENCES
  }

  const modeRaw = raw.mode
  const mode: RecapVoiceMode =
    modeRaw === 'auto' || modeRaw === 'polly' || modeRaw === 'device'
      ? modeRaw
      : DEFAULT_WEEKLY_RECAP_VOICE_PREFERENCES.mode

  const preferredPollyVoiceId = typeof raw.preferredPollyVoiceId === 'string'
    ? raw.preferredPollyVoiceId.trim().slice(0, 64) || null
    : null
  const preferredBrowserVoiceURI = typeof raw.preferredBrowserVoiceURI === 'string'
    ? raw.preferredBrowserVoiceURI.trim().slice(0, 200) || null
    : null

  return {
    mode,
    preferredPollyVoiceId,
    preferredBrowserVoiceURI,
  }
}

export function saveWeeklyRecapVoicePreferences(scope: string, prefs: WeeklyRecapVoicePreferences) {
  safeSetJSON(
    keyForScope(scope),
    {
      mode: prefs.mode,
      preferredPollyVoiceId: prefs.preferredPollyVoiceId,
      preferredBrowserVoiceURI: prefs.preferredBrowserVoiceURI,
    },
    {
      maxBytes: 1024,
      silent: true,
    },
  )
}

