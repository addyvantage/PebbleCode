import { useMemo, useRef, useState } from 'react'
import { Compass, MessageSquarePlus, Sparkles } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import {
  getCommunityFilters,
  getCommunityGroups,
  getCommunityPosts,
  getCommunityTopHelpers,
  getCommunityTrendingTopics,
  type CommunityFilterId,
  type CommunityPost,
} from '../data/communitySeed'
import { CommunityHero } from '../components/community/CommunityHero'
import { CommunityPostCard } from '../components/community/CommunityPostCard'
import { CommunityComposer } from '../components/community/CommunityComposer'
import type { ComposerPrefill } from '../components/community/communityTypes'
import { useI18n } from '../i18n/useI18n'
import { getProductCopy } from '../i18n/productCopy'

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

function buildDemoPost(payload: {
  title: string
  groupId: string
  body: string
  tags: string[]
  linkedProblem?: string
}): CommunityPost {
  return {
    id: `draft-${Date.now()}`,
    groupId: payload.groupId,
    title: payload.title,
    author: 'You',
    initials: 'YO',
    timestamp: 'just now',
    body: payload.body,
    replyCount: 0,
    helpfulCount: 0,
    solved: false,
    tags: payload.tags,
    linkedProblem: payload.linkedProblem,
    previewReplies: [],
  }
}

