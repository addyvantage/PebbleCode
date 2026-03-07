import { Compass, MessageSquarePlus, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

type CommunityHeroProps = {
  onAskCommunity: () => void
  onBrowseGroups: () => void
}

export function CommunityHero({
  onAskCommunity,
  onBrowseGroups,
}: CommunityHeroProps) {
  return (
    <Card className="community-hero-shell relative overflow-hidden rounded-[28px] px-5 py-4 md:px-6 md:py-4.5" interactive>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-12 top-0 h-40 w-40 rounded-full bg-pebble-accent/10 blur-3xl" />
        <div className="absolute right-[-3rem] top-[-2rem] h-44 w-44 rounded-full bg-pebble-accent/10 blur-3xl" />
      </div>

      <div className="relative z-10 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Peer learning layer
          </Badge>
          <span className="community-chip inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium">
            Seeded demo discussions
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-2">
            <h1 className="max-w-[14ch] text-[1.95rem] font-semibold tracking-[-0.04em] text-pebble-text-primary sm:text-[2.22rem] lg:max-w-[16ch] lg:text-[2.45rem]">
              Learn with peers, not just prompts.
            </h1>
            <p className="max-w-[62ch] text-[13.5px] leading-[1.68] text-pebble-text-secondary md:text-[14.25px]">
              PebbleCode can turn failed runs, interview doubts, and project questions into collaborative learning threads without breaking the focused coding workflow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
            <Button onClick={onAskCommunity} className="gap-2 rounded-2xl px-5">
              <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
              Ask community
            </Button>
            <Button variant="secondary" onClick={onBrowseGroups} className="gap-2 rounded-2xl px-5">
              <Compass className="h-4 w-4" aria-hidden="true" />
              Browse discussions
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {['Debugging help', 'Project partners', 'Interview prep', 'SQL + DSA groups'].map((chip) => (
            <span key={chip} className="community-chip-muted inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium">
              {chip}
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
}
