import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

type HelpHeroAction = {
  label: string
  to: string
  variant?: 'primary' | 'secondary'
  icon?: LucideIcon
}

type HelpHeroProps = {
  badge: string
  title: string
  description: string
  chips: string[]
  actions: HelpHeroAction[]
  note?: string
}

export function HelpHero({ badge, title, description, chips, actions, note }: HelpHeroProps) {
  return (
    <div className="help-hero-shell rounded-[30px] px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-6">
      <div className="max-w-[980px] space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge>{badge}</Badge>
          {note ? (
            <span className="help-chip-muted inline-flex rounded-full px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]">
              {note}
            </span>
          ) : null}
        </div>

        <div className="space-y-3">
          <h1 className="max-w-[16ch] text-balance text-[2.2rem] font-semibold tracking-[-0.04em] text-pebble-text-primary sm:text-[2.7rem] lg:text-[3rem]">
            {title}
          </h1>
          <p className="max-w-[66ch] text-[15px] leading-7 text-pebble-text-secondary sm:text-[15.5px]">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.label} to={action.to} className="inline-flex">
                <Button variant={action.variant ?? 'secondary'} className="gap-2 rounded-2xl px-4.5">
                  {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                  {action.label}
                </Button>
              </Link>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {chips.map((chip) => (
            <span key={chip} className="help-chip-muted inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium">
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
