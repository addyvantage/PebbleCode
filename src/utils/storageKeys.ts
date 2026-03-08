import { safeClearPrefix, safeGetItem, safeRemoveItem } from '../lib/safeStorage'
import { clearAnalyticsState } from '../lib/analyticsStore'
import { clearSolvedProblems } from '../lib/solvedProblemsStore'
import { clearRecentActivity } from '../lib/recentStore'

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
  // User intent for this action is a full local reset, not just Pebble-prefixed keys.
  // Clear full origin storage first; if blocked, fall back to known prefixes.
  if (typeof window === 'undefined') {
    return
  }

  let localCleared = false
  try {
    window.localStorage.clear()
    localCleared = true
  } catch {
    // no-op
  }
  if (!localCleared) {
    safeClearPrefix(['pebble', 'CognitoIdentityServiceProvider'])
  }

  let sessionCleared = false
  try {
    window.sessionStorage.clear()
    sessionCleared = true
  } catch {
    // no-op
  }
  if (!sessionCleared) {
    clearSessionStoragePrefix('pebble')
    clearSessionStoragePrefix('CognitoIdentityServiceProvider')
  }
}

function clearCookiesForCurrentOrigin() {
  if (typeof document === 'undefined') {
    return
  }

  try {
    const cookieRows = document.cookie ? document.cookie.split(';') : []
    const host = window.location.hostname
    const domainParts = host.split('.').filter(Boolean)
    const domainVariants = ['']
    for (let index = 0; index < domainParts.length - 1; index += 1) {
      domainVariants.push(`.${domainParts.slice(index).join('.')}`)
    }

    for (const row of cookieRows) {
      const [namePart] = row.split('=')
      const name = namePart?.trim()
      if (!name) {
        continue
      }
      for (const domain of domainVariants) {
        const domainAttr = domain ? `; domain=${domain}` : ''
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainAttr}`
      }
    }
  } catch {
    // no-op
  }
}

function deleteIndexedDbDatabase(name: string) {
  return new Promise<void>((resolve) => {
    try {
      const request = window.indexedDB.deleteDatabase(name)
      request.onsuccess = () => resolve()
      request.onerror = () => resolve()
      request.onblocked = () => resolve()
    } catch {
      resolve()
    }
  })
}

async function clearIndexedDbDatabases() {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return
  }

  try {
    const indexedDbFactory = window.indexedDB as IDBFactory & {
      databases?: () => Promise<Array<{ name?: string }>>
    }
    if (typeof indexedDbFactory.databases === 'function') {
      const databases = await indexedDbFactory.databases()
      const names = databases
        .map((database) => database?.name)
        .filter((name): name is string => typeof name === 'string' && name.length > 0)

      await Promise.allSettled(names.map((name) => deleteIndexedDbDatabase(name)))
      return
    }
  } catch {
    // no-op
  }

  // Fallback for browsers without indexedDB.databases support.
  const knownDatabaseNames = [
    'localforage',
    'firebaseLocalStorageDb',
    'workbox-expiration',
    'workbox-precache-v2',
    'pebble',
  ]
  await Promise.allSettled(knownDatabaseNames.map((name) => deleteIndexedDbDatabase(name)))
}

async function clearCacheStorage() {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return
  }

  try {
    const cacheKeys = await window.caches.keys()
    await Promise.allSettled(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)))
  } catch {
    // no-op
  }
}

export async function clearAllPebbleLocalDataDeep() {
  clearAllPebbleLocalData()
  // Ensure in-memory stores are reset immediately in the active tab as well.
  clearAnalyticsState()
  clearSolvedProblems()
  clearRecentActivity()
  clearCookiesForCurrentOrigin()

  await Promise.allSettled([
    clearIndexedDbDatabases(),
    clearCacheStorage(),
  ])
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
