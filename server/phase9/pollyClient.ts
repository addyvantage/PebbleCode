/**
 * Phase 9: Amazon Polly wrapper for Weekly Growth Ledger Narrator.
 *
 * Handles:
 * - explicit voice mode preference (auto/polly/device)
 * - Polly support resolution per app language
 * - graceful fallback to browser/device synthesis
 * - SSML-first synthesis for natural delivery
 */

import {
  resolvePollyVoiceSupport,
  type AppLanguageCode,
  type RecapVoiceMode,
} from '../../shared/recapVoice.ts'

async function synthesizeWithPolly(input: {
  text: string
  textType: 'text' | 'ssml'
  voiceId: string
  languageCode: string
  region: string
  engine: 'neural' | 'standard'
}): Promise<Buffer> {
  const { PollyClient, SynthesizeSpeechCommand } = await import('@aws-sdk/client-polly')
  const client = new PollyClient({ region: input.region })
  try {
    const response = await client.send(
      new SynthesizeSpeechCommand({
        Text: input.text,
        OutputFormat: 'mp3',
        VoiceId: input.voiceId,
        Engine: input.engine,
        TextType: input.textType,
        LanguageCode: input.languageCode,
      }),
    )
    if (!response.AudioStream) {
      throw new Error('Polly returned no audio stream')
    }
    const chunks: Uint8Array[] = []
    for await (const chunk of response.AudioStream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  } finally {
    client.destroy()
  }
}

export type RecapAudioDecision = {
  mode: RecapVoiceMode
  provider: 'polly' | 'device'
  appLanguage: AppLanguageCode
  locale: string
  pollyVoiceId?: string
  pollyLanguageCode?: string
  preferredBrowserVoiceURI?: string
  reason?: string
}

export type RecapAudioOutput = {
  audioBuffer?: Buffer
  decision: RecapAudioDecision
}

export async function generateRecapAudio(input: {
  script: string
  ssml: string
  appLanguage: AppLanguageCode
  mode: RecapVoiceMode
  preferredPollyVoiceId?: string | null
  preferredBrowserVoiceURI?: string | null
}): Promise<RecapAudioOutput> {
  const support = resolvePollyVoiceSupport({
    appLanguage: input.appLanguage,
    preferredVoiceId: input.preferredPollyVoiceId,
  })

  const region = process.env.AWS_REGION ?? ''
  const recapMode = (process.env.RECAP_MODE ?? 'auto') as 'auto' | 'aws' | 'local'
  const awsAllowed = recapMode === 'aws' || recapMode === 'auto'
  const shouldUsePolly = input.mode !== 'device'

  const baseDecision: RecapAudioDecision = {
    mode: input.mode,
    provider: 'device',
    appLanguage: support.appLanguage,
    locale: support.locale,
    preferredBrowserVoiceURI: input.preferredBrowserVoiceURI ?? undefined,
  }

  if (!shouldUsePolly) {
    return {
      decision: {
        ...baseDecision,
        reason: 'voice_mode_device',
      },
    }
  }

  if (!support.supported) {
    return {
      decision: {
        ...baseDecision,
        reason: support.reason ?? 'language_not_supported_by_polly',
      },
    }
  }

  if (!awsAllowed) {
    return {
      decision: {
        ...baseDecision,
        reason: 'recap_mode_local',
      },
    }
  }

  if (!region) {
    return {
      decision: {
        ...baseDecision,
        reason: 'aws_region_missing',
      },
    }
  }

  const selectedVoice = support.voiceId
  const languageCode = support.languageCode
  if (!selectedVoice || !languageCode) {
    return {
      decision: {
        ...baseDecision,
        reason: 'polly_voice_resolution_failed',
      },
    }
  }

  // Try neural SSML first; gracefully fall back to standard text.
  try {
    const audioBuffer = await synthesizeWithPolly({
      text: input.ssml,
      textType: 'ssml',
      voiceId: selectedVoice,
      languageCode,
      region,
      engine: 'neural',
    })

    return {
      audioBuffer,
      decision: {
        mode: input.mode,
        provider: 'polly',
        appLanguage: support.appLanguage,
        locale: support.locale,
        pollyVoiceId: selectedVoice,
        pollyLanguageCode: languageCode,
        preferredBrowserVoiceURI: input.preferredBrowserVoiceURI ?? undefined,
        reason: support.reason,
      },
    }
  } catch (neuralErr) {
    const neuralMsg = neuralErr instanceof Error ? neuralErr.message : 'neural_synthesis_failed'
    try {
      const audioBuffer = await synthesizeWithPolly({
        text: input.script,
        textType: 'text',
        voiceId: selectedVoice,
        languageCode,
        region,
        engine: 'standard',
      })
      return {
        audioBuffer,
        decision: {
          mode: input.mode,
          provider: 'polly',
          appLanguage: support.appLanguage,
          locale: support.locale,
          pollyVoiceId: selectedVoice,
          pollyLanguageCode: languageCode,
          preferredBrowserVoiceURI: input.preferredBrowserVoiceURI ?? undefined,
          reason: `${support.reason ?? ''}${support.reason ? ';' : ''}neural_fallback_to_standard`,
        },
      }
    } catch (standardErr) {
      const standardMsg = standardErr instanceof Error ? standardErr.message : 'standard_synthesis_failed'
      console.warn(`[recap][polly] synthesis fallback failed: neural=${neuralMsg} standard=${standardMsg}`)
      return {
        decision: {
          ...baseDecision,
          reason: 'polly_neural_and_standard_failed',
        },
      }
    }
  }
}
