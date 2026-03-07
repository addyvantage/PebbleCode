import { ArrowLeft, Bot, Compass, FileCheck2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { PageContainer } from '../components/ui/PageContainer'
import { HelpHero } from '../components/help/HelpHero'
import { FaqAccordionGroup } from '../components/help/FaqAccordionGroup'
import { getFaqGroups } from '../data/helpContent'
import { useI18n } from '../i18n/useI18n'
import { getProductCopy } from '../i18n/productCopy'

export function FaqPage() {
  const { lang } = useI18n()
  const copy = getProductCopy(lang).help?.faq
  const groups = getFaqGroups(lang)

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
              { label: copy.howToCta ?? 'How to use', to: '/how-to-use', variant: 'primary', icon: Compass },
              { label: copy.sessionCta ?? 'Open Session', to: '/session/1', variant: 'secondary', icon: Bot },
            ]}
            chips={copy.chips}
          />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-5">
            <div className="space-y-4">
              {groups.map((group, index) => (
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
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.bestSignal}</p>
                    <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">{copy.bestSignalTitle}</h2>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5 text-[13.2px] leading-[1.68] text-pebble-text-secondary">
                  {copy.bestSignalItems.map((item: string) => (
                    <div key={item} className="help-note rounded-[20px] px-3.5 py-3">{item}</div>
                  ))}
                </div>
              </Card>

              <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-start gap-3.5">
                  <span className="help-chip-accent inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                    <FileCheck2 className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div className="space-y-1.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.prototypeNote}</p>
                    <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">{copy.prototypeNoteTitle}</h2>
                  </div>
                </div>
                <ul className="mt-4 space-y-2.5 text-[13px] leading-[1.7] text-pebble-text-secondary">
                  {copy.prototypeNoteItems.map((item: string) => (
                    <li key={item} className="help-note rounded-[18px] px-3 py-2.5">{item}</li>
                  ))}
                </ul>
              </Card>

              <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-[13px] font-medium text-pebble-text-secondary transition-colors hover:text-pebble-accent"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  {copy.backToHome}
                </Link>
                <p className="mt-3 text-[13px] leading-[1.68] text-pebble-text-secondary">
                  {copy.backBody.split('About PebbleCode')[0]}
                  <Link to="/about" className="font-medium text-pebble-accent hover:text-pebble-text-primary">About PebbleCode</Link>
                  {copy.backBody.includes('How to Use') ? (
                    <>
                      {copy.backBody.split('About PebbleCode')[1]?.split('How to Use')[0] ?? ' '}
                      <Link to="/how-to-use" className="font-medium text-pebble-accent hover:text-pebble-text-primary">How to Use</Link>
                      {copy.backBody.split('How to Use')[1] ?? ''}
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
