import { Check, Flame } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'

type StreakPillProps = {
  streak: number
  isTodayComplete: boolean
  compact?: boolean
}

export function StreakPill({ streak, isTodayComplete, compact = false }: StreakPillProps) {
  const { t, isRTL } = useI18n()
  const [pulse, setPulse] = useState(false)
  const prevStreakRef = useRef(streak)

  useEffect(() => {
    if (streak > prevStreakRef.current) {
      setPulse(true)
      const timer = window.setTimeout(() => setPulse(false), 520)
      prevStreakRef.current = streak
      return () => window.clearTimeout(timer)
    }
    prevStreakRef.current = streak
    return () => {}
  }, [streak])

  return (
    <div
      className={`relative inline-flex h-9 items-center gap-2 rounded-xl border border-pebble-border/35 bg-pebble-overlay/[0.08] px-2.5 text-xs text-pebble-text-primary ${
        isRTL ? 'rtlText' : ''
      }`}
    >
      <span
        className={`relative inline-flex h-5 w-5 items-center justify-center rounded-full border border-pebble-warning/35 bg-pebble-warning/18 text-pebble-warning ${
          pulse ? 'animate-[streak-pop_520ms_ease-out]' : ''
        }`}
      >
        <Flame className="h-3.5 w-3.5" aria-hidden="true" />
        {pulse ? (
          <span className="pointer-events-none absolute inset-0 rounded-full border border-pebble-warning/35 animate-[streak-ring_520ms_ease-out]" />
        ) : null}
      </span>

      <span className="inline-flex items-center gap-1">
        {!compact ? <span className="text-pebble-text-secondary">{t('insights.streak.label')}</span> : null}
        <span className="ltrSafe font-semibold text-pebble-text-primary">{streak}</span>
      </span>

      {isTodayComplete ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-pebble-success/35 bg-pebble-success/12 px-1.5 py-0.5 text-[10px] text-pebble-success">
          <Check className="h-3 w-3" aria-hidden="true" />
          {!compact ? t('insights.streak.todayDone') : null}
        </span>
      ) : null}
    </div>
  )
}
