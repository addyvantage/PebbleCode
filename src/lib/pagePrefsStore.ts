import { storageKeys } from '../utils/storageKeys'
import { safeGetJSON, safeSetJSON } from './safeStorage'

export type PagePrefs = {
  reduceMotion: boolean
  compactDensity: boolean
}

const DEFAULT_PREFS: PagePrefs = {
  reduceMotion: false,
  compactDensity: false,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function loadPagePrefs(): PagePrefs {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFS
  }

  const parsed = safeGetJSON<unknown>(storageKeys.pagePrefs, null)
  if (!isRecord(parsed)) {
    return DEFAULT_PREFS
  }

  return {
    reduceMotion: parsed.reduceMotion === true,
    compactDensity: parsed.compactDensity === true,
  }
}

export function savePagePrefs(prefs: PagePrefs) {
  if (typeof window === 'undefined') {
    return
  }

  safeSetJSON(storageKeys.pagePrefs, prefs, { maxBytes: 1024, silent: true })
}
