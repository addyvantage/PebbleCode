import { useSyncExternalStore } from 'react'
import { safeGetJSON, safeSetJSON } from './safeStorage'

const NOTIFICATIONS_STORAGE_PREFIX = 'pebble.notifications.v1'
const NOTIFICATIONS_EVENT = 'pebble:notifications-updated'
const MAX_NOTIFICATIONS = 50

type NotificationCategory = 'coach' | 'progress' | 'system'

export type NotificationItem = {
  id: string
  category: NotificationCategory
  title: string
  message: string
  createdAt: number
  read: boolean
  actionRoute?: string
  actionLabel?: string
}

export type NotificationsState = {
  scope: string
  items: NotificationItem[]
}

export type PushNotificationInput = {
  category: NotificationCategory
  title: string
  message: string
  actionRoute?: string
  actionLabel?: string
  createdAt?: number
}

const EMPTY_STATE: NotificationsState = {
  scope: 'guest',
  items: [],
}

let notificationsState: NotificationsState = EMPTY_STATE

function inBrowser() {
  return typeof window !== 'undefined'
}

function normalizeScope(userId?: string | null) {
  const compact = (userId ?? '').trim().toLowerCase()
  if (!compact) {
    return 'guest'
  }
  return compact.replace(/[^a-z0-9_-]/g, '') || 'guest'
}

function storageKeyForScope(scope: string) {
  return `${NOTIFICATIONS_STORAGE_PREFIX}.${scope}`
}

function isCategory(value: unknown): value is NotificationCategory {
  return value === 'coach' || value === 'progress' || value === 'system'
}

function readItems(scope: string): NotificationItem[] {
  if (!inBrowser()) {
    return []
  }

  const parsed = safeGetJSON<unknown>(storageKeyForScope(scope), [])
  if (!Array.isArray(parsed)) {
    return []
  }

  const items: NotificationItem[] = []
  for (const item of parsed) {
    if (typeof item !== 'object' || item === null) {
      continue
    }
    const candidate = item as Record<string, unknown>
    if (
      typeof candidate.id !== 'string'
      || !isCategory(candidate.category)
      || typeof candidate.title !== 'string'
      || typeof candidate.message !== 'string'
      || typeof candidate.createdAt !== 'number'
      || typeof candidate.read !== 'boolean'
    ) {
      continue
    }

    items.push({
      id: candidate.id,
      category: candidate.category,
      title: candidate.title,
      message: candidate.message,
      createdAt: candidate.createdAt,
      read: candidate.read,
      actionRoute: typeof candidate.actionRoute === 'string' ? candidate.actionRoute : undefined,
      actionLabel: typeof candidate.actionLabel === 'string' ? candidate.actionLabel : undefined,
    })
  }

  return items
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, MAX_NOTIFICATIONS)
}

function persistItems(scope: string, items: NotificationItem[]) {
  if (!inBrowser()) {
    return
  }
  safeSetJSON(storageKeyForScope(scope), items.slice(0, MAX_NOTIFICATIONS), {
    maxBytes: 28 * 1024,
    silent: true,
  })
}

function emitNotificationsUpdate() {
  if (!inBrowser()) {
    return
  }
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT))
}

function setState(nextState: NotificationsState) {
  notificationsState = nextState
  emitNotificationsUpdate()
}

function ensureHydrated() {
  if (!inBrowser()) {
    return
  }
  if (notificationsState !== EMPTY_STATE) {
    return
  }
  const initialScope = 'guest'
  notificationsState = {
    scope: initialScope,
    items: readItems(initialScope),
  }
}

export function getNotificationsState() {
  ensureHydrated()
  return notificationsState
}

export function subscribeNotifications(listener: () => void) {
  if (!inBrowser()) {
    return () => {}
  }

  ensureHydrated()

  const onUpdated = () => {
    listener()
  }

  const onStorage = (event: StorageEvent) => {
    if (!event.key) {
      return
    }
    const expectedPrefix = `${NOTIFICATIONS_STORAGE_PREFIX}.`
    if (!event.key.startsWith(expectedPrefix)) {
      return
    }

    const current = getNotificationsState()
    if (event.key !== storageKeyForScope(current.scope)) {
      return
    }

    notificationsState = {
      scope: current.scope,
      items: readItems(current.scope),
    }
    listener()
  }

  window.addEventListener(NOTIFICATIONS_EVENT, onUpdated)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(NOTIFICATIONS_EVENT, onUpdated)
    window.removeEventListener('storage', onStorage)
  }
}

export function useNotifications() {
  return useSyncExternalStore(subscribeNotifications, getNotificationsState, getNotificationsState)
}

export function setNotificationScope(userId?: string | null) {
  ensureHydrated()
  const nextScope = normalizeScope(userId)
  if (notificationsState.scope === nextScope) {
    return
  }

  setState({
    scope: nextScope,
    items: readItems(nextScope),
  })
}

export function pushNotification(input: PushNotificationInput) {
  ensureHydrated()

  const createdAt = typeof input.createdAt === 'number' ? input.createdAt : Date.now()
  const nextItem: NotificationItem = {
    id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    category: input.category,
    title: input.title.trim(),
    message: input.message.trim(),
    createdAt,
    read: false,
    actionRoute: input.actionRoute,
    actionLabel: input.actionLabel,
  }

  const nextItems = [nextItem, ...notificationsState.items]
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, MAX_NOTIFICATIONS)

  persistItems(notificationsState.scope, nextItems)
  setState({
    scope: notificationsState.scope,
    items: nextItems,
  })

  return nextItem
}

export function markNotificationRead(id: string) {
  ensureHydrated()
  const nextItems = notificationsState.items.map((item) =>
    item.id === id
      ? {
        ...item,
        read: true,
      }
      : item,
  )

  persistItems(notificationsState.scope, nextItems)
  setState({
    scope: notificationsState.scope,
    items: nextItems,
  })
}

export function markAllNotificationsRead() {
  ensureHydrated()
  const nextItems = notificationsState.items.map((item) => ({
    ...item,
    read: true,
  }))
  persistItems(notificationsState.scope, nextItems)
  setState({
    scope: notificationsState.scope,
    items: nextItems,
  })
}

export function clearNotifications() {
  ensureHydrated()
  persistItems(notificationsState.scope, [])
  setState({
    scope: notificationsState.scope,
    items: [],
  })
}

export function getUnreadNotificationCount() {
  return getNotificationsState().items.reduce((count, item) => count + (item.read ? 0 : 1), 0)
}

export type { NotificationCategory }
