import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { PageContainer } from '../../components/ui/PageContainer'

export function PrivacyPolicyPage() {
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
                Privacy Policy
              </h1>
              <p className="text-sm text-pebble-text-muted">Last updated: March 5, 2026</p>
            </header>

            <div className="mt-8 space-y-7 text-[15px] leading-7 text-pebble-text-secondary">
              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-pebble-text-primary">Data We Collect</h2>
                <p>
                  Pebble may collect account details, session activity, run diagnostics, and learning analytics to
                  deliver guided coding workflows. This placeholder section should be replaced with your legal text.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-pebble-text-primary">How We Use Data</h2>
                <p>
                  We use data to personalize curriculum, improve mentoring quality, and maintain platform reliability.
                  This content is illustrative and should be finalized with legal review.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-pebble-text-primary">Sharing & Retention</h2>
                <p>
                  Pebble retains data for product operations and security. Any third-party sharing details, retention
                  windows, and regional requirements should be documented here.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-pebble-text-primary">Your Controls</h2>
                <p>
                  Users can update profile information, request data access, and manage consent preferences. Add
                  concrete account and support workflows in this section.
                </p>
              </section>
            </div>
          </Card>
        </div>
      </PageContainer>
    </section>
  )
}

