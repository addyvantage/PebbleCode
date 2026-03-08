import {
  ArrowRight,
  Brain,
  Compass,
  Globe,
  MessageSquareText,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { HelpHero } from '../components/help/HelpHero'
import { Card } from '../components/ui/Card'
import { PageContainer } from '../components/ui/PageContainer'
import { useI18n } from '../i18n/useI18n'
import { getProductCopy } from '../i18n/productCopy'

const ABOUT_ICONS = {
  Recovery: Sparkles,
  Multilingual: Globe,
  Community: MessageSquareText,
  Learners: Brain,
}

export function AboutPage() {
  const { lang } = useI18n()
  const copy = getProductCopy(lang).help?.about

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
              { label: copy.howToCta, to: '/how-to-use', variant: 'primary', icon: Compass },
              { label: copy.faqCta, to: '/faq', variant: 'secondary', icon: Sparkles },
            ]}
            chips={copy.chips}
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:gap-5">
            <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.whyTitle}</p>
              <h2 className="mt-2 text-[1.28rem] font-semibold tracking-[-0.03em] text-pebble-text-primary">{copy.whyHeadline}</h2>
              <div className="mt-4 space-y-3 text-[13.5px] leading-[1.76] text-pebble-text-secondary">
                <p>{copy.whyBody1}</p>
                <p>{copy.whyBody2}</p>
                <div className="help-note rounded-[20px] px-3.5 py-3">{copy.whyCallout}</div>
              </div>
            </Card>

            <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex items-start gap-3.5">
                <span className="help-chip-accent inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                  <Brain className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div className="space-y-1.5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.builtFor}</p>
                  <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">{copy.builtForTitle}</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-2.5 text-[13px] leading-[1.68] text-pebble-text-secondary">
                {copy.builtForItems.map((item: string) => (
                  <div key={item} className="help-note rounded-[18px] px-3 py-2.5">{item}</div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
            {copy.diffs.map((item: any) => {
              const Icon = ABOUT_ICONS[item.label.split(' ')[0] as keyof typeof ABOUT_ICONS] ?? Sparkles
              return (
                <Card key={item.title} padding="sm" interactive className="help-section-shell rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
                  <span className="help-chip-accent inline-flex h-11 w-11 items-center justify-center rounded-2xl">
                    <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{item.label}</p>
                  <h3 className="mt-2 text-[1.05rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">{item.title}</h3>
                  <p className="mt-3 text-[13.25px] leading-[1.72] text-pebble-text-secondary">{item.body}</p>
                </Card>
              )
            })}
          </div>

          <Card padding="sm" interactive className="help-section-shell rounded-[30px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1.5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.flowLabel}</p>
                <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-pebble-text-primary">{copy.flowTitle}</h2>
              </div>
              <span className="help-chip-accent inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]">{copy.flowChip}</span>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-5">
              {copy.flowSteps.map((step: string, index: number) => (
                <div key={step} className="relative">
                  <div className="help-note rounded-[20px] px-3.5 py-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-pebble-accent">{index + 1}</p>
                    <p className="mt-1.5 text-[12.75px] leading-[1.68] text-pebble-text-secondary">{step}</p>
                  </div>
                  {index < copy.flowSteps.length - 1 ? (
                    <ArrowRight className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-pebble-accent/55 lg:block" aria-hidden="true" />
                  ) : null}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] xl:gap-5">
            <Card padding="sm" interactive className="help-section-shell rounded-[30px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
              <div className="flex items-start gap-3.5">
                <span className="help-chip-accent inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                  <Globe className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div className="space-y-1.5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.multiLabel}</p>
                  <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-pebble-text-primary">{copy.multiTitle}</h2>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-[13.5px] leading-[1.76] text-pebble-text-secondary">
                <p>{copy.multiBody1}</p>
                <p>{copy.multiBody2}</p>
                <div className="help-note rounded-[20px] px-3.5 py-3">{copy.multiCallout}</div>
              </div>
            </Card>

            <Card padding="sm" interactive className="help-section-shell rounded-[30px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
              <div className="space-y-1.5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.impactLabel}</p>
                <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-pebble-text-primary">{copy.closingTitle}</h2>
              </div>
              <div className="mt-4 grid gap-2.5 text-[13px] leading-[1.68] text-pebble-text-secondary">
                {copy.impactItems.map((item: string) => (
                  <div key={item} className="help-note rounded-[18px] px-3 py-2.5">{item}</div>
                ))}
              </div>
            </Card>
          </div>

          <Card padding="sm" interactive className="help-section-shell rounded-[30px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
            <div className="space-y-1.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.prototypeLabel}</p>
              <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-pebble-text-primary">{copy.prototypeTitle}</h2>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {copy.prototypeAreas.map((area: any) => (
                <div key={area.title} className="help-note rounded-[22px] px-4 py-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-pebble-accent">{area.label}</p>
                  <h3 className="mt-2 text-[1rem] font-semibold text-pebble-text-primary">{area.title}</h3>
                  <div className="mt-3 space-y-2 text-[12.75px] leading-[1.65] text-pebble-text-secondary">
                    {area.items.map((item: string) => (
                      <div key={item}>{item}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="sm" interactive className="help-section-shell rounded-[30px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
            <div className="space-y-1.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.stackLabel}</p>
              <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-pebble-text-primary">{copy.stackTitle}</h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {copy.stackItems.map((item: any) => (
                <div key={item.title} className="help-note rounded-[20px] px-4 py-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-pebble-accent">{item.label}</p>
                  <h3 className="mt-2 text-[1rem] font-semibold text-pebble-text-primary">{item.title}</h3>
                  <p className="mt-2 text-[12.9px] leading-[1.68] text-pebble-text-secondary">{item.body}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.closingLabel}</p>
            <h2 className="mt-2 text-[1.18rem] font-semibold tracking-[-0.03em] text-pebble-text-primary">{copy.closingTitle}</h2>
            <p className="mt-3 max-w-[70ch] text-[13.5px] leading-[1.76] text-pebble-text-secondary">{copy.closingBody}</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link to="/how-to-use" className="help-chip-accent inline-flex rounded-full px-3 py-1.5 text-[12px] font-semibold">{copy.closingCtas[0]}</Link>
              <Link to="/faq" className="help-chip-muted inline-flex rounded-full px-3 py-1.5 text-[12px] font-semibold">{copy.closingCtas[1]}</Link>
              <Link to="/session/1" className="help-chip-muted inline-flex rounded-full px-3 py-1.5 text-[12px] font-semibold">{copy.closingCtas[2]}</Link>
            </div>
          </Card>
        </div>
      </PageContainer>
    </section>
  )
}
