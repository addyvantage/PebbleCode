import { safeGetJSON, safeSetJSON } from './safeStorage'
import {
  normalizeSessionLanguageId,
  type LanguageId,
  type SessionLanguageId,
} from '../../shared/languageRegistry'

export const DEFAULT_LANGUAGE_STORAGE_KEY = 'pebble.defaultLanguage.v1'
export const PROBLEM_CODE_BY_LANG_STORAGE_KEY = 'pebble.problemCodeByLang.v1'
const DEFAULT_LANGUAGE: LanguageId = 'python3'

export type ProblemCodeByLangEntry = {
  selectedLanguage: SessionLanguageId
  codeByLanguage: Partial<Record<SessionLanguageId, string>>
  updatedAt: number
}

export type ProblemCodeByLang = Record<string, ProblemCodeByLangEntry>

export function loadProblemCodeByLang(): ProblemCodeByLang {
  const raw = safeGetJSON<Record<string, unknown>>(PROBLEM_CODE_BY_LANG_STORAGE_KEY, {})
  const next: ProblemCodeByLang = {}

  for (const [problemId, entry] of Object.entries(raw)) {
    if (!entry || typeof entry !== 'object') {
      continue
    }

    const selectedLanguageRaw = (entry as { selectedLanguage?: unknown }).selectedLanguage
    const selectedLanguage = normalizeSessionLanguageId(selectedLanguageRaw) ?? DEFAULT_LANGUAGE

    const codeByLanguageRaw = (entry as { codeByLanguage?: unknown }).codeByLanguage
    const codeByLanguage: Partial<Record<SessionLanguageId, string>> = {}
    if (codeByLanguageRaw && typeof codeByLanguageRaw === 'object') {
      for (const [languageId, code] of Object.entries(codeByLanguageRaw as Record<string, unknown>)) {
        const normalizedLanguage = normalizeSessionLanguageId(languageId)
        if (!normalizedLanguage || typeof code !== 'string') {
          continue
        }
        codeByLanguage[normalizedLanguage] = code
      }
    }

    const updatedAtRaw = (entry as { updatedAt?: unknown }).updatedAt
    const updatedAt = typeof updatedAtRaw === 'number' && Number.isFinite(updatedAtRaw)
      ? updatedAtRaw
      : Date.now()

    next[problemId] = {
      selectedLanguage,
      codeByLanguage,
      updatedAt,
    }
  }

  return next
}

export function saveProblemCodeByLang(state: ProblemCodeByLang) {
  safeSetJSON(PROBLEM_CODE_BY_LANG_STORAGE_KEY, state, {
    maxBytes: 500 * 1024,
    silent: true,
  })
}

export function getGlobalDefaultLanguage() {
  const value = safeGetJSON<string>(DEFAULT_LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE)
  return normalizeSessionLanguageId(value) ?? DEFAULT_LANGUAGE
}

export function setGlobalDefaultLanguage(languageId: SessionLanguageId) {
  safeSetJSON(DEFAULT_LANGUAGE_STORAGE_KEY, languageId, {
    maxBytes: 64,
    silent: true,
  })
}
