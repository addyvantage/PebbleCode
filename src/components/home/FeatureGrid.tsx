import { motion, useReducedMotion } from 'framer-motion'
import { type MouseEvent } from 'react'
import { Bot, ChartLine, Code2, Languages, ListFilter, Sparkles } from 'lucide-react'

type TileTone = 'blue' | 'indigo' | 'emerald' | 'slate'
type TileLayout = 'hero' | 'tall' | 'normal'

type FeatureTile = {
  id: string
  title: string
  detail: string
  tag: string
  tone: TileTone
  layout: TileLayout
  preview: 'runtime' | 'coach' | 'browser' | 'insights' | 'languages' | 'placement'
  icon: typeof Code2
}

const tiles: FeatureTile[] = [
  {
    id: 'runtime',
    title: 'Run code with real feedback',
    detail: 'Test quickly, inspect output deltas, and tighten your loop with runtime-aware checkpoints.',
    tag: 'Runtime',
    tone: 'blue',
    layout: 'hero',
    preview: 'runtime',
    icon: Code2,
  },
  {
    id: 'coach',
    title: 'Pebble Coach',
    detail: 'Hint, Explain, and Next-step guidance calibrated to your current recovery state.',
    tag: 'Coach',
    tone: 'indigo',
    layout: 'tall',
    preview: 'coach',
    icon: Bot,
  },
  {
    id: 'browser',
    title: 'LeetCode-style problems browser',
    detail: 'Filter by topic, difficulty, and acceptance with quick random drills.',
    tag: 'Browser',
    tone: 'slate',
    layout: 'normal',
    preview: 'browser',
    icon: ListFilter,
  },
  {
    id: 'insights',
    title: 'Recovery insights',
    detail: 'Track streak, autonomy rate, and weekly breakpoints in one clean pulse.',
    tag: 'Insights',
    tone: 'blue',
    layout: 'normal',
    preview: 'insights',
    icon: ChartLine,
  },
  {
    id: 'languages',
    title: 'Multilingual mentor',
    detail: 'Stay in the same flow across English and Indian language support.',
    tag: 'Language',
    tone: 'emerald',
    layout: 'normal',
    preview: 'languages',
    icon: Languages,
  },
  {
    id: 'placement',
    title: 'Placement-ready sessions',
    detail: 'Weekly rotating prep blocks with guided unit pacing to stay interview-sharp.',
    tag: 'Placement',
    tone: 'indigo',
    layout: 'normal',
    preview: 'placement',
    icon: Sparkles,
  },
]

function layoutClass(layout: TileLayout) {
  if (layout === 'hero') {
    return 'md:col-span-2 xl:col-span-7 xl:row-span-2'
  }
  if (layout === 'tall') {
    return 'md:col-span-1 xl:col-span-5 xl:row-span-2'
  }
  return 'md:col-span-1 xl:col-span-4'
}

function toneClass(tone: TileTone) {
  if (tone === 'blue') return 'text-sky-300 bg-sky-400/18 border-sky-300/30 dark:text-sky-200'
  if (tone === 'indigo') return 'text-indigo-300 bg-indigo-400/18 border-indigo-300/30 dark:text-indigo-200'
  if (tone === 'emerald') return 'text-emerald-300 bg-emerald-400/18 border-emerald-300/30 dark:text-emerald-200'
  return 'text-slate-400 bg-slate-300/20 border-slate-300/30 dark:text-slate-300'
}

function previewSurfaceClass(tone: TileTone) {
  if (tone === 'blue') {
    return 'border-sky-200/35 bg-[linear-gradient(160deg,rgba(186,230,253,0.20),rgba(2,8,23,0.35))] dark:bg-[linear-gradient(160deg,rgba(56,189,248,0.16),rgba(2,8,23,0.62))] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
  }
  if (tone === 'indigo') {
    return 'border-indigo-200/35 bg-[linear-gradient(160deg,rgba(199,210,254,0.20),rgba(8,10,30,0.36))] dark:bg-[linear-gradient(160deg,rgba(99,102,241,0.16),rgba(2,8,23,0.64))] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
  }
  if (tone === 'emerald') {
    return 'border-emerald-200/35 bg-[linear-gradient(160deg,rgba(167,243,208,0.18),rgba(5,20,26,0.38))] dark:bg-[linear-gradient(160deg,rgba(16,185,129,0.14),rgba(2,8,23,0.65))] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
  }
  return 'border-slate-200/30 bg-[linear-gradient(160deg,rgba(226,232,240,0.18),rgba(10,14,28,0.38))] dark:bg-[linear-gradient(160deg,rgba(148,163,184,0.12),rgba(2,8,23,0.66))] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]'
}

