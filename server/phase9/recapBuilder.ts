/**
 * Phase 9: Weekly Growth Ledger Narrator — script builder.
 *
 * Builds a ~30-60 second spoken recap from aggregated weekly metrics.
 * No code, user secrets, or raw event data is accepted or included in output.
 */

export type RecapSummary = {
  solvesLast7: number
  daysActiveLast7: number
  streakDays: number
  biggestStruggle: string | null   // e.g. "syntax_error" | "runtime_error" | null
  trendDirection: 'improving' | 'stable' | 'worsening'
  language: string                  // e.g. "python"
}

const STRUGGLE_LABELS: Record<string, string> = {
  syntax_error: 'syntax errors',
  runtime_error: 'runtime crashes',
  wrong_answer: 'logic mistakes',
  time_limit: 'time-limit issues',
  api_failure: 'API connectivity issues',
}

const ENCOURAGEMENTS = [
  'Every line of code you write makes you sharper. You have got this.',
  'Progress is not always linear — what matters is that you showed up.',
  'The strongest coders are built one problem at a time. Keep going.',
]

/**
 * Builds a clean, spoken-word recap script (~130-160 words ≈ 50-60 sec at Polly speed).
 * Safe for Polly — no special characters, no code snippets.
 */
export function buildRecapScript(summary: RecapSummary): string {
  const { solvesLast7, daysActiveLast7, streakDays, biggestStruggle, trendDirection, language } = summary

  const lines: string[] = []

  // Opening
  lines.push('Welcome to your weekly Pebble recap.')

  // Activity
  if (solvesLast7 >= 7) {
    lines.push(`Outstanding week — you solved ${solvesLast7} problems across ${daysActiveLast7} active days.`)
  } else if (solvesLast7 >= 3) {
    lines.push(`You solved ${solvesLast7} problems this week, staying active for ${daysActiveLast7} out of 7 days.`)
  } else {
    lines.push(`It was a lighter week with ${solvesLast7} problem${solvesLast7 === 1 ? '' : 's'} solved — that is okay.`)
  }

  // Streak
  if (streakDays >= 14) {
    lines.push(`Your ${streakDays}-day streak is exceptional. That kind of consistency compounds over time.`)
  } else if (streakDays >= 5) {
    lines.push(`Your ${streakDays}-day streak is building a strong foundation. Keep protecting it.`)
  } else if (streakDays >= 2) {
    lines.push(`You are on a ${streakDays}-day streak — a great start to build on this week.`)
  } else {
    lines.push('A fresh start on your streak — every expert was once a beginner rebuilding momentum.')
  }

  // Biggest struggle
  const struggleName = biggestStruggle ? STRUGGLE_LABELS[biggestStruggle] ?? biggestStruggle : null
  if (struggleName) {
    lines.push(`Your biggest challenge this week was ${struggleName}. Facing it head-on is how you grow.`)
  }

  // Trend
  if (trendDirection === 'improving') {
    lines.push('Your performance trend is pointing upward — the work is paying off.')
  } else if (trendDirection === 'worsening') {
    lines.push('This week showed some dips, which is a signal to slow down and reflect.')
  } else {
    lines.push('Your performance has been consistent and steady this week.')
  }

  // Encouragement
  lines.push(ENCOURAGEMENTS[streakDays % ENCOURAGEMENTS.length])

  // Concrete next action
  if (trendDirection === 'worsening' || solvesLast7 < 2) {
    lines.push(`Next week, aim for at least one ${language} problem per day — small wins rebuild confidence.`)
  } else if (biggestStruggle === 'syntax_error') {
    lines.push('Next week, read each line carefully before running — slow down to speed up.')
  } else if (solvesLast7 >= 7) {
    lines.push('Next week, push into harder problems to keep your skills growing at the edge.')
  } else {
    lines.push('Next week, set a goal to solve one more problem than this week.')
  }

  // Closing
  lines.push('That is your Pebble recap. See you next week.')

  return lines.join(' ')
}

/**
 * Basic safety filter for recap scripts.
 * Strips patterns that look like passwords, tokens, or code blocks.
 * Returns true if the script is clean enough to pass to Polly.
 */
export function isScriptSafe(script: string): boolean {
  // Block potential secret-like patterns (base64 blobs, API keys, private keys)
  if (/BEGIN (RSA|EC|PRIVATE|CERTIFICATE)|AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{32}/.test(script)) {
    return false
  }
  // Block code-like content (backticks, triple quotes, import/def/function keywords)
  if (/```|def |function |import |class |#!\//.test(script)) {
    return false
  }
  return true
}
