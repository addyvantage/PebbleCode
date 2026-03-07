import { ArrowLeft, Compass, Play, Sparkles, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { PageContainer } from '../components/ui/PageContainer'
import { HelpHero } from '../components/help/HelpHero'
import { HowToStepCard } from '../components/help/HowToStepCard'
import { HOW_TO_USE_NOTES, HOW_TO_USE_QUICK_PATH, HOW_TO_USE_STEPS } from '../data/helpContent'

export function HowToUsePage() {
  return (
    <section className="page-enter pb-8 pt-3 md:pb-12">
      <PageContainer>
        <div className="mx-auto max-w-[1240px] space-y-4">
          <HelpHero
            badge="How to Use"
            note="Built from current app flow"
            title="The fastest way to understand PebbleCode end to end"
            description="This is a product tour of the app as it exists now. Follow it if you are evaluating PebbleCode for the first time, or if you want the shortest path from landing page to the core recovery-loop demo."
            actions={[
              { label: 'Start with Home', to: '/', variant: 'primary', icon: Play },
              { label: 'Read FAQ', to: '/faq', variant: 'secondary', icon: Compass },
            ]}
            chips={['Home', 'Problems', 'Session', 'Insights', 'Community']}
          />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-5">
            <div className="space-y-4">
              <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Judge quick tour</p>
                    <h2 className="text-[1.18rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">
                      Best demo flow in under 3 minutes
                    </h2>
                  </div>
                  <span className="help-chip-accent inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]">
                    High signal
                  </span>
                </div>
                <div className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-1">
                  {HOW_TO_USE_QUICK_PATH.map((step, index) => (
                    <div key={step.title} className="help-note rounded-[20px] px-3.5 py-3">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-pebble-accent">Quick move {index + 1}</p>
                      <p className="mt-1 text-[14px] font-semibold text-pebble-text-primary">{step.title}</p>
                      <p className="mt-1 text-[12.5px] leading-[1.65] text-pebble-text-secondary">{step.detail}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="space-y-3.5">
                {HOW_TO_USE_STEPS.map((step) => (
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
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Suggested first run</p>
                    <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">
                      The cleanest live demo sequence
                    </h2>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5 text-[13px] leading-[1.68] text-pebble-text-secondary">
                  <div className="help-note rounded-[18px] px-3 py-2.5">Open <span className="font-medium text-pebble-text-primary">Two Sum</span> or another problem with a simple visible fail case.</div>
                  <div className="help-note rounded-[18px] px-3 py-2.5">Run an imperfect solution first so the testcase diagnostics and Pebble Coach have something concrete to react to.</div>
                  <div className="help-note rounded-[18px] px-3 py-2.5">Use the coach rail to show hint → explain → next step, then rerun.</div>
                  <div className="help-note rounded-[18px] px-3 py-2.5">Finish on Insights or Community so the demo ends with product breadth, not just one accepted answer.</div>
                </div>
              </Card>

              <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-start gap-3.5">
                  <span className="help-chip-accent inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                    <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div className="space-y-1.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Prototype notes</p>
                    <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">
                      What is interactive vs seeded
                    </h2>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5">
                  {HOW_TO_USE_NOTES.map((note) => (
                    <div key={note} className="help-note rounded-[18px] px-3 py-2.5 text-[12.75px] leading-[1.65] text-pebble-text-secondary">
                      {note}
                    </div>
                  ))}
                </div>
              </Card>

              <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-[13px] font-medium text-pebble-text-secondary transition-colors hover:text-pebble-accent"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to home
                </Link>
                <p className="mt-3 text-[13px] leading-[1.68] text-pebble-text-secondary">
                  If you want the judge-facing product narrative first, open <Link to="/about" className="font-medium text-pebble-accent hover:text-pebble-text-primary">About PebbleCode</Link>. If you need sharper question-and-answer framing, open <Link to="/faq" className="font-medium text-pebble-accent hover:text-pebble-text-primary">FAQ</Link>.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  )
}
