import { ArrowLeft, Bot, Compass, FileCheck2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { PageContainer } from '../components/ui/PageContainer'
import { HelpHero } from '../components/help/HelpHero'
import { FaqAccordionGroup } from '../components/help/FaqAccordionGroup'
import { FAQ_GROUPS } from '../data/helpContent'

export function FaqPage() {
  return (
    <section className="page-enter pb-8 pt-3 md:pb-12">
      <PageContainer>
        <div className="mx-auto max-w-[1240px] space-y-4">
          <HelpHero
            badge="FAQ"
            note="Judge-friendly product context"
            title="Fast answers about what PebbleCode actually does"
            description="This page explains the real product shape of PebbleCode as it exists in the repo today: what is interactive, what is seeded for demo value, and why the product is organized around recovery instead of raw acceptance alone."
            actions={[
              { label: 'How to use', to: '/how-to-use', variant: 'primary', icon: Compass },
              { label: 'Open Session', to: '/session/1', variant: 'secondary', icon: Bot },
            ]}
            chips={['Recovery-first practice', 'Grounded mentor help', 'Seeded community layer', 'Prototype with real flows']}
          />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-5">
            <div className="space-y-4">
              {FAQ_GROUPS.map((group, index) => (
                <FaqAccordionGroup key={group.id} group={group} defaultOpenIndex={index === 0 ? 0 : -1} />
              ))}
            </div>

            <div className="space-y-4">
              <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-start gap-3.5">
                  <span className="help-chip-accent inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                    <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div className="space-y-1.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Best demo signal</p>
                    <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">
                      What judges should notice first
                    </h2>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5 text-[13.2px] leading-[1.68] text-pebble-text-secondary">
                  <div className="help-note rounded-[20px] px-3.5 py-3">
                    Pebble is strongest when a user fails a run, opens Coach, applies the explanation, reruns, and then sees that recovery reflected in Insights.
                  </div>
                  <div className="help-note rounded-[20px] px-3.5 py-3">
                    Community is intentionally seeded, but it proves the product can evolve from solo AI guidance into collaborative peer learning.
                  </div>
                </div>
              </Card>

              <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-start gap-3.5">
                  <span className="help-chip-accent inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                    <FileCheck2 className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div className="space-y-1.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Prototype note</p>
                    <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">
                      What is real today
                    </h2>
                  </div>
                </div>
                <ul className="mt-4 space-y-2.5 text-[13px] leading-[1.7] text-pebble-text-secondary">
                  <li className="help-note rounded-[18px] px-3 py-2.5">Problems, Session, Coach, auth flows, placement, notifications, settings, and local-first insights are real interactive surfaces.</li>
                  <li className="help-note rounded-[18px] px-3 py-2.5">Weekly recap and cloud-backed analytics exist, but some deeper backend paths depend on environment configuration.</li>
                  <li className="help-note rounded-[18px] px-3 py-2.5">Community uses seeded content by design so the product direction is visible without claiming live user traffic.</li>
                </ul>
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
                  If you want the full product story first, open <Link to="/about" className="font-medium text-pebble-accent hover:text-pebble-text-primary">About PebbleCode</Link>. If you want the guided walkthrough, open <Link to="/how-to-use" className="font-medium text-pebble-accent hover:text-pebble-text-primary">How to Use</Link>.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  )
}
