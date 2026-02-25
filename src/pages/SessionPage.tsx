import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CodeEditor } from '../components/session/CodeEditor'
import { GuidedFixPanel } from '../components/session/GuidedFixPanel'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Divider } from '../components/ui/Divider'
import { buttonClass } from '../components/ui/buttonStyles'
import { getDemoMode } from '../utils/demoMode'
import { updatePebbleMemoryAfterSession } from '../utils/pebbleMemory'
import { appendSessionInsight } from '../utils/sessionInsights'
import { runTask, type RunErrorKey, type TaskRunResult } from '../utils/taskHarness'
import { computeStruggleScore, type TelemetrySnapshot } from '../utils/telemetry'
import { getUserProfile, type UserSkillLevel } from '../utils/userProfile'

type Scene = 'struggle' | 'recovery' | 'complete'
type RunStatus = 'idle' | 'error' | 'success'
type RecoveryMode = 'none' | 'guided'
type DecisionChoice = 'show_me' | 'not_now' | null

type GuidedStep = {
  title: string
  detail: string
  runMessage: string
  highlightedLines: number[]
  proposedLines: number[]
}

type GuidedContent = {
  nudgeCopy: string
  guidedSteps: GuidedStep[]
}

type RecoveryState = {
  mode: RecoveryMode
  step: number
  totalSteps: number
  fixApplied: boolean
  startedAtSimSecond: number
}

type SimulationState = {
  simSecond: number
  scene: Scene
  codeText: string
  highlightedLines: number[]
  proposedLines: number[]
  runStatus: RunStatus
  runMessage: string
  lastErrorKey: RunErrorKey | null
  currentErrorKey: RunErrorKey | null
  guidedErrorKey: RunErrorKey | null
  errorKeyHistory: RunErrorKey[]
  sameErrorStreak: number
  telemetry: TelemetrySnapshot
  struggleScore: number
  thresholdStreak: number
  firstStruggleAt: number | null
  firstRecoveryAt: number | null
  recoveryTimeSec: number | null
  nudgeVisible: boolean
  nudgeEverShown: boolean
  nudgeShownAtSimSecond: number | null
  snoozeUntil: number
  snoozeCount: number
  recovery: RecoveryState
  recoveryEffectivenessScore: number
  struggleScorePeak: number
  flowRecovered: boolean
  sessionComplete: boolean
  usedHint: boolean
  decisionChoice: DecisionChoice
  timeToDecisionSec: number
  guidedFixStartedAtSimSecond: number | null
  timeInGuidedFixSec: number
  applyFixUsed: boolean
  recoveryStableSince: number | null
}

const AFK_THRESHOLD_MS = 20_000
const AFK_THRESHOLD_MS_DEMO = 7_000
const ACTIVITY_THROTTLE_MS = 500
const NUDGE_SCORE_THRESHOLD = 64
const NUDGE_STREAK_THRESHOLD = 3
const EDIT_WINDOW_MS = 5_000
const BACKSPACE_BURST_WINDOW_MS = 700
const BACKSPACE_BURST_THRESHOLD = 4
const ERROR_HISTORY_SIZE = 5

const initialCodeText = `function sumEven(nums: number[]) {
  let total = 0;
  for (const n of nums) {
    if (n % 2 = 0) {
      total += nums;
    }
  }
  return total
}`

const fixedCodeText = `function sumEven(nums: number[]) {
  let total = 0;
  for (const n of nums) {
    if (n % 2 === 0) {
      total += n;
    }
  }
  return total;
}`

const defaultNudgeCopy =
  'You are close. Validate parity first, then add the current number into your running total.'

const defaultGuidedSteps: GuidedStep[] = [
  {
    title: 'Identify the failing parity condition',
    detail: 'The failing branch comes from an invalid parity comparison operator on line 4.',
    runMessage: 'Step 1/3: inspecting the parity condition.',
    highlightedLines: [4],
    proposedLines: [4],
  },
  {
    title: 'Confirm accumulation target',
    detail: 'After parity passes, total should add the current value n instead of the source array.',
    runMessage: 'Step 2/3: validating accumulation target.',
    highlightedLines: [5],
    proposedLines: [5],
  },
  {
    title: 'Apply the minimal safe edit',
    detail: 'Apply strict parity and accumulator corrections, then rerun to confirm stability.',
    runMessage: 'Step 3/3: ready to apply the fix.',
    highlightedLines: [4, 5],
    proposedLines: [4, 5],
  },
]