function onTileMouseMove(event: MouseEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  event.currentTarget.style.setProperty('--mx', `${Math.max(0, Math.min(100, x)).toFixed(2)}%`)
  event.currentTarget.style.setProperty('--my', `${Math.max(0, Math.min(100, y)).toFixed(2)}%`)
}

function onTileMouseLeave(event: MouseEvent<HTMLElement>) {
  event.currentTarget.style.setProperty('--mx', '50%')
  event.currentTarget.style.setProperty('--my', '50%')
}

function TilePreview({ preview, tone }: Pick<FeatureTile, 'preview' | 'tone'>) {
  const surfaceClass = previewSurfaceClass(tone)

  if (preview === 'runtime') {
    return (
      <div className={`rounded-2xl border p-4 ${surfaceClass}`}>
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full border border-sky-300/35 bg-sky-400/18 px-2 py-0.5 text-[10px] font-medium text-sky-100">Unit: Two Sum</span>
          <span className="rounded-full border border-amber-300/40 bg-amber-400/18 px-2 py-0.5 text-[10px] font-medium text-amber-100">Failing: 1</span>
        </div>
        <div className="rounded-xl border border-white/22 bg-slate-900/55 p-3 font-mono text-[11px] leading-relaxed text-slate-200">
          <div>def solve(nums, target):</div>
          <div className="opacity-85">  seen = {'{}'}</div>
          <div className="opacity-85">  return -1, -1</div>
        </div>
      </div>
    )
  }

  if (preview === 'coach') {
    return (
      <div className={`rounded-2xl border p-4 ${surfaceClass}`}>
        <div className="space-y-2">
          <div className="w-[88%] rounded-xl border border-white/22 bg-white/10 px-3 py-2 text-[11px] text-slate-200">Hint only: check seen before insert.</div>
          <div className="ml-auto w-[82%] rounded-xl border border-white/22 bg-white/10 px-3 py-2 text-[11px] text-slate-200">Need one concise next step.</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['Hint', 'Explain', 'Next step'].map((chip) => (
            <span key={chip} className="rounded-full border border-indigo-300/35 bg-indigo-400/18 px-2.5 py-1 text-[10px] font-medium text-indigo-100">
              {chip}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (preview === 'browser') {
    return (
      <div className={`rounded-2xl border p-4 ${surfaceClass}`}>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {['Array', 'HashMap', 'Medium'].map((chip) => (
            <span key={chip} className="rounded-full border border-white/22 bg-white/10 px-2 py-0.5 text-[10px] text-slate-100">{chip}</span>
          ))}
        </div>
        <div className="rounded-xl border border-white/22 bg-white/10 p-2">
          <div className="mb-1.5 h-2 w-2/3 rounded-full bg-white/40" />
          <div className="mb-1.5 h-2 w-5/6 rounded-full bg-white/30" />
          <div className="flex items-center justify-between text-[10px] text-slate-200/90">
            <span>Acceptance 63%</span>
            <span>2/3 solved</span>
          </div>
        </div>
      </div>
    )
  }

  if (preview === 'insights') {
    return (
      <div className={`rounded-2xl border p-4 ${surfaceClass}`}>
        <div className="mb-2 grid grid-cols-3 gap-2">
          {['Streak', 'Autonomy', 'Breakpoints'].map((kpi) => (
            <div key={kpi} className="rounded-xl border border-white/22 bg-white/10 p-2 text-center">
              <div className="text-[9px] uppercase tracking-[0.08em] text-slate-300">{kpi}</div>
              <div className="mt-1 text-[12px] font-semibold text-slate-100">{kpi === 'Streak' ? '08' : kpi === 'Autonomy' ? '72%' : '3'}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-end gap-1.5">
          {[22, 35, 30, 48, 56, 45, 60].map((h, idx) => (
            <span key={idx} className="block w-full rounded-full bg-gradient-to-t from-sky-500/45 to-sky-200/80" style={{ height: `${h}px` }} />
          ))}
        </div>
      </div>
    )
  }

  if (preview === 'languages') {
    return (
      <div className={`rounded-2xl border p-4 ${surfaceClass}`}>
        <div className="grid grid-cols-3 gap-2">
          {['EN', 'HI', 'BN', 'TA', 'TE', 'MR'].map((lang) => (
            <div
              key={lang}
              className={`rounded-xl border px-2 py-1.5 text-center text-[10px] font-medium ${
                lang === 'EN'
                  ? 'border-sky-300/50 bg-sky-400/22 text-sky-100'
                  : 'border-white/22 bg-white/10 text-slate-200'
              }`}
            >
              {lang}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border p-4 ${surfaceClass}`}>
      <div className="mb-2 flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-300/85" />
        <div className="h-2 w-32 rounded-full bg-white/40" />
      </div>
      <div className="space-y-2">
        <div className="h-2 w-5/6 rounded-full bg-white/35" />
        <div className="h-2 w-3/4 rounded-full bg-white/30" />
        <div className="h-2 w-2/3 rounded-full bg-white/26" />
      </div>
    </div>
  )
}

export function FeatureGrid() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="relative mt-2 px-0 pb-2 pt-3 md:pt-4 lg:pt-6">
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pebble-text-muted">
            Built for fast recovery loops
          </p>
          <h2 className="text-balance text-[2rem] font-semibold tracking-[-0.02em] text-slate-900 dark:text-slate-100 md:text-[2.3rem] lg:text-[2.55rem] xl:text-[2.9rem] leading-[1.04]">
            A learning surface tuned for{' '}
            <span className="text-blue-600 dark:text-sky-300">measurable momentum</span>
          </h2>
        </div>
        <p className="max-w-[62ch] text-[14px] leading-[1.75] text-slate-600 dark:text-slate-300 md:text-[15px] lg:justify-self-end lg:text-right">
          Pebble blends high-signal execution, contextual coaching, and focused analytics into one calm interface so every session compounds.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12 xl:auto-rows-[minmax(214px,auto)] 2xl:auto-rows-[minmax(224px,auto)]">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <motion.article
              key={tile.id}
              className={`group relative isolate overflow-hidden rounded-[30px]
  border border-black/10 bg-white/70
  shadow-[0_18px_60px_rgba(2,8,23,0.10)]
  backdrop-blur-xl
  dark:border-white/12 dark:bg-white/[0.035]
  dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)]
  md:p-6 p-5 ${layoutClass(tile.layout)}`}
              style={{ ['--mx' as string]: '50%', ['--my' as string]: '50%' }}
              onMouseMove={onTileMouseMove}
              onMouseLeave={onTileMouseLeave}
              whileHover={reduceMotion ? undefined : { y: -10, scale: 1.01 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {/* Premium gradient border ring */}
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] p-[1px]">
                <div className="absolute inset-0 rounded-[inherit] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(56,189,248,0.35),rgba(99,102,241,0.22),rgba(52,211,153,0.20),rgba(56,189,248,0.35))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute inset-0 rounded-[inherit] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,255,255,0.18),rgba(255,255,255,0.08),rgba(255,255,255,0.14))] opacity-100 dark:opacity-60" />
                <div className="absolute inset-[1px] rounded-[28px] bg-white/70 dark:bg-[#0b1220]/55" />
              </div>

              {/* Cursor glow */}
              <div
                className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(520px circle at var(--mx) var(--my), rgba(56,189,248,0.22), transparent 55%)',
                }}
              />

              {/* Subtle top highlight line */}
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/85 to-transparent dark:via-white/18" />

              {/* Ultra-subtle noise (makes it feel “expensive”) */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay dark:opacity-[0.06]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
                }}
              />

              <div className="relative z-20 flex items-start justify-between gap-3">
                <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl
  border border-white/25 bg-white/10 text-slate-700
  shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]
  dark:border-white/12 dark:bg-white/[0.06] dark:text-slate-100">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.10em]
  shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ${toneClass(tile.tone)}`}>
                  {tile.tag}
                </span>
              </div>

              <div className="relative z-20 mt-4 space-y-2.5">
                <h3 className="text-balance text-[20px] font-semibold leading-[1.15] tracking-tight text-slate-900 dark:text-slate-100">
                  {tile.title}
                </h3>
                <p className="text-[13.5px] leading-[1.6] text-slate-600 dark:text-slate-300">
                  {tile.detail}
                </p>
              </div>

              <motion.div
                className="relative z-20 mt-4"
                whileHover={reduceMotion ? undefined : { scale: 1.015 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <TilePreview preview={tile.preview} tone={tile.tone} />
              </motion.div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
