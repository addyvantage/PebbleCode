import { safeClearPrefix, safeGetItem, safeRemoveItem } from '../lib/safeStorage'

export const storageKeys = {
  theme: 'pebble.theme.v1',
  pagePrefs: 'pebble.pagePrefs.v1',
  demoMode: 'pebble_demo_mode',
  memory: 'pebble_memory_v1',
  sessionInsights: 'pebble_session_insights',
  taskProgress: 'pebble_task_progress_v1',
  userProfile: 'pebble_user_profile',
  userName: 'pebble_user_name',
  personaSummary: 'pebble_persona_summary',
  pebbleUserState: 'pebbleUserState',
} as const

const localUserKeys = [
  storageKeys.memory,
  storageKeys.sessionInsights,
  storageKeys.taskProgress,
  storageKeys.userProfile,
  storageKeys.userName,
  storageKeys.personaSummary,
  storageKeys.pebbleUserState,
] as const

const appKeys = [
  storageKeys.theme,
  storageKeys.pagePrefs,
  storageKeys.demoMode,
  ...localUserKeys,
] as const

export type LocalUserProfile = {
  name: string
  personaSummary: string
}

export function clearLocalStorageKeys(keys: readonly string[]) {
  for (const key of keys) {
    safeRemoveItem(key)
  }
}

export function clearAppLocalData() {
  clearLocalStorageKeys(appKeys)
}

export function clearLocalUserData() {
  clearLocalStorageKeys(localUserKeys)
}

function clearSessionStoragePrefix(prefix: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index)
      if (key && key.startsWith(prefix)) {
        window.sessionStorage.removeItem(key)
      }
    }
  } catch {
    // no-op
  }
}

export function clearAllPebbleLocalData() {
  // Clear every Pebble-scoped key, including solved status, editor drafts, streak/analytics,
  // auth cache, and legacy keys like "pebbleUserState" / "pebble_demo_mode".
  safeClearPrefix('pebble')
  clearSessionStoragePrefix('pebble')
}

export function getLocalUserProfile(): LocalUserProfile {
  if (typeof window === 'undefined') {
    return {
      name: '',
      personaSummary: '',
    }
  }

  const name = safeGetItem(storageKeys.userName) || ''
  const personaSummary = safeGetItem(storageKeys.personaSummary) || ''

  return {
    name,
    personaSummary,
  }
}
