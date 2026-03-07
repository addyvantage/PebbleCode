import { ArrowLeft, Compass, Play, Sparkles, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { PageContainer } from '../components/ui/PageContainer'
import { HelpHero } from '../components/help/HelpHero'
import { HowToStepCard } from '../components/help/HowToStepCard'
import { getHowToUseNotes, getHowToUseQuickPath, getHowToUseSteps } from '../data/helpContent'
import { useI18n } from '../i18n/useI18n'
import { getProductCopy } from '../i18n/productCopy'

export function HowToUsePage() {
  const { lang } = useI18n()
  const copy = getProductCopy(lang).help?.howTo
  const steps = getHowToUseSteps(lang)
  const quickPath = getHowToUseQuickPath(lang)
  const notes = getHowToUseNotes(lang)

  return (
    <section className="page-enter pb-8 pt-3 md:pb-12">
      <PageContainer>
        <div className="mx-auto max-w-[1240px] space-y-4">
          <HelpHero
            badge={copy.badge}
            note={copy.note}
            title={copy.title}
            description={copy.description}
            actions={[
              { label: copy.homeCta ?? 'Start with Home', to: '/', variant: 'primary', icon: Play },
              { label: copy.faqCta ?? 'Read FAQ', to: '/faq', variant: 'secondary', icon: Compass },
            ]}
            chips={copy.chips}
          />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-5">
            <div className="space-y-4">
              <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.quickTour}</p>
                    <h2 className="text-[1.18rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">{copy.quickTourTitle}</h2>
                  </div>
                  <span className="help-chip-accent inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]">{copy.quickTourChip}</span>
                </div>
                <div className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-1">
                  {quickPath.map((step, index) => (
                    <div key={step.title} className="help-note rounded-[20px] px-3.5 py-3">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-pebble-accent">{copy.quickMoveLabel ?? 'Quick move'} {index + 1}</p>
                      <p className="mt-1 text-[14px] font-semibold text-pebble-text-primary">{step.title}</p>
                      <p className="mt-1 text-[12.5px] leading-[1.65] text-pebble-text-secondary">{step.detail}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="space-y-3.5">
                {steps.map((step) => (
                  <HowToStepCard key={step.id} step={step} />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-start gap-3.5">
                  <span className="help-chip-accent inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                    <Workflow className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div className="space-y-1.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.suggestedRun}</p>
                    <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">{copy.suggestedRunTitle}</h2>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5 text-[13px] leading-[1.68] text-pebble-text-secondary">
                  {copy.suggestedRunItems.map((item: string) => (
                    <div key={item} className="help-note rounded-[18px] px-3 py-2.5">{item}</div>
                  ))}
                </div>
              </Card>

              <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-start gap-3.5">
                  <span className="help-chip-accent inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                    <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div className="space-y-1.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.prototypeNotes}</p>
                    <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">{copy.prototypeNotesTitle}</h2>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5">
                  {notes.map((note) => (
                    <div key={note} className="help-note rounded-[18px] px-3 py-2.5 text-[12.75px] leading-[1.65] text-pebble-text-secondary">{note}</div>
                  ))}
                </div>
              </Card>

              <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
                <Link to="/" className="inline-flex items-center gap-2 text-[13px] font-medium text-pebble-text-secondary transition-colors hover:text-pebble-accent">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  {copy.backToHome}
                </Link>
                <p className="mt-3 text-[13px] leading-[1.68] text-pebble-text-secondary">
                  {copy.backBody.split('About PebbleCode')[0]}
                  <Link to="/about" className="font-medium text-pebble-accent hover:text-pebble-text-primary">About PebbleCode</Link>
                  {copy.backBody.includes('FAQ') ? (
                    <>
                      {copy.backBody.split('About PebbleCode')[1]?.split('FAQ')[0] ?? ' '}
                      <Link to="/faq" className="font-medium text-pebble-accent hover:text-pebble-text-primary">FAQ</Link>
                      {copy.backBody.split('FAQ')[1] ?? ''}
                    </>
                  ) : null}
                </p>
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  )
}
