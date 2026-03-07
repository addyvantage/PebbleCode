import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  BookOpenText,
  ChartNoAxesCombined,
  Compass,
  MessageSquarePlus,
  Sparkles,
  Users,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import {
  COMMUNITY_FILTERS,
  COMMUNITY_GROUPS,
  COMMUNITY_POSTS,
  COMMUNITY_TOP_HELPERS,
  COMMUNITY_TRENDING_TOPICS,
  type CommunityFilterId,
  type CommunityPost,
} from '../data/communitySeed'
import { CommunityHero } from '../components/community/CommunityHero'
import { CommunityPostCard } from '../components/community/CommunityPostCard'
import { CommunityComposer } from '../components/community/CommunityComposer'
import type { ComposerPrefill } from '../components/community/communityTypes'

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
  const [activeFilter, setActiveFilter] = useState<CommunityFilterId>('all')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [posts, setPosts] = useState<CommunityPost[]>(COMMUNITY_POSTS)
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerPrefill, setComposerPrefill] = useState<ComposerPrefill | null>(null)
  const forumAnchorRef = useRef<HTMLDivElement | null>(null)

  const filteredPosts = useMemo(() => {
    let next = posts

    if (selectedGroupId) {
      next = next.filter((post) => post.groupId === selectedGroupId)
    }

    if (activeFilter === 'unanswered') {
      next = next.filter((post) => !post.solved)
    } else if (activeFilter === 'helpful') {
      next = [...next].sort((left, right) => right.helpfulCount - left.helpfulCount)
    } else if (activeFilter === 'trending') {
      next = next.filter((post) => post.trending)
    } else if (activeFilter === 'problem') {
      next = next.filter((post) => Boolean(post.linkedProblem))
    }

    return next
  }, [activeFilter, posts, selectedGroupId])

  const selectedGroup = useMemo(
    () => COMMUNITY_GROUPS.find((group) => group.id === selectedGroupId) ?? null,
    [selectedGroupId],
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">
                Community view
              </p>
              <div className="mt-2.5 space-y-1.5">
                {COMMUNITY_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                    className={classNames(
                      'community-rail-link',
                      activeFilter === filter.id && 'community-rail-link-active',
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="community-divider" />

            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">
                  Group shortcuts
                </p>
                {selectedGroupId ? (
                  <button
                    type="button"
                    onClick={() => setSelectedGroupId('')}
                    className="text-[11px] font-medium text-pebble-accent transition hover:text-pebble-text-primary"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <div className="mt-2.5 space-y-1.5">
                {COMMUNITY_GROUPS.slice(0, 6).map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedGroupId(group.id)}
                    className={classNames(
                      'community-rail-link justify-between',
                      selectedGroupId === group.id && 'community-rail-link-active',
                    )}
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">
                    Create from current problem
                  </p>
                  <p className="text-[12.5px] leading-[1.62] text-pebble-text-secondary">
                    Turn a failed run into a forum thread with the problem, language, and testcase context already filled in.
                  </p>
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
                Ask from current problem
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
                  Forum surface
                </div>
                <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">
                  {selectedGroup ? selectedGroup.name : 'Active discussions'}
                </h2>
                <p className="max-w-[68ch] text-[12.85px] leading-[1.62] text-pebble-text-secondary">
                  Pebble’s strongest community story is here: real threads about failed testcases, interview framing, collaborator search, and AI-hint clarification.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className="community-chip-muted border-0">
                  {filteredPosts.length} threads
                </Badge>
                {selectedGroup ? (
                  <Badge className="community-chip-muted border-0">
                    {selectedGroup.membersLabel}
                  </Badge>
                ) : null}
                <Button
                  onClick={() => {
                    setComposerPrefill(null)
                    setComposerOpen(true)
                  }}
                  className="gap-2 rounded-2xl px-4"
                >
                  <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                  Ask community
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {COMMUNITY_TRENDING_TOPICS.slice(0, 4).map((topic) => (
                <span key={topic} className="community-chip-muted inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium">
                  {topic}
                </span>
              ))}
            </div>

            <div className="mt-3.5 grid gap-2.5">
              {filteredPosts.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  groupName={COMMUNITY_GROUPS.find((group) => group.id === post.groupId)?.name ?? 'Community'}
                  href={`/community/thread/${post.id}`}
                />
              ))}
            </div>
          </Card>

          <div className="grid gap-3.5 xl:grid-cols-[1.05fr_0.95fr_1fr]">
            <Card padding="sm" interactive className="community-rail-shell rounded-[24px] px-4 py-3.5">
              <div className="flex items-start gap-3">
                <span className="community-chip-accent inline-flex h-10 w-10 items-center justify-center rounded-2xl">
                  <Users className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Top helpers this week</p>
                  <p className="text-[12.5px] leading-[1.6] text-pebble-text-secondary">A compact proof that the community layer can surface useful peer guidance, not just extra noise.</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-1">
                {COMMUNITY_TOP_HELPERS.map((helper) => (
                  <div key={helper.id} className="community-inset rounded-[18px] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="community-avatar community-avatar-sm">{helper.initials}</span>
                        <div>
                          <p className="text-[13px] font-semibold text-pebble-text-primary">{helper.name}</p>
                          <p className="text-[11px] text-pebble-text-muted">{helper.specialty}</p>
                        </div>
                      </div>
                      <span className="text-[12px] font-medium text-pebble-text-secondary">{helper.helpfulCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="sm" interactive className="community-rail-shell rounded-[24px] px-4 py-3.5">
              <div className="flex items-start gap-3">
                <span className="community-chip-accent inline-flex h-10 w-10 items-center justify-center rounded-2xl">
                  <ChartNoAxesCombined className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Why this matters</p>
                  <p className="text-[12.5px] leading-[1.6] text-pebble-text-secondary">This is the hackathon thesis in product form: Pebble can connect AI guidance with human learning loops.</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  'Students can escalate from AI hints to peer explanations.',
                  'Failed runs become shareable learning moments instead of dead ends.',
                  'The product expands from solo practice into a collaborative ecosystem.',
                ].map((item) => (
                  <div key={item} className="community-inset rounded-[18px] px-3 py-2.5 text-[12.75px] leading-[1.6] text-pebble-text-secondary">
                    {item}
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="sm" interactive className="community-rail-shell rounded-[24px] px-4 py-3.5">
              <div className="flex items-start gap-3">
                <span className="community-chip-accent inline-flex h-10 w-10 items-center justify-center rounded-2xl">
                  <BookOpenText className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Coming next</p>
                  <p className="text-[12.5px] leading-[1.6] text-pebble-text-secondary">Future ecosystem signals that judges can understand without extra explanation.</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="community-inset-strong rounded-[18px] px-3.5 py-3">
                  <p className="text-[13px] font-semibold text-pebble-text-primary">Mentor drop-ins</p>
                  <p className="mt-1 text-[12.25px] leading-[1.6] text-pebble-text-secondary">Future office hours for difficult debugging threads, interview prep, and recovery conversations.</p>
                </div>
                <div className="community-inset rounded-[18px] px-3.5 py-3">
                  <p className="text-[13px] font-semibold text-pebble-text-primary">Student-created problems</p>
                  <p className="mt-1 text-[12.25px] leading-[1.6] text-pebble-text-secondary">Community-written questions, peer-reviewed solutions, and debrief threads can grow naturally from this forum layer.</p>
                </div>
                <Link
                  to="/problems"
                  className="community-chip-muted inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold text-pebble-text-primary"
                >
                  Explore current problem bank
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <CommunityComposer
        groups={COMMUNITY_GROUPS}
        open={composerOpen}
        prefill={composerPrefill}
        onClose={() => setComposerOpen(false)}
        onSubmit={(payload) => {
          const post = buildDemoPost(payload)
          setPosts((current) => [post, ...current])
          setSelectedGroupId(payload.groupId)
          setComposerOpen(false)
        }}
      />
    </section>
  )
}
