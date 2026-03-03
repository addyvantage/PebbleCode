import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Sparkles, RefreshCw, Layers } from 'lucide-react'
import { Card } from '../ui/Card'
import { buttonClass } from '../ui/buttonStyles'
import { useI18n } from '../../i18n/useI18n'
import { getRecentActivity } from '../../lib/recentStore'
import { getProblemById, PROBLEMS_BANK } from '../../data/problemsBank'
import { getLocalizedProblem } from '../../i18n/problemContent'
import { getRecommendedNext, loadSkippedProblems, saveSkippedProblems } from '../../lib/homeCacheStore'
import { isProblemSolved } from '../../lib/solvedStore'

function classNames(...values: Array<string | undefined>) {
    return values.filter(Boolean).join(' ')
}

export function NextUpCard() {
    const { t, lang, isRTL } = useI18n()
    const proseClass = isRTL ? 'rtlText' : ''

    const recent = getRecentActivity()
    const recentProblem = recent ? getProblemById(recent.problemId) : null
    const localizedRecent = recentProblem ? getLocalizedProblem(recentProblem, lang) : null

    const [recProblemId, setRecProblemId] = useState<string>('')

    useEffect(() => {
        const id = getRecommendedNext(PROBLEMS_BANK, recent?.problemId ?? null, isProblemSolved)
        setRecProblemId(id || '')
    }, [recent?.problemId])

    const handleShuffle = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!recProblemId) return
        const skipped = loadSkippedProblems()
        skipped.problemIds.push(recProblemId)
        saveSkippedProblems(skipped)
        const id = getRecommendedNext(PROBLEMS_BANK, recent?.problemId ?? null, isProblemSolved, true)
        setRecProblemId(id || '')
    }

    const recBase = PROBLEMS_BANK.find((p) => p.id === recProblemId)
    const localizedRec = recBase ? getLocalizedProblem(recBase, lang) : null

    const hasContinue = !!localizedRecent

    return (
        <Card className="flex flex-col p-4 lg:p-5 card-premium rounded-[24px]" interactive>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-pebble-border/20 bg-pebble-canvas/50">
                        <Layers className="h-4 w-4 text-pebble-accent" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className={`text-[14px] font-semibold text-pebble-text-primary ${proseClass}`}>
                            Next up
                        </h2>
                        <p className={`text-[12.5px] text-pebble-text-secondary ${proseClass}`}>
                            {hasContinue ? 'Resume your session or try something new' : 'Hand-picked for your level'}
                        </p>
                    </div>
                </div>
            </div>

            {hasContinue ? (
                <div className="flex flex-col gap-3 mt-1">
                    <div className="rounded-[16px] border border-pebble-border/20 bg-pebble-canvas/50 p-4 flex flex-col items-center text-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pebble-accent/15 text-pebble-accent shrink-0">
                            <Play className="h-4 w-4 ml-0.5" aria-hidden="true" />
                        </div>
                        <div>
                            <p className={`text-[12.5px] font-medium text-pebble-text-secondary ${proseClass}`}>
                                {t('home.continue.title')}
                            </p>
                            <p className={`text-[15px] font-semibold text-pebble-text-primary ${proseClass}`}>
                                {localizedRecent.title}
                            </p>
                        </div>
                        <Link to={`/session?problem=${localizedRecent.id}`} className={classNames(buttonClass('primary'), "w-full justify-center mt-2 py-2")}>
                            {t('home.continue.resume')}
                        </Link>
                    </div>
                    {localizedRec && (
                        <div className="flex items-center justify-between px-1 mt-2">
                            <span className={`text-[12.5px] text-pebble-text-secondary ${proseClass}`}>
                                Or try: <span className="text-pebble-text-primary font-medium">{localizedRec.title}</span>
                            </span>
                            <Link to={`/session/1?problem=${recProblemId}`} className="text-[12.5px] font-medium text-pebble-accent hover:text-pebble-text-primary transition-colors">
                                Start fresh →
                            </Link>
                        </div>
                    )}
                </div>
            ) : recBase && localizedRec ? (
                <div className="flex flex-col gap-3">
                    <div className="flex justify-end -mt-3 pr-1">
                        <button
                            onClick={handleShuffle}
                            className="text-pebble-text-muted hover:text-pebble-text-primary transition focus:outline-none"
                            title={t('home.recommended.ctaShuffle')}
                        >
                            <RefreshCw className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="rounded-[10px] border border-pebble-border/20 bg-pebble-canvas/50 p-3 flex flex-col items-center text-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pebble-accent/15 text-pebble-accent shrink-0">
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div>
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${recBase.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                    recBase.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                        'bg-red-500/10 text-red-600 dark:text-red-400'
                                    }`}>
                                    {recBase.difficulty}
                                </span>
                            </div>
                            <p className={`text-[16px] font-semibold text-pebble-text-primary ${proseClass}`}>
                                {localizedRec.title}
                            </p>
                        </div>
                        <p className={`text-[13px] text-pebble-text-secondary leading-relaxed line-clamp-2 ${proseClass}`}>
                            {localizedRec.statement.summary || t('problem.description')}
                        </p>
                        <Link to={`/session/1?problem=${recProblemId}`} className={classNames(buttonClass('primary'), "w-full justify-center mt-3")}>
                            {t('home.recommended.ctaStart')}
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-pebble-border/30 bg-pebble-overlay/[0.02] py-6 px-3 text-center">
                    <p className="text-[13px] text-pebble-text-secondary">{t('home.recommended.emptyQueue')}</p>
                    <Link to="/problems" className={classNames(buttonClass('secondary'), "mt-3")}>
                        {t('home.continue.openProblems')}
                    </Link>
                </div>
            )}
        </Card>
    )
}