export function CommunityPage() {
  const { lang } = useI18n()
  const copy = getProductCopy(lang).community?.ui
  const groups = getCommunityGroups(lang)
  const filters = getCommunityFilters(lang)
  const trendingTopics = getCommunityTrendingTopics(lang)
  const topHelpers = getCommunityTopHelpers(lang)
  const seedPosts = getCommunityPosts(lang)

  const [activeFilter, setActiveFilter] = useState<CommunityFilterId>('all')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [posts, setPosts] = useState<CommunityPost[]>(seedPosts)
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerPrefill, setComposerPrefill] = useState<ComposerPrefill | null>(null)
  const forumAnchorRef = useRef<HTMLDivElement | null>(null)

  useMemo(() => setPosts(seedPosts), [seedPosts])

  const filteredPosts = useMemo(() => {
    let next = posts
    if (selectedGroupId) next = next.filter((post) => post.groupId === selectedGroupId)
    if (activeFilter === 'unanswered') next = next.filter((post) => !post.solved)
    else if (activeFilter === 'helpful') next = [...next].sort((left, right) => right.helpfulCount - left.helpfulCount)
    else if (activeFilter === 'trending') next = next.filter((post) => post.trending)
    else if (activeFilter === 'problem') next = next.filter((post) => Boolean(post.linkedProblem))
    return next
  }, [activeFilter, posts, selectedGroupId])

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  )

  return (
    <section className="page-enter space-y-3 pb-3">
      <CommunityHero
        onAskCommunity={() => {
          setComposerPrefill(null)
          setComposerOpen(true)
        }}
        onBrowseGroups={() => forumAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      />

      <div ref={forumAnchorRef} className="grid gap-3.5 xl:grid-cols-[232px_minmax(0,1fr)]">
        <Card padding="sm" interactive className="community-rail-shell rounded-[26px] px-4 py-3.5">
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.viewLabel}</p>
              <div className="mt-2.5 space-y-1.5">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                    className={classNames('community-rail-link', activeFilter === filter.id && 'community-rail-link-active')}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="community-divider" />

            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.groupShortcuts}</p>
                {selectedGroupId ? (
                  <button type="button" onClick={() => setSelectedGroupId('')} className="text-[11px] font-medium text-pebble-accent transition hover:text-pebble-text-primary">
                    {copy.clear}
                  </button>
                ) : null}
              </div>
              <div className="mt-2.5 space-y-1.5">
                {groups.slice(0, 6).map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedGroupId(group.id)}
                    className={classNames('community-rail-link justify-between', selectedGroupId === group.id && 'community-rail-link-active')}
                  >
                    <span>{group.name}</span>
                    <span className="text-[11px] text-pebble-text-muted">{group.lastActivity}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="community-inset-strong rounded-[22px] p-3.5">
              <div className="flex items-start gap-3">
                <span className="community-chip-accent inline-flex h-10 w-10 items-center justify-center rounded-2xl">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.createFromProblem}</p>
                  <p className="text-[12.5px] leading-[1.62] text-pebble-text-secondary">{copy.createFromProblemBody}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setComposerPrefill({
                    title: 'Two Sum fails on duplicate case after Pebble hint',
                    groupId: 'debugging-help',
                    body: 'Problem: Two Sum\nLanguage: Python\nIssue: Fails on test case #2 even after following Pebble’s hint. Looking for a plain-language explanation of the correct hashmap flow.',
                    tags: ['Array', 'Hash Map', 'Python'],
                    linkedProblem: 'Two Sum',
                  })
                  setComposerOpen(true)
                }}
                className="mt-3.5 w-full rounded-2xl"
              >
                {copy.askFromProblem}
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-3.5">
          <Card padding="sm" interactive className="community-feed-shell rounded-[26px] px-4 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <div className="community-section-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]">
                  <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.forumPill}
                </div>
                <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">
                  {selectedGroup ? selectedGroup.name : copy.activeDiscussions}
                </h2>
                <p className="max-w-[68ch] text-[12.85px] leading-[1.62] text-pebble-text-secondary">{copy.forumBody}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className="community-chip-muted border-0">{filteredPosts.length} {copy.threads}</Badge>
                {selectedGroup ? <Badge className="community-chip-muted border-0">{selectedGroup.membersLabel}</Badge> : null}
                <Button onClick={() => { setComposerPrefill(null); setComposerOpen(true) }} className="gap-2 rounded-2xl px-4">
                  <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                  {copy.askCommunity}
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {trendingTopics.slice(0, 4).map((topic) => (
                <span key={topic} className="community-chip-muted inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium">{topic}</span>
              ))}
            </div>

            <div className="mt-3.5 grid gap-2.5">
              {filteredPosts.map((post) => (
                <CommunityPostCard key={post.id} post={post} groupName={groups.find((group) => group.id === post.groupId)?.name ?? post.groupId} href={`/community/thread/${post.id}`} />
              ))}
            </div>
          </Card>

          <div className="grid gap-3 md:grid-cols-3">
            <Card padding="sm" interactive className="community-rail-shell rounded-[22px] px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.topHelpers}</p>
              <p className="mt-1 text-[12.5px] leading-[1.58] text-pebble-text-secondary">{copy.topHelpersBody}</p>
              <div className="mt-3 space-y-2.5">
                {topHelpers.map((helper) => (
                  <div key={helper.id} className="community-inset rounded-[16px] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[12.5px] font-semibold text-pebble-text-primary">{helper.name}</p>
                        <p className="text-[11px] text-pebble-text-muted">{helper.specialty}</p>
                      </div>
                      <span className="community-chip-muted inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-medium">{helper.helpfulCount} {copy.helpful}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="sm" interactive className="community-rail-shell rounded-[22px] px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.whyMatters}</p>
              <h3 className="mt-1 text-[1rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">{copy.whyMattersBody}</h3>
              <div className="mt-3 community-inset rounded-[16px] px-3 py-2.5 text-[12.5px] leading-[1.62] text-pebble-text-secondary">
                {copy.workflowLine}
              </div>
            </Card>

            <Card padding="sm" interactive className="community-rail-shell rounded-[22px] px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">{copy.comingNext}</p>
              <div className="mt-3 space-y-2">
                {copy.comingNextItems.map((item: string) => (
                  <div key={item} className="community-inset rounded-[16px] px-3 py-2.5 text-[12.5px] leading-[1.6] text-pebble-text-secondary">{item}</div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <CommunityComposer
        groups={groups}
        open={composerOpen}
        prefill={composerPrefill}
        onClose={() => setComposerOpen(false)}
        onSubmit={(payload) => {
          setPosts((current) => [buildDemoPost(payload), ...current])
          setComposerOpen(false)
          setComposerPrefill(null)
        }}
      />
    </section>
  )
}
