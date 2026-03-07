import type { HelpStep } from '../../data/helpContent'
import { Card } from '../ui/Card'

export function HowToStepCard({ step }: { step: HelpStep }) {
  const Icon = step.icon

  return (
    <Card padding="sm" interactive className="help-step-card rounded-[26px] px-4 py-4 sm:px-5 sm:py-4.5">
      <div className="flex items-start gap-3.5">
        <div className="flex flex-col items-center gap-2 pt-0.5">
          <span className="help-chip-accent inline-flex h-11 w-11 items-center justify-center rounded-2xl">
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span className="hidden h-full w-px bg-gradient-to-b from-pebble-accent/20 to-transparent sm:block" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{step.label}</p>
            <h3 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">
              {step.title}
            </h3>
          </div>

          <p className="text-[13.5px] leading-[1.72] text-pebble-text-secondary">{step.body}</p>
          <div className="help-note rounded-[18px] px-3.5 py-3 text-[12.5px] leading-[1.65] text-pebble-text-secondary">
            {step.detail}
          </div>
          {step.chips?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {step.chips.map((chip) => (
                <span key={chip} className="help-chip-muted inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
