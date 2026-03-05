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
    return 'border-sky-300/25 bg-[linear-gradient(160deg,rgba(116,181,255,0.18),rgba(10,20,38,0.40))] dark:bg-[linear-gradient(160deg,rgba(88,145,230,0.18),rgba(7,14,27,0.52))]'
  }
  if (tone === 'indigo') {
    return 'border-indigo-300/25 bg-[linear-gradient(160deg,rgba(151,146,255,0.18),rgba(14,18,42,0.40))] dark:bg-[linear-gradient(160deg,rgba(110,115,230,0.18),rgba(9,12,31,0.54))]'
  }
  if (tone === 'emerald') {
    return 'border-emerald-300/25 bg-[linear-gradient(160deg,rgba(120,220,188,0.16),rgba(11,28,33,0.42))] dark:bg-[linear-gradient(160deg,rgba(96,180,156,0.16),rgba(8,24,28,0.56))]'
  }
  return 'border-slate-300/22 bg-[linear-gradient(160deg,rgba(190,200,228,0.14),rgba(18,25,44,0.42))] dark:bg-[linear-gradient(160deg,rgba(136,149,179,0.12),rgba(9,13,24,0.56))]'
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
        <div className="rounded-xl border border-white/20 bg-slate-900/45 p-3 font-mono text-[11px] leading-relaxed text-slate-200">
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
          <div className="w-[88%] rounded-xl border border-white/16 bg-white/8 px-3 py-2 text-[11px] text-slate-200">Hint only: check seen before insert.</div>
          <div className="ml-auto w-[82%] rounded-xl border border-white/16 bg-white/6 px-3 py-2 text-[11px] text-slate-200">Need one concise next step.</div>
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
            <span key={chip} className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] text-slate-100">{chip}</span>
          ))}
        </div>
        <div className="rounded-xl border border-white/18 bg-white/6 p-2">
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
            <div key={kpi} className="rounded-xl border border-white/15 bg-white/8 p-2 text-center">
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
                  : 'border-white/18 bg-white/8 text-slate-200'
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
            A learning surface tuned for
            {' '}
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
              className={`group relative isolate overflow-hidden rounded-[28px] border border-black/10 bg-white/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-xl dark:border-white/12 dark:bg-white/[0.05] dark:shadow-[0_20px_45px_rgba(2,8,23,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] md:p-6 ${layoutClass(tile.layout)}`}
              style={{ ['--mx' as string]: '50%', ['--my' as string]: '50%' }}
              onMouseMove={onTileMouseMove}
              onMouseLeave={onTileMouseLeave}
              whileHover={reduceMotion ? undefined : { y: -7, rotateX: 1.6, rotateY: -1.8 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[radial-gradient(560px_circle_at_var(--mx)_var(--my),rgba(59,130,246,0.15),transparent_52%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-[radial-gradient(620px_circle_at_var(--mx)_var(--my),rgba(125,211,252,0.2),transparent_56%)]" />
              <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-gradient-to-b from-white/45 via-transparent to-transparent dark:from-white/[0.08]" />
              <div className="pointer-events-none absolute inset-x-6 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/85 to-transparent dark:via-sky-100/40" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[26px] border border-white/30 dark:border-white/10" />

              <div className="relative z-20 flex items-start justify-between gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-slate-700 dark:text-slate-200">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${toneClass(tile.tone)}`}>
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