const guidedContentByErrorKey: Record<RunErrorKey, GuidedContent> = {
  PARITY_CHECK: {
    nudgeCopy:
      'Parity validation is unstable. Lock the condition to n % 2 === 0 before accumulating.',
    guidedSteps: [
      {
        title: 'Stabilize parity condition',
        detail: 'Your branch condition needs strict equality to filter only even values.',
        runMessage: 'Step 1/3: verifying parity condition syntax.',
        highlightedLines: [4],
        proposedLines: [4],
      },
      {
        title: 'Confirm branch intent',
        detail: 'This branch should run only when the number is even.',
        runMessage: 'Step 2/3: confirming branch behavior.',
        highlightedLines: [4],
        proposedLines: [4],
      },
      {
        title: 'Apply strict parity check',
        detail: 'Apply the minimal operator fix and rerun.',
        runMessage: 'Step 3/3: ready to apply parity correction.',
        highlightedLines: [4],
        proposedLines: [4],
      },
    ],
  },
  ACCUMULATOR_TARGET: {
    nudgeCopy: 'Accumulator target is off. Add the current value n, not the source collection.',
    guidedSteps: [
      {
        title: 'Trace accumulation line',
        detail: 'The total update line is pulling from the wrong source.',
        runMessage: 'Step 1/3: locating accumulator target.',
        highlightedLines: [5],
        proposedLines: [5],
      },
      {
        title: 'Align accumulation intent',
        detail: 'Only the current loop value should be added to total.',
        runMessage: 'Step 2/3: validating accumulator logic.',
        highlightedLines: [5],
        proposedLines: [5],
      },
      {
        title: 'Apply accumulator correction',
        detail: 'Swap accumulator input to n and rerun.',
        runMessage: 'Step 3/3: ready to apply accumulator fix.',
        highlightedLines: [5],
        proposedLines: [5],
      },
    ],
  },
  OUTPUT_MISMATCH: {
    nudgeCopy: 'Output still mismatches. Tighten the final return path after parity and accumulation.',
    guidedSteps: [
      {
        title: 'Re-check output path',
        detail: 'Final output needs to return the stabilized total.',
        runMessage: 'Step 1/3: checking output path.',
        highlightedLines: [8],
        proposedLines: [8],
      },
      {
        title: 'Validate full function flow',
        detail: 'Parity branch + accumulation should feed directly into return total.',
        runMessage: 'Step 2/3: validating full flow.',
        highlightedLines: [4, 5, 8],
        proposedLines: [8],
      },
      {
        title: 'Apply output-safe cleanup',
        detail: 'Apply the minimal return cleanup and rerun.',
        runMessage: 'Step 3/3: ready to apply output correction.',
        highlightedLines: [8],
        proposedLines: [8],
      },
    ],
  },
}

const defaultRecoveryState: RecoveryState = {
  mode: 'none',
  step: 0,
  totalSteps: 0,
  fixApplied: false,
  startedAtSimSecond: 0,
}

