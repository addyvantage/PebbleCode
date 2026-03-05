type HintTone = {
  label: string
  prefix: string
}

export type HintCard = {
  id: string
  label: string
  text: string
}

const HINT_TONES: HintTone[] = [
  { label: 'Pebble Tip', prefix: 'Tiny nudge: ' },
  { label: 'Quick Nudge', prefix: 'Quick sanity check: ' },
  { label: 'Tiny Step', prefix: 'Small win: ' },
  { label: 'Coach Cue', prefix: 'Try this: ' },
]

function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

function splitHintSentences(hint: string) {
  const compact = hint.replace(/\s+/g, ' ').trim()
  if (!compact) {
    return []
  }
  const parts = compact
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length <= 2) {
    return parts
  }
  return [parts.slice(0, 2).join(' '), parts.slice(2).join(' ')]
}

function withPrefix(text: string, prefix: string) {
  const normalized = text.trim()
  if (!normalized) {
    return normalized
  }
  const lower = normalized.toLowerCase()
  if (
    lower.startsWith('tiny nudge:') ||
    lower.startsWith('quick sanity check:') ||
    lower.startsWith('small win:') ||
    lower.startsWith('try this:')
  ) {
    return normalized
  }
  return `${prefix}${normalized}`
}

export function buildHintCards(hints: string[]) {
  const cards: HintCard[] = []

  hints.forEach((rawHint, hintIndex) => {
    const sentences = splitHintSentences(rawHint)
    if (sentences.length === 0) {
      return
    }

    sentences.forEach((sentence, sentenceIndex) => {
      const seed = hashString(`${sentence}-${hintIndex}-${sentenceIndex}`)
      const tone = HINT_TONES[seed % HINT_TONES.length]
      cards.push({
        id: `${hintIndex}-${sentenceIndex}-${seed}`,
        label: tone.label,
        text: withPrefix(sentence, tone.prefix),
      })
    })
  })

  return cards
}

