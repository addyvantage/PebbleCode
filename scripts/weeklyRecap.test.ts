import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePollyVoiceSupport } from '../shared/recapVoice.ts'
import { buildRecapNarrative } from '../server/phase9/recapBuilder.ts'
import { buildRecapSsml } from '../server/phase9/recapSsml.ts'
import { generateRecapAudio } from '../server/phase9/pollyClient.ts'

test('recap voice support: English resolves Polly voice', () => {
  const support = resolvePollyVoiceSupport({
    appLanguage: 'en',
  })
  assert.equal(support.supported, true)
  assert.equal(support.voiceId, 'Joanna')
  assert.equal(support.languageCode, 'en-US')
})

test('recap voice support: unsupported app language falls back cleanly', () => {
  const support = resolvePollyVoiceSupport({
    appLanguage: 'ta',
  })
  assert.equal(support.supported, false)
  assert.equal(support.reason, 'language_not_supported_by_polly')
  assert.equal(support.locale, 'ta-IN')
})

test('recap narrative: Hindi output keeps personalized structure', () => {
  const narrative = buildRecapNarrative({
    appLanguage: 'hi',
    trackLanguage: 'python',
    userName: 'Addy',
    solvesLast7: 6,
    solvesDelta: 2,
    daysActiveLast7: 5,
    streakDays: 4,
    streakDelta: 1,
    biggestStruggle: 'wrong_answer',
    trendDirection: 'improving',
    attemptsLast7: 12,
    passRateLast7: 0.62,
    passRateDelta: 8,
    guidanceReliancePct: 28,
    guidanceRelianceDeltaPct: -4,
    avgRecoveryTimeSec: 92,
    avgRecoveryTimeDeltaSec: -18,
    hardestSolvedDifficulty: 'medium',
  })

  assert.match(narrative.script, /Addy/)
  assert.match(narrative.script, /Weekly Pebble Recap/)
  assert.ok(narrative.script.length > 120)
})

test('recap ssml: wraps script with valid speak + prosody tags', () => {
  const ssml = buildRecapSsml({
    script: 'You solved four problems this week. Keep going.',
    tone: 'encouraging',
  })
  assert.match(ssml, /^<speak>[\s\S]*<\/speak>$/)
  assert.match(ssml, /<prosody/)
  assert.match(ssml, /<break time="\d+ms"\/>/)
})

test('audio generator: device mode skips Polly and returns fallback decision', async () => {
  const output = await generateRecapAudio({
    script: 'Weekly recap script',
    ssml: '<speak>Weekly recap script</speak>',
    appLanguage: 'en',
    mode: 'device',
    preferredPollyVoiceId: null,
    preferredBrowserVoiceURI: 'voice://browser/default',
  })

  assert.equal(output.audioBuffer, undefined)
  assert.equal(output.decision.provider, 'device')
  assert.equal(output.decision.reason, 'voice_mode_device')
  assert.equal(output.decision.preferredBrowserVoiceURI, 'voice://browser/default')
})

test('audio generator: unsupported language in auto mode falls back to device', async () => {
  const output = await generateRecapAudio({
    script: 'Weekly recap script',
    ssml: '<speak>Weekly recap script</speak>',
    appLanguage: 'bn',
    mode: 'auto',
    preferredPollyVoiceId: null,
    preferredBrowserVoiceURI: null,
  })

  assert.equal(output.audioBuffer, undefined)
  assert.equal(output.decision.provider, 'device')
  assert.equal(output.decision.reason, 'language_not_supported_by_polly')
})
