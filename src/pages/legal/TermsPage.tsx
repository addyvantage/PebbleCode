import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { PageContainer } from '../../components/ui/PageContainer'

export function TermsPage() {
  return (
    <section className="page-enter pb-8 pt-4 md:pb-12">
      <PageContainer>
        <div className="mx-auto max-w-4xl">
          <Card className="rounded-[24px] border-pebble-border/34 bg-pebble-panel/82 p-6 md:p-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-pebble-text-secondary transition-colors duration-300 hover:text-pebble-accent"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>

            <header className="mt-4 space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-pebble-text-primary md:text-4xl">
                Terms of Service
              </h1>
              <p className="text-sm text-pebble-text-muted">Last updated: March 5, 2026</p>
            </header>

            <div className="mt-8 space-y-7 text-[15px] leading-7 text-pebble-text-secondary">
              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-pebble-text-primary">Acceptance of Terms</h2>
                <p>
                  By using Pebble, users agree to the service terms, platform policies, and acceptable use rules. This
                  section is placeholder copy and should be replaced by approved legal language.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-pebble-text-primary">Accounts & Access</h2>
                <p>
                  Users are responsible for account security and activity under their credentials. Add detailed account
                  ownership and credential policy requirements here.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-pebble-text-primary">Platform Usage</h2>
                <p>
                  The service is intended for guided coding practice and analytics. Add prohibited conduct, moderation
                  rules, and automation policy specifics in this section.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-pebble-text-primary">Limitations</h2>
                <p>
                  Include warranty disclaimers, liability limits, and governing law statements based on your legal
                  jurisdiction.
                </p>
              </section>
            </div>
          </Card>
        </div>
      </PageContainer>
    </section>
  )
}

