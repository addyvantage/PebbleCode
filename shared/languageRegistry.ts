export const LANGUAGE_IDS = ['python3', 'javascript', 'cpp17', 'java17', 'c'] as const

export type LanguageId = (typeof LANGUAGE_IDS)[number]
export type SessionLanguageId = LanguageId | 'sql'
export type LegacyCodeLanguageId = 'python' | 'javascript' | 'cpp' | 'java' | 'c'

export type LanguageDescriptor = {
  id: LanguageId
  legacyId: LegacyCodeLanguageId
  label: string
  monacoLanguage: string
  runtimeCommand: string
}

export const LANGUAGE_REGISTRY: readonly LanguageDescriptor[] = [
  {
    id: 'python3',
    legacyId: 'python',
    label: 'Python 3',
    monacoLanguage: 'python',
    runtimeCommand: 'python3',
  },
  {
    id: 'javascript',
    legacyId: 'javascript',
    label: 'JavaScript',
    monacoLanguage: 'javascript',
    runtimeCommand: 'node',
  },
  {
    id: 'cpp17',
    legacyId: 'cpp',
    label: 'C++17',
    monacoLanguage: 'cpp',
    runtimeCommand: 'g++',
  },
  {
    id: 'java17',
    legacyId: 'java',
    label: 'Java 17',
    monacoLanguage: 'java',
    runtimeCommand: 'javac/java',
  },
  {
    id: 'c',
    legacyId: 'c',
    label: 'C (GNU)',
    monacoLanguage: 'c',
    runtimeCommand: 'gcc',
  },
] as const

const BY_ID = new Map(LANGUAGE_REGISTRY.map((entry) => [entry.id, entry] as const))
const BY_LEGACY_ID = new Map(LANGUAGE_REGISTRY.map((entry) => [entry.legacyId, entry] as const))

export function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === 'string' && BY_ID.has(value as LanguageId)
}

export function isSessionLanguageId(value: unknown): value is SessionLanguageId {
  return value === 'sql' || isLanguageId(value)
}

export function getLanguageDescriptor(id: LanguageId) {
  const descriptor = BY_ID.get(id)
  if (!descriptor) {
    throw new Error(`Unknown language id "${id}".`)
  }
  return descriptor
}

export function getLanguageDescriptorByLegacyId(legacyId: LegacyCodeLanguageId) {
  const descriptor = BY_LEGACY_ID.get(legacyId)
  if (!descriptor) {
    throw new Error(`Unknown legacy language id "${legacyId}".`)
  }
  return descriptor
}

export function toLegacyCodeLanguageId(languageId: LanguageId): LegacyCodeLanguageId {
  return getLanguageDescriptor(languageId).legacyId
}

export function fromLegacyCodeLanguageId(legacyId: LegacyCodeLanguageId): LanguageId {
  return getLanguageDescriptorByLegacyId(legacyId).id
}

export function normalizeSessionLanguageId(value: unknown): SessionLanguageId | null {
  if (value === 'sql') {
    return 'sql'
  }
  if (isLanguageId(value)) {
    return value
  }
  if (typeof value === 'string' && BY_LEGACY_ID.has(value as LegacyCodeLanguageId)) {
    return fromLegacyCodeLanguageId(value as LegacyCodeLanguageId)
  }
  return null
}

