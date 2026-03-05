import type { PlacementLanguage, PlacementLevel } from '../data/onboardingData'
import { isPlacementLanguage, isPlacementLevel } from '../data/onboardingData'
import { safeGetJSON, safeSetJSON } from './safeStorage'
import {
  fromLegacyCodeLanguageId,
  normalizeSessionLanguageId,
  type SessionLanguageId,
} from '../../shared/languageRegistry'

export const LEARNING_TRACK_STORAGE_KEY = 'pebble.learningTrack.v1'
export const EDITOR_LANGUAGE_STORAGE_KEY = 'pebble.editorLanguage.v1'
export const EDITOR_LANGUAGE_OVERRIDE_STORAGE_KEY = 'pebble.editorLanguage.userOverride.v1'

export type LearningTrack = {
  languageFocus: PlacementLanguage
  level: PlacementLevel
}

const DEFAULT_TRACK: LearningTrack = {
  languageFocus: 'python',
  level: 'beginner',
}

export function loadLearningTrack(): LearningTrack | null {
  const raw = safeGetJSON<Record<string, unknown> | null>(LEARNING_TRACK_STORAGE_KEY, null)
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const languageFocusRaw = raw.languageFocus
  const levelRaw = raw.level

  if (!isPlacementLanguage(typeof languageFocusRaw === 'string' ? languageFocusRaw : null)) {
    return null
  }

  if (!isPlacementLevel(typeof levelRaw === 'string' ? levelRaw : null)) {
    return null
  }

  return {
    languageFocus: languageFocusRaw as PlacementLanguage,
    level: levelRaw as PlacementLevel,
  }
}

export function saveLearningTrack(track: LearningTrack) {
  safeSetJSON(LEARNING_TRACK_STORAGE_KEY, track, {
    maxBytes: 256,
    silent: true,
  })
}

export function toDefaultEditorLanguage(track: LearningTrack): SessionLanguageId {
  return fromLegacyCodeLanguageId(track.languageFocus)
}

export function getDefaultLearningTrack(): LearningTrack {
  return DEFAULT_TRACK
}

export function loadEditorLanguagePreference(): SessionLanguageId | null {
  const raw = safeGetJSON<string | null>(EDITOR_LANGUAGE_STORAGE_KEY, null)
  return normalizeSessionLanguageId(raw)
}

export function saveEditorLanguagePreference(language: SessionLanguageId) {
  safeSetJSON(EDITOR_LANGUAGE_STORAGE_KEY, language, {
    maxBytes: 64,
    silent: true,
  })
}

export function loadEditorLanguageUserOverride() {
  return safeGetJSON<boolean>(EDITOR_LANGUAGE_OVERRIDE_STORAGE_KEY, false)
}

export function saveEditorLanguageUserOverride(value: boolean) {
  safeSetJSON(EDITOR_LANGUAGE_OVERRIDE_STORAGE_KEY, value, {
    maxBytes: 64,
    silent: true,
  })
}
