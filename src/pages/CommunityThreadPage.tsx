import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, MessageSquareMore, Paperclip, Send, Users } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import {
  COMMUNITY_POSTS,
  COMMUNITY_TRENDING_TOPICS,
  findCommunityGroupById,
  findCommunityPostById,
  type CommunityReply,
} from '../data/communitySeed'

function buildDemoReply(body: string): CommunityReply {
  return {
    id: `reply-${Date.now()}`,
    author: 'You',
    initials: 'YO',
    body,
    timestamp: 'just now',
  }
}

export function CommunityThreadPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const thread = threadId ? findCommunityPostById(threadId) : null
  const group = thread ? findCommunityGroupById(thread.groupId) : null
  const [replyBody, setReplyBody] = useState('')
  const [demoReplies, setDemoReplies] = useState<CommunityReply[]>([])
  const [attachmentHint, setAttachmentHint] = useState<string | null>(null)

  const relatedPosts = useMemo(() => {
    if (!thread) {
      return []
    }
    return COMMUNITY_POSTS.filter((post) => post.groupId === thread.groupId && post.id !== thread.id).slice(0, 3)
  }, [thread])

  const activeParticipants = useMemo(() => {
    if (!thread) {
      return 0
    }

    return new Set([thread.author, ...thread.previewReplies.map((reply) => reply.author), ...demoReplies.map((reply) => reply.author)]).size
  }, [demoReplies, thread])

  if (!thread) {
    return <Navigate to="/community" replace />
  }

  const replies = [...thread.previewReplies, ...demoReplies]

  return (
    <section className="page-enter space-y-3 pb-3">
      <Card padding="sm" interactive className="community-hero-shell rounded-[26px] px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Link
              to="/community"
              className="community-chip-muted inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to community
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1.5">
                <MessageSquareMore className="h-3.5 w-3.5" aria-hidden="true" />
                {group?.name ?? 'Discussion'}
              </Badge>
              {thread.solved ? (
                <span className="community-chip-accent inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]">
                  Solved thread
                </span>
              ) : null}
              {thread.trending ? (
                <span className="community-chip-muted inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]">
                  Trending now
                </span>
              ) : null}
            </div>
            <h1 className="max-w-[26ch] text-[1.72rem] font-semibold tracking-[-0.04em] text-pebble-text-primary md:text-[2rem]">
              {thread.title}
            </h1>
            <p className="max-w-[70ch] text-[13.2px] leading-[1.66] text-pebble-text-secondary">
              A collaborative study-room view for one coding discussion: what the learner asked, how peers responded, and how Pebble could turn stuck moments into shared recovery.
            </p>
          </div>

          <div className="grid gap-2 text-[12px] text-pebble-text-secondary md:w-[248px]">
            <div className="community-inset rounded-[18px] px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Room now</span>
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-pebble-text-primary">
                  <Users className="h-3.5 w-3.5 text-pebble-accent" aria-hidden="true" />
                  {activeParticipants} participants
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-[1.55] text-pebble-text-secondary">
                {thread.replyCount + demoReplies.length} replies · {thread.helpfulCount} marked helpful · {thread.timestamp}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_286px]">
        <div className="space-y-3.5">
          <Card padding="sm" interactive className="community-feed-shell rounded-[26px] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Discussion room</p>
                <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">
                  Peer replies around one coding issue
                </h2>
              </div>
              {thread.solved ? (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Marked solved
                </span>
              ) : null}
            </div>

            <div className="mt-3 community-message-stream">
              <div className="community-message-row">
                <span className="community-avatar">{thread.initials}</span>
                <div className="community-message-bubble community-message-bubble-origin rounded-[22px] px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-pebble-text-muted">
                    <span className="font-semibold text-pebble-text-primary">{thread.author}</span>
                    <span>{thread.timestamp}</span>
                    {group ? <span>{group.name}</span> : null}
                    <span className="community-chip-muted inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]">
                      Original question
                    </span>
                  </div>
                  <p className="mt-2.5 text-[13.4px] leading-[1.72] text-pebble-text-secondary">{thread.body}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {thread.tags.map((tag) => (
                      <span key={tag} className="community-chip-muted inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium">
                        {tag}
                      </span>
                    ))}
                    {thread.linkedProblem ? (
                      <span className="community-chip-accent inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium">
                        From problem: {thread.linkedProblem}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {replies.map((reply) => (
                <div key={reply.id} className="community-message-row">
                  <span className="community-avatar community-avatar-sm">{reply.initials}</span>
                  <div
                    className={`community-message-bubble rounded-[20px] px-3.5 py-3 ${reply.helpful ? 'community-message-bubble-helpful' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12.75px] font-semibold text-pebble-text-primary">{reply.author}</p>
                        <p className="mt-0.5 text-[11px] text-pebble-text-muted">
                          {reply.role ?? 'Peer reply'} • {reply.timestamp}
                        </p>
                      </div>
                      {reply.helpful ? (
                        <span className="community-chip-accent inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]">
                          Helpful
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[12.9px] leading-[1.68] text-pebble-text-secondary">{reply.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="sm" interactive className="community-composer-strip rounded-[24px] px-4 py-4">
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Reply to the discussion</p>
                <p className="mt-1 text-[13px] leading-[1.6] text-pebble-text-secondary">
                  Share what Pebble suggested, ask for clarification, or help someone debug the current issue.
                </p>
              </div>

              <textarea
                value={replyBody}
                onChange={(event) => setReplyBody(event.target.value)}
                className="community-input min-h-[104px] w-full rounded-[22px] px-3.5 py-3 text-[14px] leading-[1.65]"
                placeholder="Reply to the discussion…"
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAttachmentHint('Attachment flow is staged for the backend phase of the prototype.')}
                    className="community-chip-muted inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-medium transition hover:border-pebble-accent/35 hover:text-pebble-text-primary"
                  >
                    <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                    Attach
                  </button>
                  <span className="text-[11.5px] text-pebble-text-muted">Local replies append instantly for demo flow.</span>
                </div>

                <Button
                  onClick={() => {
                    if (replyBody.trim().length < 16) {
                      return
                    }
                    setDemoReplies((current) => [...current, buildDemoReply(replyBody.trim())])
                    setReplyBody('')
                    setAttachmentHint(null)
                  }}
                  disabled={replyBody.trim().length < 16}
                  className="gap-2 rounded-2xl px-4"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Send
                </Button>
              </div>

              {attachmentHint ? (
                <div className="community-inset rounded-[18px] px-3 py-2 text-[12px] leading-[1.55] text-pebble-text-secondary">
                  {attachmentHint}
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="space-y-3.5">
          <Card padding="sm" interactive className="community-rail-shell rounded-[24px] px-4 py-3.5">
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Room context</p>
                <h3 className="mt-1 text-[1rem] font-semibold tracking-[-0.02em] text-pebble-text-primary">
                  Why this thread matters in Pebble
                </h3>
              </div>
              <div className="community-inset rounded-[18px] px-3 py-2.5 text-[12.75px] leading-[1.6] text-pebble-text-secondary">
                This room shows the collaborative layer Pebble needs: a learner hits friction, AI narrows the gap, and peers help translate the final confusion into understanding.
              </div>
              <div className="community-inset-strong rounded-[18px] px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-pebble-text-muted">Workflow signal</p>
                <p className="mt-1 text-[12.5px] leading-[1.6] text-pebble-text-secondary">
                  Failed run → Pebble hint → community discussion → cleaner retry.
                </p>
              </div>
            </div>
          </Card>

          <Card padding="sm" interactive className="community-rail-shell rounded-[24px] px-4 py-3.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Keep exploring</p>
              <div className="mt-3 space-y-2">
                {relatedPosts.map((post) => (
                  <Link key={post.id} to={`/community/thread/${post.id}`} className="community-rail-link items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-semibold text-pebble-text-primary">{post.title}</p>
                      <p className="mt-0.5 text-[11px] text-pebble-text-muted">{post.timestamp}</p>
                    </div>
                    <span className="text-[11px] text-pebble-text-secondary">{post.replyCount}</span>
                  </Link>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {COMMUNITY_TRENDING_TOPICS.slice(0, 5).map((topic) => (
                  <span key={topic} className="community-chip-muted inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
