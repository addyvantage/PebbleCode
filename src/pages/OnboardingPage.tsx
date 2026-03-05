import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  languageMetadata,
  type PlacementLanguage,
  type PlacementLevel,
} from '../data/onboardingData'
import { getPebbleUserState, savePebbleOnboarding } from '../utils/pebbleUserState'

const levels: Array<{ id: PlacementLevel; label: string; subtitle: string }> = [
  {
    id: 'beginner',
    label: 'Beginner',
    subtitle: 'Learning syntax and core problem-solving patterns',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    subtitle: 'Comfortable coding independently with common algorithms',
  },
  {
    id: 'pro',
    label: 'Pro',
    subtitle: 'Targeting advanced interviews and production-level quality',
  },
]

function selectCardClass(isSelected: boolean) {
  return `group rounded-[18px] border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pebble-accent/45 ${
    isSelected
      ? 'border-pebble-accent/60 bg-pebble-accent/14 text-pebble-text-primary shadow-[0_14px_30px_rgba(37,99,235,0.16),inset_0_1px_0_rgba(255,255,255,0.18)]'
      : 'border-pebble-border/30 bg-pebble-overlay/[0.05] text-pebble-text-secondary hover:border-pebble-border/50 hover:bg-pebble-overlay/[0.1] hover:text-pebble-text-primary'
  }`
}

function summaryValue(value: string | null) {
  return value ?? 'Not selected yet'
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const existingState = useMemo(() => getPebbleUserState(), [])

  const [level, setLevel] = useState<PlacementLevel | null>(existingState.onboarding?.level ?? null)
  const [language, setLanguage] = useState<PlacementLanguage | null>(existingState.onboarding?.language ?? null)

  const selectedLevel = levels.find((item) => item.id === level) ?? null
  const selectedLanguage = languageMetadata.find((item) => item.id === language) ?? null
  const canContinue = Boolean(level && language)

  function handleContinue() {
    if (!level || !language) {
      return
    }

    savePebbleOnboarding({ language, level })
    navigate(`/placement?lang=${language}&level=${level}`)
  }

  return (
    <section className="page-enter mx-auto w-full max-w-[1100px] px-1 pb-5 pt-1">
      <Card padding="lg" className="relative overflow-hidden" interactive>
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-pebble-accent/16 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-[-8rem] h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative space-y-6">
          <div className="space-y-2">
            <Badge>Onboarding</Badge>
            <h1 className="text-balance text-3xl font-semibold tracking-[-0.02em] text-pebble-text-primary sm:text-4xl">
              Personalize your Pebble learning track
            </h1>
            <p className="max-w-2xl text-[15px] leading-relaxed text-pebble-text-secondary sm:text-base">
              Choose your current level and preferred language so Pebble can start you at the right depth from day one.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-pebble-text-muted">Step 1</p>
                <h2 className="text-xl font-semibold text-pebble-text-primary">Select your current level</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {levels.map((item) => {
                    const selected = level === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLevel(item.id)}
                        className={selectCardClass(selected)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[15px] font-semibold text-pebble-text-primary">{item.label}</p>
                          {selected && (
                            <span className="rounded-full border border-pebble-accent/45 bg-pebble-accent/18 px-2 py-0.5 text-[10px] font-semibold text-pebble-accent">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-[12.5px] leading-relaxed text-pebble-text-secondary">{item.subtitle}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-pebble-text-muted">Step 2</p>
                <h2 className="text-xl font-semibold text-pebble-text-primary">Select language focus</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {languageMetadata.map((item) => {
                    const selected = language === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLanguage(item.id)}
                        className={selectCardClass(selected)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-base font-semibold text-pebble-text-primary">{item.label}</p>
                          {selected && (
                            <span className="rounded-full border border-pebble-accent/45 bg-pebble-accent/18 px-2 py-0.5 text-[10px] font-semibold text-pebble-accent">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-[12.5px] leading-relaxed text-pebble-text-secondary">{item.purpose}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <aside className="rounded-[20px] border border-pebble-border/30 bg-pebble-overlay/[0.08] p-4 shadow-[0_18px_42px_rgba(2,8,23,0.16)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-pebble-text-muted">Selection preview</p>
                <span className="rounded-full border border-pebble-border/36 bg-pebble-overlay/[0.12] px-2 py-0.5 text-[10px] font-semibold text-pebble-text-secondary">
                  Step 1/2
                </span>
              </div>

              <div className="space-y-2 rounded-2xl border border-pebble-border/28 bg-pebble-canvas/55 p-3">
                <div className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="text-pebble-text-muted">Level</span>
                  <span className="font-semibold text-pebble-text-primary">{summaryValue(selectedLevel?.label ?? null)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="text-pebble-text-muted">Language</span>
                  <span className="font-semibold text-pebble-text-primary">{summaryValue(selectedLanguage?.label ?? null)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-[12px] font-semibold text-pebble-text-primary">What you&apos;ll get</p>
                <ul className="space-y-1.5 text-[12px] leading-relaxed text-pebble-text-secondary">
                  <li className="rounded-xl border border-pebble-border/25 bg-pebble-overlay/[0.05] px-2.5 py-1.5">Weekly placement set tuned to your level.</li>
                  <li className="rounded-xl border border-pebble-border/25 bg-pebble-overlay/[0.05] px-2.5 py-1.5">Guided units with clear test-driven checkpoints.</li>
                  <li className="rounded-xl border border-pebble-border/25 bg-pebble-overlay/[0.05] px-2.5 py-1.5">Pebble Coach hints that adapt to your struggle pattern.</li>
                </ul>
              </div>
            </aside>
          </div>

          <div className="sticky bottom-0 z-10 -mx-6 mt-1 border-t border-pebble-border/24 bg-pebble-panel/90 px-6 py-3 backdrop-blur-md sm:-mx-8 sm:px-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-pebble-text-secondary">
                {canContinue ? 'Great. Continue to your placement set.' : 'Select both level and language to continue.'}
              </p>
              <Button onClick={handleContinue} disabled={!canContinue}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}

