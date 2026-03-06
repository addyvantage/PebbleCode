import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Brain, CheckCircle2, Loader2 } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { buttonClass } from '../ui/buttonStyles'

interface JourneyData {
    currentPhase: string
    currentPhaseLabel: string
    nextPhase: string
    nextPhaseLabel: string
    journeyConfidence: number
    recommendedNextDifficulty: string
    autonomyScore: number
    streakImpact: number
}

const PHASE_ICONS: Record<string, string> = {
    START_SESSION: '🚀',
    WARM_UP: '🔥',
    PRACTICE_BLOCK: '🎯',
    CHALLENGE_PROBLEM: '⚔️',
    RECOVERY_PHASE: '💡',
    REFLECTION: '🪞',
    COMPLETE: '✅',
}

const DIFFICULTY_TO_QUERY: Record<string, string> = {
    Easy: 'easy',
    Medium: 'medium',
    Hard: 'hard',
}

export function JourneyCard({ className }: { className?: string }) {
    const [journey, setJourney] = useState<JourneyData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        fetch('/api/journey/current', { headers: { 'x-user-id': 'anonymous' } })
            .then(r => r.json())
            .then(d => {
                if (mounted && d.ok && d.data) setJourney(d.data as JourneyData)
            })
            .catch(e => console.error('[journey]', e))
            .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
    }, [])

    const resumeLink = journey
        ? `/session?difficulty=${DIFFICULTY_TO_QUERY[journey.recommendedNextDifficulty] ?? 'medium'}`
        : '/session'

    return (
        <Card
            className={`relative overflow-hidden p-3 ${className ?? ''}`}
            interactive
        >
            {/* Accent glow */}
            <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-2.5">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400 shrink-0">
                            <Brain className="h-4 w-4" />
                        </div>
                        <p className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-pebble-text-secondary">
                            Your Learning Journey
                        </p>
                    </div>
                    {journey && (
                        <Badge variant="neutral" className="text-[11px]">
                            {PHASE_ICONS[journey.currentPhase] ?? '📍'} {journey.currentPhaseLabel}
                        </Badge>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center gap-2 text-pebble-text-muted text-[13px]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading journey...
                    </div>
                ) : journey ? (
                    <>
                        {/* Confidence bar */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11.5px] text-pebble-text-muted">
                                <span>Confidence</span>
                                <span className="font-semibold text-pebble-text-secondary">{journey.journeyConfidence}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-pebble-overlay/[0.12]">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400 transition-all duration-700"
                                    style={{ width: `${journey.journeyConfidence}%` }}
                                />
                            </div>
                        </div>

                        {/* Next Step row */}
                        <div className="flex items-start gap-2">
                            <BookOpen className="h-3.5 w-3.5 shrink-0 text-pebble-text-muted mt-0.5" />
                            <p className="text-[12.5px] text-pebble-text-secondary leading-snug">
                                Next:{' '}
                                <span className="font-medium text-pebble-text-primary">
                                    {journey.nextPhaseLabel}
                                </span>{' '}
                                · Recommended difficulty:{' '}
                                <span className="font-medium text-pebble-accent">{journey.recommendedNextDifficulty}</span>
                            </p>
                        </div>

                        {/* CTA */}
                        <Link
                            to={resumeLink}
                            className={`${buttonClass('primary')} w-fit px-3 py-1.5 text-[13px] flex items-center gap-1.5`}
                        >
                            Resume Journey
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </>
                ) : (
                    <div className="flex items-center gap-2 text-pebble-text-muted text-[13px]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-pebble-accent" />
                        Start your first session to begin your journey.
                    </div>
                )}
            </div>
        </Card>
    )
}
