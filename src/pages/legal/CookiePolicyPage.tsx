import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { PageContainer } from '../../components/ui/PageContainer'

export function CookiePolicyPage() {
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
                Cookie Policy
              </h1>
              <p className="text-sm text-pebble-text-muted">Last updated: March 5, 2026</p>
            </header>

            <div className="mt-8 space-y-7 text-[15px] leading-7 text-pebble-text-secondary">
              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-pebble-text-primary">What Cookies We Use</h2>
                <p>
                  Pebble uses essential session storage and preference cookies for auth, language, and UX continuity.
                  Replace this placeholder content with your approved policy text.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-pebble-text-primary">Analytics Cookies</h2>
                <p>
                  Analytics tools may collect engagement and performance signals to improve product quality. Add
                  provider-specific details and retention controls here.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-pebble-text-primary">Managing Preferences</h2>
                <p>
                  Users can manage browser cookie settings and in-product preferences. Include cookie opt-out and
                  consent withdrawal instructions in this section.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-pebble-text-primary">Contact</h2>
                <p>
                  Add your legal contact email or support channel for cookie/privacy inquiries.
                </p>
              </section>
            </div>
          </Card>
        </div>
      </PageContainer>
    </section>
  )
}

