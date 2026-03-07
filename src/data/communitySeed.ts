import type { LanguageCode } from '../i18n/languages'
import { getProductCopy } from '../i18n/productCopy'

export type CommunityGroup = {
  id: string
  name: string
  description: string
  icon: 'bug' | 'code' | 'database' | 'briefcase' | 'users' | 'rocket' | 'palette' | 'blocks' | 'file' | 'sparkles'
  membersLabel: string
  lastActivity: string
  tags: string[]
  featured?: boolean
}

export type CommunityReply = {
  id: string
  author: string
  role?: string
  initials: string
  body: string
  helpful?: boolean
  timestamp: string
}

export type CommunityPost = {
  id: string
  groupId: string
  title: string
  author: string
  initials: string
  timestamp: string
  body: string
  replyCount: number
  helpfulCount: number
  solved: boolean
  trending?: boolean
  tags: string[]
  linkedProblem?: string
  previewReplies: CommunityReply[]
}

export type CommunityStat = {
  label: string
  value: string
  detail: string
}

export type CommunityContributor = {
  id: string
  name: string
  initials: string
  specialty: string
  helpfulCount: number
}

export type CommunityFilterId = 'all' | 'unanswered' | 'helpful' | 'trending' | 'problem'

export function getCommunityGroups(lang: LanguageCode): CommunityGroup[] {
  return getProductCopy(lang).community?.groups ?? []
}

export function getCommunityPosts(lang: LanguageCode): CommunityPost[] {
  return getProductCopy(lang).community?.posts ?? []
}

export function getCommunityTrendingTopics(lang: LanguageCode): string[] {
  return getProductCopy(lang).community?.trendingTopics ?? []
}

export function getCommunityTopHelpers(lang: LanguageCode): CommunityContributor[] {
  return getProductCopy(lang).community?.topHelpers ?? []
}

export function getCommunityFilters(lang: LanguageCode): Array<{ id: CommunityFilterId; label: string }> {
  return getProductCopy(lang).community?.filters ?? []
}

export function findCommunityGroupById(groupId: string, lang: LanguageCode) {
  return getCommunityGroups(lang).find((group) => group.id === groupId) ?? null
}

export function findCommunityPostById(postId: string, lang: LanguageCode) {
  return getCommunityPosts(lang).find((post) => post.id === postId) ?? null
}
