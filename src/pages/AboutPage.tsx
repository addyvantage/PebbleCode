import {
  ArrowRight,
  Bot,
  Brain,
  Compass,
  FileCheck2,
  Globe,
  Layers3,
  LineChart,
  MessageSquareText,
  ServerCog,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { HelpHero } from '../components/help/HelpHero'
import { Card } from '../components/ui/Card'
import { PageContainer } from '../components/ui/PageContainer'

const differentiators = [
  {
    icon: Workflow,
    label: 'Recovery loop',
    title: 'Pebble treats failure as the main learning surface.',
    body:
      'The product is designed around run → diagnose → coach → recover → rerun. Testcases, mentor guidance, submissions, and reports all reinforce that loop.',
  },
  {
    icon: Bot,
    label: 'Grounded mentor',
    title: 'Coach responses stay attached to the active coding context.',
    body:
      'Pebble Coach is shaped by the current problem, code, testcase output, and help tier so the guidance stays specific instead of drifting into generic chat.',
  },
  {
    icon: LineChart,
    label: 'Reflection layer',
    title: 'Insights turn attempts into measurable learning signals.',
    body:
      'The dashboard and weekly recap frame momentum, recovery time, guidance reliance, and issue patterns so practice quality becomes visible over time.',
  },
  {
    icon: MessageSquareText,
    label: 'Peer layer',
    title: 'Community extends solo recovery into collaborative learning.',
    body:
      'The seeded forum prototype shows how failed runs, hint confusion, interview questions, and project collaboration can evolve into a shared learning ecosystem.',
  },
]

const flowSteps = [
  {
    label: '1. Start with intent',
    text: 'Use landing, onboarding, and placement to set level, language focus, and the right starting path.',
  },
  {
    label: '2. Pick the right problem',
    text: 'Browse curated problems with topic filters, solved state, and preview context before entering Session.',
  },
  {
    label: '3. Run into something real',
    text: 'Session is built so an imperfect run produces useful feedback, not just a dead-end red state.',
  },
  {
    label: '4. Recover deliberately',
    text: 'Pebble Coach explains the failure, offers the next grounded move, and keeps the user inside the workspace.',
  },
  {
    label: '5. Reflect and extend',
    text: 'Insights, recap, reports, and Community turn a single attempt into pattern awareness and shared learning.',
  },
]

const prototypeAreas = [
  {
    label: 'Interactive now',
    title: 'Core product loop is fully demoable today.',
    items: [
      'Landing, onboarding, and placement flows',
      'Problems browser with filters, solved state, and preview',
      'Session IDE with run, submit, testcases, solutions, submissions, timer, and report export',
      'Pebble Coach, auth, profile, settings, and notifications',
      'Insights dashboard and weekly recap surface',
    ],
  },
  {
    label: 'Seeded for product storytelling',
    title: 'Frontend-first surfaces that prove the broader vision.',
    items: [
      'Community groups, posts, and replies are seeded intentionally for demo clarity',
      'Thread detail supports local reply behavior to show participation flow',
      'Some recommendation and showcase content is curated to keep the prototype coherent',
    ],
  },
  {
    label: 'Configuration dependent',
    title: 'Cloud-backed paths that become stronger when AWS services are wired.',
    items: [
      'Cognito-backed auth and verification',
      'S3-backed avatars and report assets',
      'API Gateway + Lambda backend routes',
      'Optional Bedrock-backed mentor and recap paths',
      'Analytics and observability extensions that go beyond the local-first prototype loop',
    ],
  },
]

const architecture = [
  {
    label: 'Frontend experience',
    title: 'Vite + React + TypeScript + Tailwind',
    body:
      'The frontend is a premium multi-surface product shell with route-based flows for Home, Problems, Session, Insights, Community, auth, profile, and help pages.',
  },
  {
    label: 'Execution and APIs',
    title: 'Local runner + serverless-compatible API model',
    body:
      'The repo supports real run/submit flows, language-aware execution, testcase diagnostics, report generation, and a split between local dev services and deployed API routes.',
  },
  {
    label: 'Identity and storage',
    title: 'Cognito, DynamoDB, S3, and local-first persistence',
    body:
      'User auth, profile flows, username claims, avatars, solved state, notifications, and learning signals are designed to persist cleanly while still degrading safely in prototype mode.',
  },
  {
    label: 'Cloud and AI layer',
    title: 'AWS CDK deployment path with optional Bedrock-backed guidance',
    body:
      'The infrastructure layer points to CloudFront/S3 or Amplify frontend hosting, API Gateway + Lambda backend services, Cognito auth, DynamoDB storage, and optional Bedrock-backed mentor/recap orchestration.',
  },
]

export function AboutPage() {
  return (
    <section className="page-enter pb-8 pt-3 md:pb-12">
      <PageContainer>
        <div className="mx-auto max-w-[1240px] space-y-4">
          <HelpHero
            badge="About PebbleCode"
            note="Built from the live prototype"
            title="A recovery-first coding mentor built for real student learning"
            description="PebbleCode is a premium coding practice product designed around what happens after a learner gets stuck. The prototype combines a real coding workspace, grounded AI guidance, reflection surfaces, multilingual accessibility, and a seeded peer-learning layer to show how coding practice can become more human, more measurable, and more useful."
            actions={[
              { label: 'How to Use', to: '/how-to-use', variant: 'primary', icon: Compass },
              { label: 'Read FAQ', to: '/faq', variant: 'secondary', icon: Sparkles },
            ]}
            chips={['Recovery-first learning', 'Multilingual guidance', 'Insights and recap', 'Community layer']}
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:gap-5">
            <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Why PebbleCode exists</p>
              <h2 className="mt-2 text-[1.28rem] font-semibold tracking-[-0.03em] text-pebble-text-primary">
                Most coding tools evaluate answers well, but they do not teach recovery well.
              </h2>
              <div className="mt-4 space-y-3 text-[13.5px] leading-[1.76] text-pebble-text-secondary">
                <p>
                  Students are usually told whether a run passed or failed, but not given a structured way to recover, understand the failure, and build confidence from that moment.
                </p>
                <p>
                  PebbleCode is built around that missing layer. The product treats wrong runs, confusing hints, repeated mistakes, and confidence dips as first-class signals rather than incidental friction.
                </p>
                <div className="help-note rounded-[20px] px-3.5 py-3">
                  The core idea is simple: coding practice should help a learner diagnose, recover, reflect, and improve, not just chase an accepted badge.
                </div>
              </div>
            </Card>

            <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex items-start gap-3.5">
                <span className="help-chip-accent inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                  <Brain className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div className="space-y-1.5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Built for</p>
                  <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">
                    Learners who need clarity, not just correctness
                  </h2>
                </div>
              </div>
              <div className="mt-4 grid gap-2.5 text-[13px] leading-[1.68] text-pebble-text-secondary">
                <div className="help-note rounded-[18px] px-3 py-2.5">Students practicing DSA, SQL, and interview-style reasoning</div>
                <div className="help-note rounded-[18px] px-3 py-2.5">Placement-focused learners who need a guided starting point</div>
                <div className="help-note rounded-[18px] px-3 py-2.5">Multilingual users who understand coding concepts better in a familiar language</div>
                <div className="help-note rounded-[18px] px-3 py-2.5">Anyone who wants AI help, reflection, and peer learning in one workflow</div>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
            {differentiators.map((item) => {
              const Icon = item.icon
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
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">How the product works</p>
                <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-pebble-text-primary">
                  A practice loop built around recovery, not only acceptance
                </h2>
              </div>
              <span className="help-chip-accent inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]">
                Home → Problems → Session → Insights → Community
              </span>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-5">
              {flowSteps.map((step, index) => (
                <div key={step.label} className="relative">
                  <div className="help-note rounded-[20px] px-3.5 py-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-pebble-accent">{step.label}</p>
                    <p className="mt-1.5 text-[12.75px] leading-[1.68] text-pebble-text-secondary">{step.text}</p>
                  </div>
                  {index < flowSteps.length - 1 ? (
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
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Multilingual vision</p>
                  <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-pebble-text-primary">
                    Accessibility is not only about interface chrome. It is about how understanding happens.
                  </h2>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-[13.5px] leading-[1.76] text-pebble-text-secondary">
                <p>
                  PebbleCode’s multilingual direction matters because many students can write code in English syntax but still understand explanations, edge cases, and reasoning better in a familiar language. That gap is real in placement prep and peer learning.
                </p>
                <p>
                  In the prototype, multilingual support appears in UI, localized content paths, and language-aware guidance surfaces. The goal is not to change the programming runtime itself. The goal is to make explanation, confidence, and recovery more accessible.
                </p>
                <div className="help-note rounded-[20px] px-3.5 py-3">
                  For judges, this is one of PebbleCode’s clearest product differentiators: it lowers the barrier to understanding without diluting technical rigor.
                </div>
              </div>
            </Card>

            <Card padding="sm" interactive className="help-section-shell rounded-[30px] px-4 py-4 sm:px-5 sm:py-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Why this matters</p>
              <div className="mt-3 space-y-2.5 text-[13px] leading-[1.68] text-pebble-text-secondary">
                <div className="help-note rounded-[18px] px-3 py-2.5">Students need more than accepted/rejected outputs.</div>
                <div className="help-note rounded-[18px] px-3 py-2.5">Interview prep improves when explanation quality improves.</div>
                <div className="help-note rounded-[18px] px-3 py-2.5">Peer learning becomes stronger when AI and humans reinforce each other.</div>
                <div className="help-note rounded-[18px] px-3 py-2.5">A recovery-first model can scale beyond one problem into long-term confidence.</div>
              </div>
            </Card>
          </div>

          <Card padding="sm" interactive className="help-section-shell rounded-[30px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
            <div className="space-y-1.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">What’s included in the prototype</p>
              <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-pebble-text-primary">
                The current build is already broad, but it is honest about what is seeded and what depends on configuration.
              </h2>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {prototypeAreas.map((area) => (
                <div key={area.label} className="help-note rounded-[22px] px-3.5 py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-pebble-accent">{area.label}</p>
                  <h3 className="mt-1.5 text-[15px] font-semibold text-pebble-text-primary">{area.title}</h3>
                  <ul className="mt-3 space-y-2 text-[12.75px] leading-[1.66] text-pebble-text-secondary">
                    {area.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-pebble-accent/70" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="sm" interactive className="help-section-shell rounded-[30px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
            <div className="space-y-1.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">How we built it</p>
              <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-pebble-text-primary">
                The architecture is serious enough to demonstrate real product depth, while still staying hackathon-practical.
              </h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {architecture.map((item, index) => {
                const Icon = [Layers3, ServerCog, FileCheck2, Sparkles][index]
                return (
                  <div key={item.title} className="help-note rounded-[22px] px-3.5 py-3.5">
                    <span className="help-chip-accent inline-flex h-10 w-10 items-center justify-center rounded-2xl">
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <p className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-pebble-accent">{item.label}</p>
                    <h3 className="mt-1.5 text-[15px] font-semibold text-pebble-text-primary">{item.title}</h3>
                    <p className="mt-2 text-[12.75px] leading-[1.7] text-pebble-text-secondary">{item.body}</p>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card padding="sm" interactive className="help-section-shell rounded-[30px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-5">
              <div className="space-y-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Closing note</p>
                <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-pebble-text-primary">
                  PebbleCode is meaningful because it treats coding practice as a learning system, not just a problem list.
                </h2>
                <p className="text-[13.5px] leading-[1.76] text-pebble-text-secondary">
                  The prototype already proves a credible product argument: students need a workflow that helps them write, fail, recover, reflect, and eventually learn with others. That makes PebbleCode relevant not only as a hackathon demo, but as a serious direction for more accessible and more effective coding education.
                </p>
              </div>
              <div className="space-y-2.5">
                <Link to="/how-to-use" className="help-note flex items-center justify-between rounded-[18px] px-3.5 py-3 text-[13px] font-medium text-pebble-text-primary transition-colors hover:text-pebble-accent">
                  See the full product walkthrough
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link to="/faq" className="help-note flex items-center justify-between rounded-[18px] px-3.5 py-3 text-[13px] font-medium text-pebble-text-primary transition-colors hover:text-pebble-accent">
                  Read judge-facing product answers
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link to="/session/1" className="help-note flex items-center justify-between rounded-[18px] px-3.5 py-3 text-[13px] font-medium text-pebble-text-primary transition-colors hover:text-pebble-accent">
                  Open the core Session experience
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    </section>
  )
}
