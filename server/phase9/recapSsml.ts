import type { RecapTone } from './recapBuilder.ts'

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function splitSentences(script: string) {
  return script
    .split(/(?<=[.!?।])\s+/u)
    .map((line) => line.trim())
    .filter(Boolean)
}

function toneToRate(tone: RecapTone) {
  if (tone === 'celebratory') return '98%'
  if (tone === 'determined') return '95%'
  if (tone === 'reflective') return '91%'
  if (tone === 'empathetic') return '90%'
  return '93%'
}

function toneToPitch(tone: RecapTone) {
  if (tone === 'celebratory') return '+1st'
  if (tone === 'empathetic') return '-1st'
  return '0st'
}

/**
 * Build valid, restrained SSML for a premium mentor delivery.
 */
export function buildRecapSsml(input: {
  script: string
  tone: RecapTone
}) {
  const rows = splitSentences(input.script)
  const rate = toneToRate(input.tone)
  const pitch = toneToPitch(input.tone)

  const body = rows
    .map((sentence, index) => {
      const escaped = escapeXml(sentence)
      if (index === 1 || index === rows.length - 2) {
        return `<emphasis level="moderate">${escaped}</emphasis><break time="380ms"/>`
      }
      return `${escaped}<break time="300ms"/>`
    })
    .join(' ')

  return `<speak><prosody rate="${rate}" pitch="${pitch}">${body}</prosody></speak>`
}
