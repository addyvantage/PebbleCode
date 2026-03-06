import {
  getRecapLanguageMeta,
  normalizeAppLanguageCode,
  type AppLanguageCode,
} from '../../shared/recapVoice'

export type SpeakRecapInput = {
  text: string
  appLanguage: AppLanguageCode | string
  locale?: string
  preferredVoiceURI?: string | null
}

function getSpeechSynthesisInstance() {
  if (typeof window === 'undefined') {
    return null
  }
  return window.speechSynthesis ?? null
}

export function isBrowserSpeechSynthesisAvailable() {
  return Boolean(getSpeechSynthesisInstance() && typeof SpeechSynthesisUtterance !== 'undefined')
}

export function stopBrowserSpeech() {
  const synthesis = getSpeechSynthesisInstance()
  if (!synthesis) {
    return
  }
  synthesis.cancel()
}

export function loadBrowserVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  const synthesis = getSpeechSynthesisInstance()
  if (!synthesis) {
    return Promise.resolve([])
  }

  const initial = synthesis.getVoices()
  if (initial.length > 0) {
    return Promise.resolve(initial)
  }

  return new Promise((resolve) => {
    let resolved = false
    const resolveOnce = (voices: SpeechSynthesisVoice[]) => {
      if (resolved) {
        return
      }
      resolved = true
      synthesis.removeEventListener('voiceschanged', onVoicesChanged)
      clearTimeout(timer)
      resolve(voices)
    }

    const onVoicesChanged = () => {
      const next = synthesis.getVoices()
      if (next.length > 0) {
        resolveOnce(next)
      }
    }

    const timer = window.setTimeout(() => {
      resolveOnce(synthesis.getVoices())
    }, timeoutMs)

    synthesis.addEventListener('voiceschanged', onVoicesChanged)
    synthesis.getVoices()
  })
}

function normalizeLocale(value: string | undefined) {
  return value?.toLowerCase().replace('_', '-') ?? ''
}

export function pickBestBrowserVoice(
  voices: SpeechSynthesisVoice[],
  input: {
    appLanguage: AppLanguageCode | string
    locale?: string
    preferredVoiceURI?: string | null
  },
): SpeechSynthesisVoice | null {
  if (voices.length === 0) {
    return null
  }

  const preferredVoiceURI = input.preferredVoiceURI?.trim()
  if (preferredVoiceURI) {
    const exact = voices.find((voice) => voice.voiceURI === preferredVoiceURI)
    if (exact) {
      return exact
    }
  }

  const appLanguage = normalizeAppLanguageCode(input.appLanguage)
  const languageMeta = getRecapLanguageMeta(appLanguage)
  const desiredLocale = normalizeLocale(input.locale || languageMeta.locale)
  const localePrefix = desiredLocale.split('-')[0]

  const normalizedVoices = voices.map((voice) => ({
    voice,
    locale: normalizeLocale(voice.lang),
  }))

  return (
    normalizedVoices.find((entry) => entry.locale === desiredLocale)?.voice
    ?? normalizedVoices.find((entry) => entry.locale.startsWith(`${localePrefix}-`))?.voice
    ?? normalizedVoices.find((entry) => entry.locale === localePrefix)?.voice
    ?? normalizedVoices.find((entry) => entry.voice.default)?.voice
    ?? voices[0]
  )
}

export async function speakRecapWithBrowser(input: SpeakRecapInput): Promise<{
  utterance: SpeechSynthesisUtterance
  voice: SpeechSynthesisVoice | null
  done: Promise<void>
}> {
  const synthesis = getSpeechSynthesisInstance()
  if (!synthesis || typeof SpeechSynthesisUtterance === 'undefined') {
    throw new Error('browser_tts_unavailable')
  }

  const appLanguage = normalizeAppLanguageCode(input.appLanguage)
  const locale = input.locale || getRecapLanguageMeta(appLanguage).locale
  const voices = await loadBrowserVoices()
  const voice = pickBestBrowserVoice(voices, {
    appLanguage,
    locale,
    preferredVoiceURI: input.preferredVoiceURI,
  })

  const utterance = new SpeechSynthesisUtterance(input.text)
  utterance.lang = voice?.lang || locale
  utterance.rate = 0.95
  utterance.pitch = 1
  utterance.volume = 1
  if (voice) {
    utterance.voice = voice
  }

  const done = new Promise<void>((resolve, reject) => {
    utterance.onend = () => resolve()
    utterance.onerror = () => reject(new Error('browser_tts_playback_failed'))
  })

  synthesis.cancel()
  synthesis.speak(utterance)

  return {
    utterance,
    voice,
    done,
  }
}

