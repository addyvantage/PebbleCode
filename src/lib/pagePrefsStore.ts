import { storageKeys } from '../utils/storageKeys'

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

  try {
    const raw = window.localStorage.getItem(storageKeys.pagePrefs)
    if (!raw) {
      return DEFAULT_PREFS
    }
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) {
      return DEFAULT_PREFS
    }

    return {
      reduceMotion: parsed.reduceMotion === true,
      compactDensity: parsed.compactDensity === true,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePagePrefs(prefs: PagePrefs) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(storageKeys.pagePrefs, JSON.stringify(prefs))
  } catch {
    // Ignore localStorage write errors for demo mode.
  }
}

