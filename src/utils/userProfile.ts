import { storageKeys } from './storageKeys'

export type UserSkillLevel = 'Newbie' | 'Beginner' | 'Intermediate' | 'Professional'
export type UserGoal =
  | 'Learn programming fundamentals'
  | 'Interview prep'
  | 'Data analysis'
  | 'Web dev'
  | 'Automation/scripting'
export type UserBackground = 'Student' | 'Working professional' | 'Career switcher'
export type UserLanguage = 'Python' | 'JavaScript' | 'C++' | 'Java'

export type UserProfile = {
  skillLevel: UserSkillLevel
  goal: UserGoal
  background: UserBackground
  primaryLanguage: UserLanguage
}

export const userSkillLevels: UserSkillLevel[] = [
  'Newbie',
  'Beginner',
  'Intermediate',
  'Professional',
]

export const userGoals: UserGoal[] = [
  'Learn programming fundamentals',
  'Interview prep',
  'Data analysis',
  'Web dev',
  'Automation/scripting',
]

export const userBackgrounds: UserBackground[] = [
  'Student',
  'Working professional',
  'Career switcher',
]

export const userLanguages: UserLanguage[] = ['Python', 'JavaScript', 'C++', 'Java']

function isSkillLevel(value: unknown): value is UserSkillLevel {
  return typeof value === 'string' && userSkillLevels.includes(value as UserSkillLevel)
}

function isGoal(value: unknown): value is UserGoal {
  return typeof value === 'string' && userGoals.includes(value as UserGoal)
}

function isBackground(value: unknown): value is UserBackground {
  return typeof value === 'string' && userBackgrounds.includes(value as UserBackground)
}

function isLanguage(value: unknown): value is UserLanguage {
  return typeof value === 'string' && userLanguages.includes(value as UserLanguage)
}

function isUserProfile(value: unknown): value is UserProfile {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<UserProfile>
  return (
    isSkillLevel(candidate.skillLevel) &&
    isGoal(candidate.goal) &&
    isBackground(candidate.background) &&
    isLanguage(candidate.primaryLanguage)
  )
}

export function getUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(storageKeys.userProfile)
  if (!raw) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    return isUserProfile(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function setUserProfile(profile: UserProfile) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(storageKeys.userProfile, JSON.stringify(profile))
}

export function clearUserProfile() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(storageKeys.userProfile)
}
