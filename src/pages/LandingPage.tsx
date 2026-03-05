import { Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { StatusPill } from '../components/ui/StatusPill'
import { Component as EtheralShadow } from '../components/ui/etheral-shadow'
import { buttonClass } from '../components/ui/buttonStyles'
import { InteractiveGradientButton } from '../components/ui/interactive-gradient-button'
import { useI18n } from '../i18n/useI18n'
import { useTheme } from '../hooks/useTheme'
import { getRecentActivity } from '../lib/recentStore'
import { getProblemById } from '../data/problemsBank'
import { getLocalizedProblem } from '../i18n/problemContent'
import { TodayPlanCard } from '../components/home/TodayPlanCard'
import { RecommendedNextCard } from '../components/home/RecommendedNextCard'
import { FeatureGrid } from '../components/home/FeatureGrid'
import { SiteFooter } from '../components/layout/SiteFooter'
import { FooterSeparator } from '../components/home/FooterSeparator'

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function LandingPage() {
  const { t, lang } = useI18n()
  const { theme } = useTheme()
  const isUrdu = lang === 'ur'

  const etherealColor = theme === 'dark'
    ? 'rgba(120, 170, 255, 0.22)'
    : 'rgba(59, 130, 246, 0.30)'
  const previewInnerOutlineClass = theme === 'dark'
    ? 'border-[rgba(167,179,208,0.52)]'
    : 'border-[rgba(129,144,174,0.56)]'
  const previewOuterCardClass = theme === 'dark'
    ? 'border-[rgba(193,209,236,0.38)] bg-[linear-gradient(155deg,rgba(34,45,71,0.97)_0%,rgba(24,33,56,0.985)_56%,rgba(17,25,44,0.99)_100%)] shadow-[0_28px_68px_rgba(1,6,18,0.58),inset_0_1px_0_rgba(228,238,255,0.08)]'
    : 'border-[rgba(144,164,200,0.66)] bg-[linear-gradient(152deg,rgba(236,243,255,0.985)_0%,rgba(228,238,252,0.992)_58%,rgba(219,231,248,0.995)_100%)] shadow-[0_24px_56px_rgba(66,90,134,0.22),inset_0_1px_0_rgba(255,255,255,0.92)]'
  const previewCodePanelClass = theme === 'dark'
    ? 'bg-[linear-gradient(160deg,rgba(47,58,88,0.95)_0%,rgba(39,49,77,0.98)_100%)] shadow-[inset_0_1px_0_rgba(228,239,255,0.06)]'
    : 'bg-[linear-gradient(160deg,rgba(223,233,248,0.95)_0%,rgba(213,226,245,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]'
  const previewCoachPanelClass = theme === 'dark'
    ? 'bg-[linear-gradient(165deg,rgba(62,74,104,0.86)_0%,rgba(48,59,88,0.94)_100%)] shadow-[inset_0_1px_0_rgba(225,236,255,0.08)]'
    : 'bg-[linear-gradient(165deg,rgba(227,236,250,0.92)_0%,rgba(218,230,247,0.96)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]'
  const sideCardSurfaceClass = theme === 'dark'
    ? 'bg-pebble-overlay/[0.04]'
    : 'bg-[rgba(231,237,249,0.94)] border-pebble-border/28 shadow-[0_14px_34px_rgba(55,72,110,0.14)]'

  const recent = getRecentActivity()
  const recentProblem = recent ? getProblemById(recent.problemId) : null
  const localizedRecent = recentProblem ? getLocalizedProblem(recentProblem, lang) : null

  const trustChips = [t('landing.trust1'), t('landing.trust2'), t('landing.trust3')]
  const ctaBaseClass = 'inline-flex h-[44px] items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out'
  const openSessionCtaClass = `${ctaBaseClass} font-semibold border border-[#B9C8E8] bg-[#F5F8FF] text-[#1B2A4A] shadow-[0_1px_0_rgba(255,255,255,0.92)_inset,0_10px_24px_rgba(15,23,42,0.08)] hover:-translate-y-[1px] hover:bg-[#F9FBFF] hover:border-[#9FB6E6] hover:text-[#13223F] hover:shadow-[0_1px_0_rgba(255,255,255,0.96)_inset,0_12px_26px_rgba(15,23,42,0.10)] dark:bg-[#0B1220] dark:border-[#2E4A7A] dark:text-[#EAF0FF] dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_10px_28px_rgba(0,0,0,0.45)] dark:hover:-translate-y-[1px] dark:hover:bg-[#0F182B] dark:hover:border-[#4167A4] dark:hover:text-[#F3F7FF] dark:hover:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_12px_30px_rgba(0,0,0,0.52)] transition-[background-color,border-color,box-shadow,color,transform] duration-150 ease-out focus-visible:ring-[#4F8BFF]/45 dark:focus-visible:ring-[#8DB6FF]/55 focus-visible:ring-offset-[#F5F8FF] dark:focus-visible:ring-offset-[#0B1220]`

  return (
    <section className="page-enter min-h-0">
      <div className="flex min-h-0 flex-col gap-4">
        <Card className="relative w-full overflow-hidden rounded-none px-3 py-3 md:px-4 md:py-4 lg:px-6 lg:py-6 xl:px-8 xl:py-7" interactive>
          <div className="pointer-events-none absolute inset-0 z-0">
            <EtheralShadow
              className="absolute inset-0"
              color={etherealColor}
              animation={{ scale: 62, speed: 78 }}
              noise={theme === 'dark'
                ? { opacity: 0.28, scale: 1.35 }
                : { opacity: 0.10, scale: 1.15 }}
              sizing="fill"
              showTitle={false}
            />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[1280px] px-1 sm:px-2 lg:px-3">
            <div className="grid h-full min-h-0 grid-cols-1 gap-y-7 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0 xl:gap-x-12">
              <div className="col-span-1 flex min-h-0 min-w-0 flex-col justify-start gap-5 lg:col-span-8 lg:pr-4 xl:col-span-7 xl:gap-6">
                <Badge className="w-fit">{t('landing.badge')}</Badge>

                <div>
                  <h1
                    className={`max-w-none text-balance text-3xl font-semibold tracking-tight leading-[1.16] md:text-4xl lg:text-[2.75rem] xl:text-[3.05rem] ${isUrdu ? 'rtlText' : ''}`}
                  >
                    <span className={`font-bold ${theme === 'dark' ? 'text-pebble-text-primary' : 'text-pebble-accent'}`}>
                      {lang === 'en' ? (
                        <>
                          Elite coding practice with real runtime feedback
                          <span className="hidden lg:inline"><br /></span>
                          <span className="lg:ml-1">and mentor-level guidance.</span>
                        </>
                      ) : (
                        t('landing.headline')
                      )}
                    </span>
                  </h1>
                </div>
                <p className={`max-w-[70ch] text-[13.5px] leading-relaxed text-pebble-text-secondary sm:text-[14.5px] ${isUrdu ? 'rtlText' : ''}`}>
                  {t('landing.subheadline')}
                </p>

                <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
                  <InteractiveGradientButton asChild className={ctaBaseClass}>
                    <Link to="/onboarding">
                      {t('landing.tryPebble')}
                    </Link>
                  </InteractiveGradientButton>
                  <Link to="/session/1" className={openSessionCtaClass}>
                    {t('landing.openSession')}
                  </Link>
                </div>

                <div className="flex flex-wrap justify-start gap-2 pt-2">
                  {trustChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-pebble-border/35 bg-pebble-overlay/[0.08] px-2.5 py-0.5 text-[11.5px] font-medium text-pebble-text-secondary"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="col-span-1 flex min-h-0 min-w-0 items-center lg:col-span-4 lg:justify-end lg:translate-x-14 xl:col-span-5 xl:translate-x-16">
                <div className={`w-full max-w-[620px] rounded-[14px] border p-2.5 lg:p-3 ${previewOuterCardClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[13px] font-semibold uppercase tracking-[0.08em] text-pebble-text-secondary ${isUrdu ? 'rtlText' : ''}`}>
                      {t('landing.previewLabel')}
                    </p>
                    <span className="rounded-full border border-pebble-border/48 bg-pebble-overlay/[0.14] px-2 py-0.5 text-[10.5px] uppercase tracking-[0.06em] text-pebble-text-primary">
                      {t('landing.previewUsingRun')}
                    </span>
                  </div>

                  <div className="mt-1.5 space-y-1.5">
                    <div className={`rounded-[10px] border ${previewInnerOutlineClass} p-2 ${previewCodePanelClass}`}>
                      <div className="mb-1.5 flex items-center justify-between text-[13px] text-pebble-text-primary">
                        <span>{t('landing.previewUnit')}</span>
                        <span>{t('landing.previewTests')}</span>
                      </div>
                      <pre dir="ltr" className={`ltrSafe overflow-hidden rounded-[6px] border ${previewInnerOutlineClass} bg-pebble-canvas/95 p-1.5 font-mono text-[13px] leading-snug text-pebble-text-primary`}>{`def two_sum(nums, target):\n    seen = {}\n    # TODO\n    return -1, -1`}</pre>
                      <StatusPill variant="fail" showIcon className="mt-1.5 max-w-full whitespace-normal break-words leading-tight">
                        {t('landing.previewFail')}
                      </StatusPill>
                    </div>

                    <div className={`rounded-[10px] border ${previewInnerOutlineClass} p-2 ${previewCoachPanelClass}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-pebble-accent/28 text-[11px] font-semibold text-pebble-text-primary">
                          P
                        </span>
                        <p className={`text-[13px] font-semibold text-pebble-text-primary ${isUrdu ? 'rtlText' : ''}`}>
                          {t('landing.previewCoach')}
                        </p>
                      </div>
                      <p className={`mt-1 text-[13.5px] leading-relaxed text-pebble-text-secondary line-clamp-2 ${isUrdu ? 'rtlText' : ''}`}>
                        {t('landing.previewCoachHint')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="-mt-2 grid grid-cols-1 gap-4 lg:grid-cols-[1.12fr_0.88fr] lg:gap-4">
          <TodayPlanCard />
          <div className="flex flex-col gap-4">
            <Card className={`relative overflow-hidden p-3 flex flex-col justify-center ${sideCardSurfaceClass}`} interactive>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pebble-accent/15 text-pebble-accent shrink-0">
                    <Play className="h-4 w-4" aria-hidden="true" />
                  </div>
                  {localizedRecent ? (
                    <div className="space-y-0.5 min-w-0">
                      <p className={`text-[12.5px] font-semibold text-pebble-text-secondary ${isUrdu ? 'rtlText' : ''}`}>
                        {t('home.continue.title')}
                      </p>
                      <p className={`text-[14.5px] font-medium text-pebble-text-primary truncate ${isUrdu ? 'rtlText' : ''}`}>
                        {localizedRecent.title}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0.5 min-w-0">
                      <p className={`text-[12.5px] font-semibold text-pebble-text-secondary ${isUrdu ? 'rtlText' : ''}`}>
                        {t('home.continue.title')}
                      </p>
                      <p className={`text-[14px] text-pebble-text-primary ${isUrdu ? 'rtlText' : ''}`}>
                        {t('home.continue.empty.title')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0">
                  {localizedRecent ? (
                    <Link to={`/session?problem=${localizedRecent.id}`} className={classNames(buttonClass('primary'), "px-3 py-1.5 text-[13px]")}>
                      {t('home.continue.resume')}
                    </Link>
                  ) : (
                    <Link to="/problems" className={classNames(buttonClass('primary'), "px-3 py-1.5 text-[13px]")}>
                      {t('home.continue.empty.cta')}
                    </Link>
                  )}
                </div>
              </div>
            </Card>
            <RecommendedNextCard className={`flex-1 ${sideCardSurfaceClass}`} />
          </div>
        </div>

        <FeatureGrid />

        <FooterSeparator />
        <SiteFooter />
      </div>
    </section>
  )
}
