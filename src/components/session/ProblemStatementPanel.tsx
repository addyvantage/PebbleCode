import { useEffect, useMemo, useState } from 'react'
import type { PlacementLanguage } from '../../data/onboardingData'
import { getUnitSolution } from '../../data/solutionsBank'

type ProblemTest = {
  input: string
  expected: string
}

type ProblemStatementPanelProps = {
  unitId: string
  title: string
  concept: string
  prompt: string
  constraints: string[]
  hints: string[]
  tests: ProblemTest[]
  difficultyLabel: string
  tags: string[]
  language: PlacementLanguage
  functionMode?: boolean
  className?: string
}

function compactText(value: string) {
  return value.trim() || '(empty)'
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ')
}

const LANGUAGE_LABELS: Record<PlacementLanguage, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  cpp: 'C++',
  java: 'Java',
}

export function ProblemStatementPanel({
  unitId,
  title,
  concept,
  prompt,
  constraints,
  hints,
  tests,
  difficultyLabel,
  tags,
  language,
  functionMode = false,
  className,
}: ProblemStatementPanelProps) {
  const [activeTab, setActiveTab] = useState<'problem' | 'solutions' | 'hints'>('problem')
  const [solutionLanguage, setSolutionLanguage] = useState<PlacementLanguage>(language)
  const [copied, setCopied] = useState(false)

  const solution = useMemo(() => getUnitSolution(unitId), [unitId])
  const examples = tests.slice(0, 2)

  useEffect(() => {
    setSolutionLanguage(language)
    setCopied(false)
  }, [language, unitId])

  useEffect(() => {
    if (!copied) {
      return
    }

    const timeoutId = window.setTimeout(() => setCopied(false), 1200)
    return () => window.clearTimeout(timeoutId)
  }, [copied])

  const availableSolutionLanguages = useMemo(() => {
    if (!solution || !solution.implementations[language]) {
      return [] as PlacementLanguage[]
    }
    return [language]
  }, [language, solution])

  const selectedSolutionCode = solution?.implementations[solutionLanguage]

  async function copySolution() {
    if (!selectedSolutionCode) {
      return
    }

    try {
      await navigator.clipboard.writeText(selectedSolutionCode)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section
      className={classNames(
        'flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.03]',
        className,
      )}
    >
      <div className="flex items-center gap-1 border-b border-white/10 px-3 py-2">
        <TabButton
          active={activeTab === 'problem'}
          onClick={() => setActiveTab('problem')}
          label="Problem"
        />
        <TabButton
          active={activeTab === 'solutions'}
          onClick={() => setActiveTab('solutions')}
          label="Solutions"
        />
        <TabButton
          active={activeTab === 'hints'}
          onClick={() => setActiveTab('hints')}
          label="Hints"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {activeTab === 'problem' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs text-white/85">
                  {difficultyLabel}
                </span>
                <span className="rounded-full border border-pebble-accent/35 bg-pebble-accent/12 px-2.5 py-1 text-xs text-pebble-accent">
                  {concept}
                </span>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-white/80">{prompt}</p>
            </div>

            <Section title="Description">
              Solve the task for every testcase. Keep output exact and avoid extra logs.
            </Section>

            <Section title="Input">
              {functionMode
                ? 'Input is handled automatically. Implement the function signature only.'
                : 'Read values from standard input exactly as provided by each testcase.'}
            </Section>

            <Section title="Output">
              {functionMode
                ? 'Return the correct value from the function. Output formatting is handled internally.'
                : 'Print only the expected output for the testcase.'}
            </Section>

            {functionMode && (
              <div className="rounded-xl border border-pebble-accent/35 bg-pebble-accent/10 px-3 py-2 text-xs text-white/85">
                Function mode: input parsing and testcase execution are handled for you.
              </div>
            )}

            <section className="space-y-1">
              <h3 className="text-sm font-semibold text-white">Constraints</h3>
              <ul className="list-disc space-y-1 pl-4 text-sm text-white/75">
                {constraints.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Examples</h3>
              <div className="grid gap-2">
                {examples.map((example, index) => (
                  <div
                    key={`${title}-example-${index}`}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-2"
                  >
                    <p className="text-xs font-medium text-white/90">Example {index + 1}</p>
                    <div className="mt-1 grid gap-1 text-xs text-white/75">
                      <p className="rounded-lg border border-white/10 bg-black/20 px-2 py-1">
                        <span className="font-medium text-white/95">Input:</span> {compactText(example.input)}
                      </p>
                      <p className="rounded-lg border border-white/10 bg-black/20 px-2 py-1">
                        <span className="font-medium text-white/95">Output:</span> {compactText(example.expected)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'solutions' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">How to solve</h3>
              <p className="text-sm text-white/75">
                Pebble curated walkthrough for this unit.
              </p>
            </div>

            {!solution || availableSolutionLanguages.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/75">
                Solution not published yet. Try <span className="font-medium text-white">Hint</span> or{' '}
                <span className="font-medium text-white">Ask Pebble</span>.
              </div>
            ) : (
              <>
                <section className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">Intuition</h4>
                  <p className="text-sm text-white/80">{solution.intuition}</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">Approach</h4>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-white/80">
                    {solution.approach.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">Complexity</h4>
                  <p className="text-sm text-white/80">Time: {solution.complexity.time}</p>
                  <p className="text-sm text-white/80">Space: {solution.complexity.space}</p>
                </section>

                <section className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white">Implementation</h4>
                    <button
                      type="button"
                      onClick={() => void copySolution()}
                      className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-white/80 transition hover:bg-white/[0.12]"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {availableSolutionLanguages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setSolutionLanguage(lang)}
                        className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                          solutionLanguage === lang
                            ? 'border-pebble-accent/45 bg-pebble-accent/14 text-white'
                            : 'border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.1]'
                        }`}
                      >
                        {LANGUAGE_LABELS[lang]}
                      </button>
                    ))}
                  </div>

                  <pre className="max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/25 p-3 text-[12px] leading-relaxed text-white/85">
                    <code>{selectedSolutionCode}</code>
                  </pre>
                </section>
              </>
            )}
          </div>
        )}

        {activeTab === 'hints' && (
          <div className="space-y-2">
            {hints.length > 0 ? (
              <ul className="list-disc space-y-1 pl-4 text-sm text-white/80">
                {hints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/75">
                No hints available yet. Try running tests and ask Pebble for a targeted hint.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
        active
          ? 'bg-white/10 text-white'
          : 'text-white/65 hover:bg-white/10 hover:text-white/90'
      }`}
    >
      {label}
    </button>
  )
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <section className="space-y-1">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-sm text-white/80">{children}</p>
    </section>
  )
}
