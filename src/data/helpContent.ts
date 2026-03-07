import {
  BookOpen,
  Bot,
  Brain,
  Compass,
  FileText,
  Globe,
  Lightbulb,
  MessageSquareText,
  Sparkles,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import type { LanguageCode } from '../i18n/languages'
import { getProductCopy } from '../i18n/productCopy'

export type HelpFaqItem = {
  question: string
  answer: string
}

export type HelpFaqGroup = {
  id: string
  label: string
  title: string
  description: string
  icon: LucideIcon
  items: HelpFaqItem[]
}

export type HelpStep = {
  id: string
  label: string
  title: string
  body: string
  detail: string
  icon: LucideIcon
  chips?: string[]
}

export type HelpQuickPathStep = {
  title: string
  detail: string
}

const HELP_ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Bot,
  Workflow,
  FileText,
  Brain,
  Compass,
  BookOpen,
  Lightbulb,
  Globe,
  MessageSquareText,
}

export function getFaqGroups(lang: LanguageCode): HelpFaqGroup[] {
  const groups = getProductCopy(lang).help?.faq?.groups ?? []
  return groups.map((group: any) => ({
    ...group,
    icon: HELP_ICONS[group.icon] ?? Sparkles,
  }))
}

export function getHowToUseSteps(lang: LanguageCode): HelpStep[] {
  const steps = getProductCopy(lang).help?.howTo?.steps ?? []
  return steps.map((step: any) => ({
    ...step,
    icon: HELP_ICONS[step.icon] ?? Sparkles,
  }))
}

export function getHowToUseQuickPath(lang: LanguageCode): HelpQuickPathStep[] {
  return getProductCopy(lang).help?.howTo?.quickPath ?? []
}

export function getHowToUseNotes(lang: LanguageCode): string[] {
  return getProductCopy(lang).help?.howTo?.prototypeNotesItems ?? []
}
