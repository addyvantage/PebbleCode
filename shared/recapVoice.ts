export const APP_LANGUAGE_CODES = [
  'en',
  'hi',
  'bn',
  'te',
  'mr',
  'ta',
  'ur',
  'gu',
  'kn',
  'ml',
  'or',
  'pa',
  'as',
] as const

export type AppLanguageCode = (typeof APP_LANGUAGE_CODES)[number]
export type RecapVoiceMode = 'auto' | 'polly' | 'device'

export type RecapLanguageMeta = {
  code: AppLanguageCode
  locale: string
  label: string
  polly?: {
    languageCode: string
    voices: readonly string[]
    defaultVoiceId: string
  }
}

export const RECAP_LANGUAGE_META: Record<AppLanguageCode, RecapLanguageMeta> = {
  en: {
    code: 'en',
    locale: 'en-US',
    label: 'English',
    polly: {
      languageCode: 'en-US',
      voices: ['Joanna', 'Matthew', 'Ruth', 'Danielle'],
      defaultVoiceId: 'Joanna',
    },
  },
  hi: {
    code: 'hi',
    locale: 'hi-IN',
    label: 'Hindi',
    polly: {
      languageCode: 'hi-IN',
      voices: ['Kajal', 'Aditi'],
      defaultVoiceId: 'Kajal',
    },
  },
  bn: { code: 'bn', locale: 'bn-IN', label: 'Bengali' },
  te: { code: 'te', locale: 'te-IN', label: 'Telugu' },
  mr: { code: 'mr', locale: 'mr-IN', label: 'Marathi' },
  ta: { code: 'ta', locale: 'ta-IN', label: 'Tamil' },
  ur: { code: 'ur', locale: 'ur-IN', label: 'Urdu' },
  gu: { code: 'gu', locale: 'gu-IN', label: 'Gujarati' },
  kn: { code: 'kn', locale: 'kn-IN', label: 'Kannada' },
  ml: { code: 'ml', locale: 'ml-IN', label: 'Malayalam' },
  or: { code: 'or', locale: 'or-IN', label: 'Odia' },
  pa: { code: 'pa', locale: 'pa-IN', label: 'Punjabi' },
  as: { code: 'as', locale: 'as-IN', label: 'Assamese' },
}

function isAppLanguageCode(value: unknown): value is AppLanguageCode {
  return typeof value === 'string' && (APP_LANGUAGE_CODES as readonly string[]).includes(value)
}

export function normalizeAppLanguageCode(value: unknown, fallback: AppLanguageCode = 'en'): AppLanguageCode {
  if (isAppLanguageCode(value)) {
    return value
  }
  return fallback
}

export function getRecapLanguageMeta(language: unknown): RecapLanguageMeta {
  const code = normalizeAppLanguageCode(language)
  return RECAP_LANGUAGE_META[code]
}

export type PollyVoiceSupport = {
  supported: boolean
  appLanguage: AppLanguageCode
  locale: string
  languageCode?: string
  voiceId?: string
  availableVoices: readonly string[]
  reason?: string
}

export function resolvePollyVoiceSupport(input: {
  appLanguage: unknown
  preferredVoiceId?: string | null
}): PollyVoiceSupport {
  const meta = getRecapLanguageMeta(input.appLanguage)
  const polly = meta.polly

  if (!polly) {
    return {
      supported: false,
      appLanguage: meta.code,
      locale: meta.locale,
      availableVoices: [],
      reason: 'language_not_supported_by_polly',
    }
  }

  const preferredVoice = input.preferredVoiceId?.trim()
  const selectedVoice = preferredVoice && polly.voices.includes(preferredVoice)
    ? preferredVoice
    : polly.defaultVoiceId

  return {
    supported: true,
    appLanguage: meta.code,
    locale: meta.locale,
    languageCode: polly.languageCode,
    voiceId: selectedVoice,
    availableVoices: polly.voices,
    reason: preferredVoice && !polly.voices.includes(preferredVoice)
      ? 'preferred_voice_not_available'
      : undefined,
  }
}
