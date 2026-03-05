import {
  LANGUAGE_REGISTRY,
  type LegacyCodeLanguageId,
} from '../../shared/languageRegistry'

export type PebbleLanguageId = LegacyCodeLanguageId | 'sql'

export type PebbleLanguage = {
  id: PebbleLanguageId
  label: string
  monacoLanguage?: string
  fileExt: string
  runnerId: PebbleLanguageId
  defaultFunctionMode?: boolean
}

const FILE_EXT_BY_LANGUAGE: Record<LegacyCodeLanguageId, string> = {
  python: '.py',
  javascript: '.js',
  cpp: '.cpp',
  java: '.java',
  c: '.c',
}

export const SUPPORTED_LANGUAGES: PebbleLanguage[] = [
  ...LANGUAGE_REGISTRY.map((language) => ({
    id: language.legacyId,
    label: language.label,
    monacoLanguage: language.monacoLanguage,
    fileExt: FILE_EXT_BY_LANGUAGE[language.legacyId],
    runnerId: language.legacyId,
    defaultFunctionMode: true,
  })),
  {
    id: 'sql',
    label: 'SQL (Simulated)',
    monacoLanguage: 'plaintext',
    fileExt: '.sql',
    runnerId: 'sql',
    defaultFunctionMode: false,
  },
]

export const DEFAULT_LANGUAGE: PebbleLanguageId = 'python'

const BY_ID = new Map(SUPPORTED_LANGUAGES.map((language) => [language.id, language] as const))

export function isPebbleLanguageId(value: string | null | undefined): value is PebbleLanguageId {
  return typeof value === 'string' && BY_ID.has(value as PebbleLanguageId)
}

export function getPebbleLanguageById(id: PebbleLanguageId) {
  const language = BY_ID.get(id)
  if (!language) {
    throw new Error(`Unknown language id: ${id}`)
  }
  return language
}

export function getMonacoLanguage(id: PebbleLanguageId) {
  return getPebbleLanguageById(id).monacoLanguage ?? 'plaintext'
}

export function getRuntimeLabel(id: PebbleLanguageId) {
  return getPebbleLanguageById(id).label
}
