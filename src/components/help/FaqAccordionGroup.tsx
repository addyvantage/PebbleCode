import { useState } from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { Card } from '../ui/Card'
import type { HelpFaqGroup } from '../../data/helpContent'

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

function FaqItem({ question, answer, defaultOpen = false }: { question: string; answer: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="help-faq-item rounded-[22px] px-4 py-3.5 sm:px-4.5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <div className="space-y-1">
          <p className="text-[15px] font-semibold leading-6 text-pebble-text-primary">{question}</p>
        </div>
        <span
          className={classNames(
            'help-chip-muted mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200',
            open && 'rotate-180',
          )}
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>
      {open ? (
        <p className="mt-3 border-t border-pebble-border/12 pt-3 text-[13.5px] leading-[1.75] text-pebble-text-secondary">
          {answer}
        </p>
      ) : null}
    </div>
  )
}

export function FaqAccordionGroup({ group, defaultOpenIndex = 0 }: { group: HelpFaqGroup; defaultOpenIndex?: number }) {
  const Icon = group.icon as LucideIcon

  return (
    <Card padding="sm" interactive className="help-section-shell rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-start gap-3.5">
        <span className="help-chip-accent inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-1.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{group.label}</p>
          <h2 className="text-[1.18rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">{group.title}</h2>
          <p className="max-w-[62ch] text-[13px] leading-[1.68] text-pebble-text-secondary">{group.description}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5">
        {group.items.map((item, index) => (
          <FaqItem
            key={item.question}
            question={item.question}
            answer={item.answer}
            defaultOpen={index === defaultOpenIndex}
          />
        ))}
      </div>
    </Card>
  )
}
