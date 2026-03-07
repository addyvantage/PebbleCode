import { CheckCircle2, ChevronRight, Flame, MessageCircleMore, ThumbsUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { getProductCopy } from '../../i18n/productCopy'
import type { CommunityPost } from '../../data/communitySeed'

type CommunityPostCardProps = {
  post: CommunityPost
  groupName: string
  href: string
}

export function CommunityPostCard({ post, groupName, href }: CommunityPostCardProps) {
  const { lang } = useI18n()
  const copy = getProductCopy(lang).community?.ui

  return (
    <article className="community-post-card text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="community-chip-accent inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]">
              {groupName}
            </span>
            {post.linkedProblem ? (
              <span className="community-chip-muted inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-medium">
                {post.linkedProblem}
              </span>
            ) : null}
            {post.trending ? (
              <span className="community-chip-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium text-pebble-accent">
                <Flame className="h-3 w-3" aria-hidden="true" />
                {copy.trending}
              </span>
            ) : null}
          </div>
          <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-pebble-text-primary">{post.title}</h3>
        </div>

        <span className="community-avatar">{post.initials}</span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-pebble-text-muted">
        <span className="font-medium text-pebble-text-secondary">{post.author}</span>
        <span>•</span>
        <span>{post.timestamp}</span>
        {post.solved ? (
          <>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.solved}
            </span>
          </>
        ) : null}
      </div>

      <p className="mt-2.5 text-[13px] leading-[1.66] text-pebble-text-secondary">{post.body}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {post.tags.map((tag) => (
          <span key={tag} className="community-chip-muted inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-medium">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-[12px] font-medium text-pebble-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <MessageCircleMore className="h-3.5 w-3.5" aria-hidden="true" />
            {post.replyCount} {copy.replies}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
            {post.helpfulCount} {copy.helpful}
          </span>
        </div>

        <Link to={href} className="inline-flex items-center gap-1 text-[12px] font-semibold text-pebble-text-primary transition hover:text-pebble-accent">
          {copy.openThread}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
