import { Compass, MessageSquarePlus, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import type { CommunityStat } from '../../data/communitySeed'

type CommunityHeroProps = {
  stats: CommunityStat[]
  onAskCommunity: () => void
  onBrowseGroups: () => void
}

export function CommunityHero({
  stats,
  onAskCommunity,
  onBrowseGroups,
}: CommunityHeroProps) {
  return (
    <Card className="community-hero-shell relative overflow-hidden rounded-[28px] px-5 py-4.5 md:px-6 md:py-5.5" interactive>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-12 top-0 h-44 w-44 rounded-full bg-pebble-accent/10 blur-3xl" />
        <div className="absolute right-[-4rem] top-[-2rem] h-56 w-56 rounded-full bg-pebble-accent/10 blur-3xl" />
      </div>

      <div className="relative z-10 grid gap-3.5 lg:grid-cols-[minmax(0,1.3fr)_300px] lg:items-end">
        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Community
            </Badge>
            <span className="community-chip inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium">
              Seeded prototype data
            </span>
          </div>

          <div className="space-y-1.5">
            <h1 className="max-w-[13ch] text-[1.95rem] font-semibold tracking-[-0.04em] text-pebble-text-primary sm:text-[2.28rem] lg:text-[2.55rem]">
              Learn with peers, not just prompts.
            </h1>
            <p className="max-w-[55ch] text-[13.5px] leading-[1.72] text-pebble-text-secondary md:text-[14.5px]">
              PebbleCode pairs runtime-aware coaching with student discussion spaces for debugging help, project
              partners, interview prep, and shared learning loops.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button onClick={onAskCommunity} className="gap-2 rounded-2xl px-5">
              <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
              Ask community
            </Button>
            <Button variant="secondary" onClick={onBrowseGroups} className="gap-2 rounded-2xl px-5">
              <Compass className="h-4 w-4" aria-hidden="true" />
              Browse groups
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['Debugging help', 'Project partners', 'Interview prep', 'SQL + DSA groups'].map((chip) => (
              <span key={chip} className="community-chip-muted inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium">
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="community-card-strong rounded-[24px] p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">
              Community pulse
            </p>
            <span className="community-chip-accent inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]">
              Demo-ready
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {stats.map((stat) => (
              <div key={stat.label} className="community-inset rounded-[18px] px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-pebble-text-muted">{stat.label}</p>
                <p className="mt-0.5 text-[1.1rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">{stat.value}</p>
                <p className="mt-1 text-[11.5px] leading-[1.5] text-pebble-text-secondary">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
