/**
 * Phase 9: Amazon Polly wrapper for Weekly Growth Ledger Narrator.
 *
 * Synthesizes speech from the recap script using Polly Neural engine.
 * Falls back to script-only mode if Polly is unavailable or RECAP_MODE=local.
 */

/** Supported Polly voices (subset — add more as needed). */
export type PollyVoiceId =
  | 'Joanna'   // US English, Female (default)
  | 'Matthew'  // US English, Male
  | 'Amy'      // British English, Female
  | 'Brian'    // British English, Male
  | 'Aria'     // New Zealand English, Female

/**
 * Synthesizes the given script text using Amazon Polly.
 * Returns raw MP3 bytes on success, throws on failure.
 */
export async function synthesizeSpeech(
  script: string,
  voiceId: string,
  region: string,
): Promise<Buffer> {
  const { PollyClient, SynthesizeSpeechCommand } = await import('@aws-sdk/client-polly')
  const client = new PollyClient({ region })

  try {
    const response = await client.send(
      new SynthesizeSpeechCommand({
        Text: script,
        // @ts-expect-error — SDK string enum vs. literal type
        OutputFormat: 'mp3',
        // @ts-expect-error — SDK string enum vs. literal type
        VoiceId: voiceId,
        // @ts-expect-error — SDK string enum vs. literal type
        Engine: 'neural',
        // @ts-expect-error — SDK string enum vs. literal type
        TextType: 'text',
      }),
    )

    if (!response.AudioStream) throw new Error('Polly returned no audio stream')

    const chunks: Uint8Array[] = []
    for await (const chunk of response.AudioStream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  } finally {
    client.destroy()
  }
}

/**
 * Top-level entry point: respects RECAP_MODE env var.
 * Returns { audioBuffer } on success, {} on script-only fallback.
 * Never throws.
 */
export async function generateRecapAudio(
  script: string,
): Promise<{ audioBuffer?: Buffer }> {
  const recapMode = (process.env.RECAP_MODE ?? 'auto') as 'auto' | 'aws' | 'local'
  const region = process.env.AWS_REGION ?? 'us-east-1'
  const voiceId = process.env.POLLY_VOICE_ID ?? 'Joanna'

  const useAws = (recapMode === 'aws' || recapMode === 'auto') && !!process.env.AWS_REGION

  if (useAws) {
    try {
      const audioBuffer = await synthesizeSpeech(script, voiceId, region)
      return { audioBuffer }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn('[recap] Polly failed, returning script only:', msg.slice(0, 120))
    }
  }

  return {}  // script-only mode
}