const initialState: SimulationState = {
  simSecond: 0,
  scene: 'struggle',
  codeText: initialCodeText,
  highlightedLines: [],
  proposedLines: [],
  runStatus: 'idle',
  runMessage: 'Edit the function, then run to validate output.',
  lastErrorKey: null,
  currentErrorKey: null,
  guidedErrorKey: null,
  errorKeyHistory: [],
  sameErrorStreak: 0,
  telemetry: {
    keysPerSecond: 0,
    idleSeconds: 0,
    backspaceBurstCount: 0,
    runAttempts: 0,
    repeatErrorCount: 0,
  },
  struggleScore: 24,
  thresholdStreak: 0,
  firstStruggleAt: null,
  firstRecoveryAt: null,
  recoveryTimeSec: null,
  nudgeVisible: false,
  nudgeEverShown: false,
  nudgeShownAtSimSecond: null,
  snoozeUntil: 0,
  snoozeCount: 0,
  recovery: defaultRecoveryState,
  recoveryEffectivenessScore: 0,
  struggleScorePeak: 24,
  flowRecovered: false,
  sessionComplete: false,
  usedHint: false,
  decisionChoice: null,
  timeToDecisionSec: 0,
  guidedFixStartedAtSimSecond: null,
  timeInGuidedFixSec: 0,
  applyFixUsed: false,
  recoveryStableSince: null,
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function computeRecoveryEffectivenessScore(timeToRecovery: number) {
  return clamp(Math.round(100 - timeToRecovery * 12), 0, 100)
}

function getNudgeThreshold(skillLevel: UserSkillLevel | null) {
  if (skillLevel === 'Newbie') {
    return clamp(NUDGE_SCORE_THRESHOLD - 6, 45, 80)
  }
  if (skillLevel === 'Beginner') {
    return clamp(NUDGE_SCORE_THRESHOLD - 3, 45, 80)
  }
  if (skillLevel === 'Professional') {
    return clamp(NUDGE_SCORE_THRESHOLD + 4, 45, 80)
  }
  return NUDGE_SCORE_THRESHOLD
}

function personalizeNudgeCopy(baseCopy: string, skillLevel: UserSkillLevel | null) {
  if (skillLevel === 'Newbie' || skillLevel === 'Beginner') {
    return `${baseCopy} Pebble will walk you through each step clearly.`
  }
  if (skillLevel === 'Intermediate' || skillLevel === 'Professional') {
    return `${baseCopy} Keep it minimal, then rerun.`
  }
  return baseCopy
}

function isDecisionGateOpen(state: SimulationState) {
  return state.nudgeVisible && state.scene === 'struggle'
}

function isGuidedRecoveryInProgress(state: SimulationState) {
  return state.scene === 'struggle' && state.recovery.mode === 'guided' && !state.recovery.fixApplied
}

function getGuidedContent(errorKey: RunErrorKey | null): GuidedContent {
  if (!errorKey) {
    return {
      nudgeCopy: defaultNudgeCopy,
      guidedSteps: defaultGuidedSteps,
    }
  }

  return (
    guidedContentByErrorKey[errorKey] ?? {
      nudgeCopy: defaultNudgeCopy,
      guidedSteps: defaultGuidedSteps,
    }
  )
}

function recomputeStruggle(state: SimulationState, isAfk: boolean) {
  const nextScore = computeStruggleScore(state.telemetry, {
    runStatus: state.runStatus,
    phase: state.scene,
    isAfk,
  })

  return {
    ...state,
    struggleScore: nextScore,
    struggleScorePeak: Math.max(state.struggleScorePeak, nextScore),
  }
}

function buildGuidedSnippetLines(codeText: string, lineNumbers: number[]) {
  const codeLines = codeText.split('\n')
  if (codeLines.length === 0 || lineNumbers.length === 0) {
    return [] as string[]
  }

  const firstLine = Math.max(1, Math.min(...lineNumbers) - 1)
  const lastLine = Math.min(codeLines.length, Math.max(...lineNumbers) + 1)

  return codeLines
    .slice(firstLine - 1, lastLine)
    .map((line, index) => `${firstLine + index}. ${line}`)
}

function applyGuidedPatch(codeText: string) {
  const lines = codeText.split('\n')
  const nextLines = [...lines]

  let parityPatched = false
  let accumulatorPatched = false

  for (let index = 0; index < nextLines.length; index += 1) {
    const line = nextLines[index]

    if (!parityPatched && line.includes('if') && line.includes('%') && line.includes('2')) {
      const indent = line.match(/^\s*/)?.[0] ?? ''
      nextLines[index] = `${indent}if (n % 2 === 0) {`
      parityPatched = true
      continue
    }

    if (!accumulatorPatched && line.includes('total') && line.includes('+=')) {
      const indent = line.match(/^\s*/)?.[0] ?? ''
      nextLines[index] = `${indent}total += n;`
      accumulatorPatched = true
    }
  }

  const returnLineIndex = nextLines.findIndex((line) => line.trimStart().startsWith('return total'))
  if (returnLineIndex >= 0) {
    const indent = nextLines[returnLineIndex].match(/^\s*/)?.[0] ?? ''
    nextLines[returnLineIndex] = `${indent}return total;`
  }

  if (!parityPatched || !accumulatorPatched) {
    return fixedCodeText
  }

  return nextLines.join('\n')
}

function completeSession(state: SimulationState) {
  if (state.sessionComplete) {
    return state
  }

  const recoveryTimeSec =
    state.firstStruggleAt !== null && state.firstRecoveryAt !== null
      ? Math.max(1, state.firstRecoveryAt - state.firstStruggleAt)
      : Math.max(1, state.simSecond)

  return {
    ...state,
    scene: 'complete' as const,
    sessionComplete: true,
    highlightedLines: [],
    proposedLines: [],
    recoveryTimeSec,
    runMessage: 'Session complete. Recovery pattern logged.',
  }
}

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const demoMode = useMemo(() => getDemoMode(), [])
  const userProfile = useMemo(() => getUserProfile(), [])
  const afkThresholdMs = useMemo(
    () => (demoMode ? AFK_THRESHOLD_MS_DEMO : AFK_THRESHOLD_MS),
    [demoMode],
  )
  const nudgeScoreThreshold = useMemo(
    () => getNudgeThreshold(userProfile?.skillLevel ?? null),
    [userProfile],
  )

  const [sim, setSim] = useState<SimulationState>(initialState)
  const [isAfk, setIsAfk] = useState(false)
  const [isShowMeTooltipOpen, setIsShowMeTooltipOpen] = useState(false)
  const [showMeTooltipPosition, setShowMeTooltipPosition] = useState<{
    top: number
    left: number
  } | null>(null)

  const memoryUpdatedRef = useRef(false)
  const showMeButtonRef = useRef<HTMLButtonElement | null>(null)
  const showMeTooltipId = useId()

  const lastActivityAtRef = useRef(Date.now())
  const lastMouseMoveAtRef = useRef(0)
  const isWindowFocusedRef = useRef(true)
  const wasAfkRef = useRef(false)
  const guidedRecoveryOpenRef = useRef(false)

  const lastEditAtRef = useRef(Date.now())
  const editEventTimesRef = useRef<number[]>([])
  const deleteBurstRef = useRef({ count: 0, lastAt: 0 })

  const decisionGateOpen = isDecisionGateOpen(sim)
  const guidedRecoveryOpen = isGuidedRecoveryInProgress(sim)

  useEffect(() => {
    guidedRecoveryOpenRef.current = guidedRecoveryOpen
  }, [guidedRecoveryOpen])

  const getShowMeTooltipPosition = useCallback((buttonRect: DOMRect) => {
    const tooltipWidth = 320
    const tooltipHeight = 116
    const gap = 10
    const viewportPadding = 8

    const left = clamp(
      buttonRect.left + buttonRect.width / 2 - tooltipWidth / 2,
      viewportPadding,
      window.innerWidth - tooltipWidth - viewportPadding,
    )

    const aboveTop = buttonRect.top - tooltipHeight - gap
    const belowTop = buttonRect.bottom + gap

    const top =
      aboveTop >= viewportPadding
        ? aboveTop
        : clamp(
            belowTop,
            viewportPadding,
            window.innerHeight - tooltipHeight - viewportPadding,
          )

    return { top, left }
  }, [])

  const showShowMeTooltip = useCallback(() => {
    if (!decisionGateOpen || isAfk) {
      return
    }

    const rect = showMeButtonRef.current?.getBoundingClientRect()
    if (!rect) {
      return
    }

    setShowMeTooltipPosition(getShowMeTooltipPosition(rect))
    setIsShowMeTooltipOpen(true)
  }, [decisionGateOpen, getShowMeTooltipPosition, isAfk])

  const hideShowMeTooltip = useCallback(() => {
    setIsShowMeTooltipOpen(false)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    isWindowFocusedRef.current = document.hasFocus()
    lastActivityAtRef.current = Date.now()

    const markActive = (force = false) => {
      const now = Date.now()
      if (!force && now - lastActivityAtRef.current < ACTIVITY_THROTTLE_MS) {
        return
      }

      lastActivityAtRef.current = now
      if (document.visibilityState === 'visible' && isWindowFocusedRef.current) {
        setIsAfk(false)
      }
    }

    const handleMouseMove = () => {
      const now = Date.now()
      if (now - lastMouseMoveAtRef.current < ACTIVITY_THROTTLE_MS) {
        return
      }

      lastMouseMoveAtRef.current = now
      markActive(true)
    }

    const handleKeyDown = () => {
      markActive(true)
    }

    const handlePointerDown = () => {
      markActive(true)
    }

    const handleTouchStart = () => {
      markActive(true)
    }

    const handleWheel = () => {
      markActive()
    }

    const handleFocus = () => {
      isWindowFocusedRef.current = true
      markActive(true)
    }

    const handleBlur = () => {
      isWindowFocusedRef.current = false
      setIsAfk(true)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsAfk(true)
        return
      }

      markActive(true)
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'hidden' || !isWindowFocusedRef.current) {
        setIsAfk(true)
        return
      }

      const now = Date.now()
      if (now - lastActivityAtRef.current >= afkThresholdMs) {
        if (guidedRecoveryOpenRef.current) {
          setIsAfk(false)
        } else {
          setIsAfk(true)
        }
      } else {
        setIsAfk(false)
      }
    }, 1000)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('wheel', handleWheel)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [afkThresholdMs])

  useEffect(() => {
    if (isAfk) {
      wasAfkRef.current = true
      setIsShowMeTooltipOpen(false)
      return
    }

    if (!wasAfkRef.current) {
      return
    }

    wasAfkRef.current = false
    setSim((prev) => {
      const nextRunMessage =
        prev.scene === 'struggle' && !isGuidedRecoveryInProgress(prev)
          ? 'Back in session. Pebble recalibrated struggle signals.'
          : prev.runMessage

      return {
        ...prev,
        telemetry: {
          ...prev.telemetry,
          idleSeconds: Math.max(0, prev.telemetry.idleSeconds - 3),
        },
        thresholdStreak: 0,
        runMessage: nextRunMessage,
      }
    })
  }, [isAfk])

  useEffect(() => {
    const tickMs = demoMode ? 750 : 1000

    const timer = window.setInterval(() => {
      setSim((prev) => {
        if (prev.sessionComplete || isAfk) {
          return prev
        }

        const now = Date.now()
        editEventTimesRef.current = editEventTimesRef.current.filter(
          (timestamp) => now - timestamp <= EDIT_WINDOW_MS,
        )

        const keysPerSecond = Number((editEventTimesRef.current.length / 5).toFixed(1))
        const decisionPaused = isDecisionGateOpen(prev)
        const guidedPaused = isGuidedRecoveryInProgress(prev)

        let next: SimulationState = {
          ...prev,
          simSecond: prev.simSecond + 1,
          telemetry: {
            ...prev.telemetry,
          },
        }

        if (!decisionPaused && !guidedPaused) {
          next.telemetry.keysPerSecond = keysPerSecond

          if (now - lastEditAtRef.current >= 1000) {
            next.telemetry.idleSeconds += 1
          } else {
            next.telemetry.idleSeconds = Math.max(0, next.telemetry.idleSeconds - 1)
          }

          next = recomputeStruggle(next, isAfk)

          if (next.scene === 'struggle') {
            if (next.struggleScore >= nudgeScoreThreshold) {
              next.thresholdStreak += 1
            } else {
              next.thresholdStreak = Math.max(0, next.thresholdStreak - 1)
            }

            if (
              next.firstStruggleAt === null &&
              next.thresholdStreak >= NUDGE_STREAK_THRESHOLD
            ) {
              next.firstStruggleAt = next.simSecond
            }

            const nudgeEligibleByRuns =
              next.telemetry.runAttempts >= 2 || next.telemetry.repeatErrorCount >= 1

            if (
              !next.nudgeVisible &&
              next.simSecond >= next.snoozeUntil &&
              nudgeEligibleByRuns &&
              next.thresholdStreak >= NUDGE_STREAK_THRESHOLD
            ) {
              next.nudgeVisible = true
              next.nudgeEverShown = true
              next.nudgeShownAtSimSecond = next.simSecond
            }
          }
        }

        const stableSeconds = demoMode ? 3 : 6
        if (
          next.scene === 'recovery' &&
          next.runStatus === 'success' &&
          next.recoveryStableSince !== null &&
          next.simSecond - next.recoveryStableSince >= stableSeconds
        ) {
          next = completeSession(next)
        }

        return next
      })
    }, tickMs)

    return () => window.clearInterval(timer)
  }, [demoMode, isAfk, nudgeScoreThreshold])

  useEffect(() => {
    if (!sim.sessionComplete || sim.recoveryTimeSec === null || memoryUpdatedRef.current) {
      return
    }

    memoryUpdatedRef.current = true
    const flowStability = clamp(
      Math.round(100 - sim.struggleScore * 0.72 + (sim.usedHint ? 4 : 8)),
      58,
      92,
    )

    updatePebbleMemoryAfterSession({
      usedHint: sim.usedHint,
      nudgeShown: sim.nudgeEverShown,
      flowStability,
      recoveryTimeSec: sim.recoveryTimeSec,
      breakpointsResolved: Math.max(1, sim.telemetry.repeatErrorCount + 1),
      repeatErrorCount: sim.telemetry.repeatErrorCount,
      autonomousRecovery: !sim.usedHint,
    })

    appendSessionInsight({
      sessionId: sessionId ?? '1',
      struggleScorePeak: sim.struggleScorePeak,
      recoveryMode: sim.decisionChoice === 'show_me' ? 'guided' : 'skipped',
      recoveryEffectivenessScore: sim.applyFixUsed ? sim.recoveryEffectivenessScore : 0,
      totalRecoveryTime: sim.recoveryTimeSec,
      timeToDecisionSec: sim.timeToDecisionSec,
      timeInGuidedFixSec: sim.timeInGuidedFixSec,
      applyFixUsed: sim.applyFixUsed,
      timestamp: Date.now(),
    })
  }, [sessionId, sim])

  useEffect(() => {
    if (!isShowMeTooltipOpen || isAfk) {
      return
    }

    const updateTooltipPosition = () => {
      const rect = showMeButtonRef.current?.getBoundingClientRect()
      if (!rect) {
        return
      }
      setShowMeTooltipPosition(getShowMeTooltipPosition(rect))
    }

    updateTooltipPosition()
    window.addEventListener('resize', updateTooltipPosition)
    window.addEventListener('scroll', updateTooltipPosition, true)

    return () => {
      window.removeEventListener('resize', updateTooltipPosition)
      window.removeEventListener('scroll', updateTooltipPosition, true)
    }
  }, [getShowMeTooltipPosition, isAfk, isShowMeTooltipOpen])

  function onEditorChange(nextValue: string) {
    const now = Date.now()
    lastEditAtRef.current = now
    editEventTimesRef.current.push(now)
    editEventTimesRef.current = editEventTimesRef.current.filter(
      (timestamp) => now - timestamp <= EDIT_WINDOW_MS,
    )

    setSim((prev) => {
      if (prev.sessionComplete && prev.scene !== 'complete') {
        return prev
      }

      const deletedChars = Math.max(0, prev.codeText.length - nextValue.length)
      let backspaceBurstDelta = 0

      if (deletedChars > 0) {
        if (now - deleteBurstRef.current.lastAt <= BACKSPACE_BURST_WINDOW_MS) {
          deleteBurstRef.current.count += deletedChars
        } else {
          deleteBurstRef.current.count = deletedChars
        }

        deleteBurstRef.current.lastAt = now

        if (deleteBurstRef.current.count >= BACKSPACE_BURST_THRESHOLD) {
          backspaceBurstDelta = 1
          deleteBurstRef.current.count = 0
        }
      } else if (nextValue.length > prev.codeText.length) {
        deleteBurstRef.current.count = 0
        deleteBurstRef.current.lastAt = now
      }

      let next: SimulationState = {
        ...prev,
        codeText: nextValue,
        telemetry: {
          ...prev.telemetry,
          backspaceBurstCount: prev.telemetry.backspaceBurstCount + backspaceBurstDelta,
        },
      }

      if (prev.scene === 'recovery' || prev.scene === 'complete') {
        next.scene = 'struggle'
        next.sessionComplete = false
        next.recovery = defaultRecoveryState
        next.recoveryStableSince = null
        next.recoveryTimeSec = null
        next.runStatus = 'idle'
        next.runMessage = 'Code updated. Run again to validate output.'
        next.flowRecovered = false
        next.thresholdStreak = 0
        next.firstStruggleAt = null
        next.firstRecoveryAt = null
        next.nudgeVisible = false
        next.nudgeShownAtSimSecond = null
        next.snoozeUntil = prev.simSecond + 5
        next.lastErrorKey = null
        next.currentErrorKey = null
        next.guidedErrorKey = null
        next.errorKeyHistory = []
        next.sameErrorStreak = 0
        next.telemetry.repeatErrorCount = 0
      }

      if (!isDecisionGateOpen(prev) && !isGuidedRecoveryInProgress(prev)) {
        next = recomputeStruggle(next, isAfk)
      }

      return next
    })
  }

  function processRunResult(prev: SimulationState, result: TaskRunResult): SimulationState {
    const runAttempts = prev.telemetry.runAttempts + 1
    const nextErrorKey = result.status === 'error' ? result.errorKey ?? null : null
    const historyWithCurrent =
      nextErrorKey === null
        ? prev.errorKeyHistory
        : [...prev.errorKeyHistory, nextErrorKey].slice(-ERROR_HISTORY_SIZE)
    const uniqueErrorCount = new Set(historyWithCurrent).size
    const sameErrorStreak =
      nextErrorKey !== null && prev.lastErrorKey === nextErrorKey ? prev.sameErrorStreak + 1 : 1

    let repeatErrorCount = prev.telemetry.repeatErrorCount
    if (result.status === 'success') {
      repeatErrorCount = 0
    } else if (nextErrorKey !== null) {
      if (prev.lastErrorKey === nextErrorKey) {
        repeatErrorCount += sameErrorStreak >= 3 ? 2 : 1
      } else if (uniqueErrorCount >= 3) {
        repeatErrorCount = Math.max(0, repeatErrorCount - 1)
      }
    }

    let next: SimulationState = {
      ...prev,
      telemetry: {
        ...prev.telemetry,
        runAttempts,
        repeatErrorCount: clamp(repeatErrorCount, 0, 14),
      },
      runStatus: result.status,
      runMessage: result.message,
      currentErrorKey: nextErrorKey,
      lastErrorKey: nextErrorKey,
      errorKeyHistory: result.status === 'error' && nextErrorKey !== null ? historyWithCurrent : [],
      sameErrorStreak: result.status === 'error' && nextErrorKey !== null ? sameErrorStreak : 0,
      highlightedLines: result.status === 'success' ? [4, 5] : [],
      proposedLines: [],
      nudgeVisible: result.status === 'success' ? false : prev.nudgeVisible,
      nudgeShownAtSimSecond: result.status === 'success' ? null : prev.nudgeShownAtSimSecond,
      thresholdStreak: result.status === 'success' ? 0 : prev.thresholdStreak,
      scene: result.status === 'success' ? 'recovery' : 'struggle',
      recoveryStableSince: result.status === 'success' ? prev.simSecond : null,
      flowRecovered: result.status === 'success',
      recovery: result.status === 'success' ? defaultRecoveryState : prev.recovery,
      firstRecoveryAt:
        result.status === 'success' && prev.firstStruggleAt !== null && prev.firstRecoveryAt === null
          ? prev.simSecond
          : prev.firstRecoveryAt,
    }

    next = recomputeStruggle(next, isAfk)
    return next
  }

  function onRun() {
    if (isAfk || decisionGateOpen || isGuidedRecoveryInProgress(sim)) {
      return
    }

    setSim((prev) => {
      if (isDecisionGateOpen(prev) || isGuidedRecoveryInProgress(prev)) {
        return prev
      }

      const result = runTask(prev.codeText)
      return processRunResult(prev, result)
    })
  }

  function onShowMe() {
    setIsShowMeTooltipOpen(false)

    setSim((prev) => {
      const decisionTime =
        prev.nudgeShownAtSimSecond === null ? 0 : Math.max(1, prev.simSecond - prev.nudgeShownAtSimSecond)

      const guidedContent = getGuidedContent(prev.currentErrorKey)
      const firstStep = guidedContent.guidedSteps[0] ?? defaultGuidedSteps[0]

      return {
        ...prev,
        decisionChoice: 'show_me',
        timeToDecisionSec: decisionTime,
        guidedFixStartedAtSimSecond: prev.simSecond,
        guidedErrorKey: prev.currentErrorKey,
        nudgeVisible: false,
        nudgeShownAtSimSecond: null,
        runStatus: 'error',
        runMessage: firstStep.runMessage,
        highlightedLines: firstStep.highlightedLines,
        proposedLines: firstStep.proposedLines,
        recovery: {
          mode: 'guided',
          step: 1,
          totalSteps: guidedContent.guidedSteps.length,
          fixApplied: false,
          startedAtSimSecond: prev.simSecond,
        },
      }
    })
  }

  function onNotNow() {
    setIsShowMeTooltipOpen(false)

    setSim((prev) => {
      const decisionTime =
        prev.nudgeShownAtSimSecond === null ? 0 : Math.max(1, prev.simSecond - prev.nudgeShownAtSimSecond)
      const snoozeDuration = Math.min(40, 15 + prev.snoozeCount * 5)

      return {
        ...prev,
        nudgeVisible: false,
        nudgeShownAtSimSecond: null,
        snoozeUntil: prev.simSecond + snoozeDuration,
        snoozeCount: prev.snoozeCount + 1,
        thresholdStreak: 0,
        decisionChoice: 'not_now',
        timeToDecisionSec: decisionTime,
        guidedFixStartedAtSimSecond: null,
        timeInGuidedFixSec: 0,
        applyFixUsed: false,
        runMessage: `Pebble nudge snoozed for ${snoozeDuration} simulated seconds.`,
      }
    })
  }

  function onGuidedNextStep() {
    setSim((prev) => {
      if (!isGuidedRecoveryInProgress(prev)) {
        return prev
      }

      const activeSteps = getGuidedContent(prev.guidedErrorKey).guidedSteps
      const nextStep = clamp(prev.recovery.step + 1, 1, prev.recovery.totalSteps)
      const stepConfig = activeSteps[nextStep - 1] ?? activeSteps[activeSteps.length - 1]

      return {
        ...prev,
        runStatus: 'error',
        runMessage: stepConfig.runMessage,
        highlightedLines: stepConfig.highlightedLines,
        proposedLines: stepConfig.proposedLines,
        recovery: {
          ...prev.recovery,
          step: nextStep,
        },
      }
    })
  }

  function onGuidedBackStep() {
    setSim((prev) => {
      if (!isGuidedRecoveryInProgress(prev)) {
        return prev
      }

      const activeSteps = getGuidedContent(prev.guidedErrorKey).guidedSteps
      const previousStep = clamp(prev.recovery.step - 1, 1, prev.recovery.totalSteps)
      const stepConfig = activeSteps[previousStep - 1] ?? activeSteps[0]

      return {
        ...prev,
        runStatus: 'error',
        runMessage: stepConfig.runMessage,
        highlightedLines: stepConfig.highlightedLines,
        proposedLines: stepConfig.proposedLines,
        recovery: {
          ...prev.recovery,
          step: previousStep,
        },
      }
    })
  }

  function onGuidedApplyFix() {
    setSim((prev) => {
      if (!isGuidedRecoveryInProgress(prev)) {
        return prev
      }

      const patchedCode = applyGuidedPatch(prev.codeText)
      const runResult = runTask(patchedCode)
      const guidedDuration =
        prev.guidedFixStartedAtSimSecond === null
          ? 0
          : Math.max(1, prev.simSecond - prev.guidedFixStartedAtSimSecond)

      let next: SimulationState = {
        ...prev,
        codeText: patchedCode,
        usedHint: true,
        applyFixUsed: true,
        timeInGuidedFixSec: guidedDuration,
        recoveryEffectivenessScore: computeRecoveryEffectivenessScore(guidedDuration),
        recovery: {
          ...prev.recovery,
          step: prev.recovery.totalSteps,
          fixApplied: true,
        },
        telemetry: {
          ...prev.telemetry,
          repeatErrorCount: 0,
          backspaceBurstCount: Math.max(0, prev.telemetry.backspaceBurstCount - 1),
          idleSeconds: Math.max(0, prev.telemetry.idleSeconds - 2),
        },
      }

      next = processRunResult(next, runResult)

      if (runResult.status === 'success') {
        next.runStatus = 'success'
        next.runMessage = runResult.message
        next.highlightedLines = [4, 5]
        next.proposedLines = [4, 5]
        next.scene = 'recovery'
        next.recoveryStableSince = next.simSecond
        next.recovery = {
          mode: 'guided',
          step: prev.recovery.totalSteps,
          totalSteps: prev.recovery.totalSteps,
          fixApplied: true,
          startedAtSimSecond: prev.recovery.startedAtSimSecond,
        }
      }

      return next
    })
  }

  function onGuidedExit() {
    setSim((prev) => {
      if (!isGuidedRecoveryInProgress(prev)) {
        return prev
      }

      return {
        ...prev,
        recovery: defaultRecoveryState,
        guidedErrorKey: null,
        highlightedLines: [],
        proposedLines: [],
        runStatus: 'idle',
        runMessage: 'Guided fix closed. Continue independently or request a new nudge.',
        nudgeVisible: false,
        nudgeShownAtSimSecond: null,
        guidedFixStartedAtSimSecond: null,
        timeInGuidedFixSec: 0,
        applyFixUsed: false,
        snoozeUntil: prev.simSecond + 10,
        thresholdStreak: 0,
      }
    })
  }

  function onFinishSession() {
    setSim((prev) => {
      if (prev.scene !== 'recovery' || prev.runStatus !== 'success') {
        return prev
      }

      return completeSession(prev)
    })
  }

  function onReplay() {
    memoryUpdatedRef.current = false
    lastEditAtRef.current = Date.now()
    editEventTimesRef.current = []
    deleteBurstRef.current = { count: 0, lastAt: 0 }
    setIsShowMeTooltipOpen(false)
    setSim(initialState)
  }

  const phaseLabel =
    isGuidedRecoveryInProgress(sim)
      ? 'Guided recovery'
      : sim.scene === 'struggle'
        ? 'Struggle'
        : sim.scene === 'recovery'
          ? 'Recovery'
          : 'Complete'

  const nudgeGuidance = useMemo(() => getGuidedContent(sim.currentErrorKey), [sim.currentErrorKey])
  const personalizedNudgeCopy = useMemo(
    () => personalizeNudgeCopy(nudgeGuidance.nudgeCopy, userProfile?.skillLevel ?? null),
    [nudgeGuidance.nudgeCopy, userProfile],
  )
  const profileLabel = useMemo(() => {
    if (!userProfile) {
      return 'Profile not set'
    }

    return `${userProfile.skillLevel} • ${userProfile.goal} • ${userProfile.primaryLanguage}`
  }, [userProfile])
  const activeGuidedSteps = useMemo(
    () => getGuidedContent(sim.guidedErrorKey).guidedSteps,
    [sim.guidedErrorKey],
  )

  const currentGuidedStep =
    sim.recovery.mode === 'guided' && sim.recovery.step > 0
      ? activeGuidedSteps[Math.min(sim.recovery.step - 1, activeGuidedSteps.length - 1)]
      : null

  const guidedSnippetLines =
    currentGuidedStep === null
      ? []
      : buildGuidedSnippetLines(sim.codeText, currentGuidedStep.proposedLines)

  const runBadgeVariant =
    sim.runStatus === 'success' ? 'success' : sim.runStatus === 'error' ? 'warning' : 'neutral'

  return (
    <section className="page-enter grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <Card className="min-h-[520px] space-y-4" padding="md" interactive>
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Badge variant="neutral">Mini IDE</Badge>
            <h1 className="text-2xl font-semibold tracking-[-0.015em] text-pebble-text-primary">
              Session {sessionId ?? '1'}
            </h1>
            <Badge variant="neutral" className="max-w-full truncate">
              {profileLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={runBadgeVariant}>{sim.runStatus === 'idle' ? phaseLabel : sim.runStatus}</Badge>
            {sim.flowRecovered && <Badge variant="success">Flow recovered</Badge>}
            {isAfk && <Badge variant="neutral">AFK</Badge>}
            <Button
              size="sm"
              variant="primary"
              onClick={onRun}
              disabled={isAfk || decisionGateOpen || isGuidedRecoveryInProgress(sim)}
            >
              Run
            </Button>
            <Button size="sm" variant="secondary" onClick={onReplay}>
              Replay
            </Button>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-pebble-border/28 bg-pebble-overlay/[0.06] p-3">
            <p className="text-xs text-pebble-text-secondary">Typing cadence</p>
            <p className="mt-1 text-base font-semibold text-pebble-text-primary">
              {sim.telemetry.keysPerSecond.toFixed(1)} keys/s
            </p>
          </div>
          <div className="rounded-xl border border-pebble-border/28 bg-pebble-overlay/[0.06] p-3">
            <p className="text-xs text-pebble-text-secondary">Idle</p>
            <p className="mt-1 text-base font-semibold text-pebble-text-primary">
              {sim.telemetry.idleSeconds}s
            </p>
          </div>
          <div className="rounded-xl border border-pebble-border/28 bg-pebble-overlay/[0.06] p-3">
            <p className="text-xs text-pebble-text-secondary">Backspace bursts</p>
            <p className="mt-1 text-base font-semibold text-pebble-text-primary">
              {sim.telemetry.backspaceBurstCount}
            </p>
          </div>
          <div className="rounded-xl border border-pebble-border/28 bg-pebble-overlay/[0.06] p-3">
            <p className="text-xs text-pebble-text-secondary">Run attempts</p>
            <p className="mt-1 text-base font-semibold text-pebble-text-primary">
              {sim.telemetry.runAttempts}
            </p>
          </div>
          <div className="rounded-xl border border-pebble-border/28 bg-pebble-overlay/[0.06] p-3">
            <p className="text-xs text-pebble-text-secondary">Repeat errors</p>
            <p className="mt-1 text-base font-semibold text-pebble-text-primary">
              {sim.telemetry.repeatErrorCount}
            </p>
          </div>
          <div className="rounded-xl border border-pebble-border/28 bg-pebble-overlay/[0.06] p-3">
            <p className="text-xs text-pebble-text-secondary">Struggle score</p>
            <p className="mt-1 text-base font-semibold text-pebble-warning">{sim.struggleScore}/100</p>
          </div>
        </div>

        <CodeEditor
          value={sim.codeText}
          onChange={onEditorChange}
          highlightedLines={sim.highlightedLines}
          proposedLines={sim.proposedLines}
          readOnly={sim.sessionComplete || isGuidedRecoveryInProgress(sim)}
          onRunRequested={onRun}
          onEscape={isGuidedRecoveryInProgress(sim) ? onGuidedExit : undefined}
        />

        <div className="rounded-xl border border-pebble-border/28 bg-pebble-overlay/[0.06] p-4">
          <p className="text-xs text-pebble-text-secondary">Run output</p>
          <p className="mt-1 text-sm text-pebble-text-primary">{sim.runMessage}</p>
        </div>
      </Card>

      <Card className="space-y-4" padding="md" interactive>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-[-0.015em] text-pebble-text-primary">
            Cognitive recovery
          </h2>
          <p className="text-sm leading-relaxed text-pebble-text-secondary">
            Pebble watches live editing and run behavior, then nudges when struggle patterns persist.
          </p>
        </div>

        <Divider />

        {sim.nudgeVisible && (
          <div
            className="nudge-enter rounded-xl border border-pebble-accent/30 bg-pebble-accent/10 p-4"
          >
            <p className="text-sm font-semibold text-pebble-text-primary">Pebble nudge</p>
            <p className="mt-2 text-sm leading-relaxed text-pebble-text-secondary">
              {personalizedNudgeCopy}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                ref={showMeButtonRef}
                type="button"
                className={buttonClass('primary', 'sm')}
                onClick={onShowMe}
                onMouseEnter={showShowMeTooltip}
                onMouseLeave={hideShowMeTooltip}
                onFocus={showShowMeTooltip}
                onBlur={hideShowMeTooltip}
                aria-describedby={isShowMeTooltipOpen ? showMeTooltipId : undefined}
              >
                Show me
              </button>
              <button
                type="button"
                className={buttonClass('secondary', 'sm')}
                onClick={onNotNow}
              >
                Not now
              </button>
            </div>
          </div>
        )}

        <GuidedFixPanel
          open={isGuidedRecoveryInProgress(sim) && currentGuidedStep !== null}
          step={sim.recovery.step}
          totalSteps={sim.recovery.totalSteps}
          title={currentGuidedStep?.title ?? ''}
          description={currentGuidedStep?.detail ?? ''}
          snippetLines={guidedSnippetLines}
          canGoBack={sim.recovery.step > 1}
          canGoNext={sim.recovery.step < sim.recovery.totalSteps}
          isAfk={isAfk}
          onApplyFix={onGuidedApplyFix}
          onNextStep={onGuidedNextStep}
          onBackStep={onGuidedBackStep}
          onExit={onGuidedExit}
        />

        {!sim.nudgeVisible && sim.scene === 'struggle' && sim.simSecond < sim.snoozeUntil && (
          <div className="rounded-xl border border-pebble-border/28 bg-pebble-overlay/[0.06] p-3">
            <p className="text-xs font-medium tracking-[0.01em] text-pebble-text-secondary">
              Snoozed · {sim.snoozeUntil - sim.simSecond}s remaining
            </p>
            <p className="mt-1 text-xs text-pebble-text-muted">
              Pebble will re-check after the timer expires.
            </p>
          </div>
        )}

        <div className="space-y-2 rounded-xl border border-pebble-border/28 bg-pebble-overlay/[0.06] p-4">
          <p className="text-sm font-medium text-pebble-text-primary">Session state</p>
          <p className="text-sm text-pebble-text-secondary">
            {isAfk
              ? 'AFK detected. Struggle signals are paused until activity resumes.'
              : sim.scene === 'complete'
                ? `Completed. Recovery time: ${sim.recoveryTimeSec ?? 0}s.`
                : isGuidedRecoveryInProgress(sim)
                  ? `Guided fix step ${sim.recovery.step}/${sim.recovery.totalSteps} is active.`
                  : sim.scene === 'recovery'
                    ? 'Recovery phase active. Success is stable and ready to finish.'
                    : 'Struggle phase active. Keep iterating and run when ready.'}
          </p>
        </div>

        {sim.recoveryEffectivenessScore > 0 && (
          <div className="rounded-xl border border-pebble-border/28 bg-pebble-overlay/[0.06] p-4">
            <p className="text-xs text-pebble-text-secondary">Guided recovery effectiveness</p>
            <p className="mt-1 text-sm font-medium text-pebble-text-primary">
              {sim.recoveryEffectivenessScore}/100 based on guided fix response time.
            </p>
          </div>
        )}

        {sim.scene === 'recovery' && sim.runStatus === 'success' && !sim.sessionComplete && (
          <Button size="sm" variant="primary" onClick={onFinishSession}>
            Finish session
          </Button>
        )}

        <div className="rounded-xl border border-pebble-border/28 bg-pebble-overlay/[0.06] p-4">
          <p className="text-xs text-pebble-text-secondary">Demo pacing</p>
          <p className="mt-1 text-sm font-medium text-pebble-text-primary">
            {demoMode
              ? 'Demo mode On. AFK + pacing windows are shortened.'
              : 'Demo mode Off. Standard pacing and AFK windows are active.'}
          </p>
        </div>

        <Link to="/dashboard" className={buttonClass('secondary', 'sm')}>
          Open insights
        </Link>
      </Card>

      {isShowMeTooltipOpen &&
        showMeTooltipPosition &&
        decisionGateOpen &&
        !isAfk && (
          <div
            id={showMeTooltipId}
            role="tooltip"
            className="coachmark-tip fixed z-[68] w-[320px] rounded-xl border border-pebble-border/45 bg-pebble-panel p-3 shadow-[0_16px_38px_rgba(2,8,23,0.32)] backdrop-blur-xl"
            style={{
              top: showMeTooltipPosition.top,
              left: showMeTooltipPosition.left,
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-pebble-text-muted">
              Guided fix
            </p>
            <p className="mt-1 text-sm leading-relaxed text-pebble-text-secondary">
              Pebble will point to the failing line, explain the mistake, and apply the smallest
              safe edit so you can keep momentum.
            </p>
          </div>
        )}
    </section>
  )
}
