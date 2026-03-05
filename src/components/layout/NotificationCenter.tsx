import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Bot, CheckCheck, Rocket, User, X } from 'lucide-react'
import {
  clearNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  useNotifications,
  type NotificationCategory,
  type NotificationItem,
} from '../../lib/notificationsStore'
import { useTheme } from '../../hooks/useTheme'

export type NotificationCenterProps = {
  open: boolean
  onClose: () => void
}

type NotificationFilter = 'all' | NotificationCategory

const FILTERS: Array<{ id: NotificationFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'coach', label: 'Coach' },
  { id: 'progress', label: 'Progress' },
  { id: 'system', label: 'System' },
]

function formatRelativeTime(timestamp: number) {
  const deltaSeconds = Math.round((timestamp - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  const absSeconds = Math.abs(deltaSeconds)
  if (absSeconds < 60) {
    return rtf.format(deltaSeconds, 'second')
  }
  const minutes = Math.round(deltaSeconds / 60)
  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, 'minute')
  }
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) {
    return rtf.format(hours, 'hour')
  }
  const days = Math.round(hours / 24)
  return rtf.format(days, 'day')
}

function categoryIcon(category: NotificationCategory) {
  if (category === 'coach') {
    return Bot
  }
  if (category === 'progress') {
    return Rocket
  }
  return User
}

function NotificationRow({
  item,
  onSelect,
}: {
  item: NotificationItem
  onSelect: (item: NotificationItem) => void
}) {
  const Icon = categoryIcon(item.category)

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`group flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition duration-200 ${
        item.read
          ? 'border-pebble-border/25 bg-pebble-overlay/[0.03] hover:border-pebble-border/40 hover:bg-pebble-overlay/[0.08]'
          : 'border-pebble-accent/35 bg-pebble-accent/10 shadow-[0_8px_24px_rgba(37,99,235,0.14)] hover:border-pebble-accent/45 hover:bg-pebble-accent/14'
      }`}
    >
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-pebble-border/35 bg-pebble-overlay/[0.08] text-pebble-text-secondary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="truncate text-[13px] font-semibold text-pebble-text-primary">{item.title}</span>
          <span className="shrink-0 text-[11px] text-pebble-text-muted">{formatRelativeTime(item.createdAt)}</span>
        </span>
        <span className="mt-1 line-clamp-1 block text-[12px] text-pebble-text-secondary">{item.message}</span>
      </span>
    </button>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-pebble-border/25 bg-pebble-overlay/[0.05] px-4 py-8 text-center">
      <p className="text-sm font-medium text-pebble-text-primary">You&apos;re all caught up.</p>
      <p className="mt-1 text-xs text-pebble-text-secondary">Run a solution or start a unit to see updates.</p>
    </div>
  )
}

function PanelContent({
  filter,
  onFilterChange,
  onClose,
  showClose,
}: {
  filter: NotificationFilter
  onFilterChange: (filter: NotificationFilter) => void
  onClose: () => void
  showClose: boolean
}) {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { items } = useNotifications()

  const unreadCount = useMemo(
    () => items.reduce((count, item) => count + (item.read ? 0 : 1), 0),
    [items],
  )

  const filteredItems = useMemo(() => {
    if (filter === 'all') {
      return items
    }
    return items.filter((item) => item.category === filter)
  }, [filter, items])

  function handleSelect(item: NotificationItem) {
    if (!item.read) {
      markNotificationRead(item.id)
    }
    if (item.actionRoute) {
      navigate(item.actionRoute)
    }
    onClose()
  }

  return (
    <div
      className={`flex max-h-[min(78vh,560px)] min-h-[420px] w-full flex-col rounded-[20px] border px-3 py-3 shadow-[0_24px_70px_rgba(2,8,23,0.34)] backdrop-blur-xl ${
        theme === 'dark'
          ? 'border-pebble-border/40 bg-[rgba(10,16,30,0.92)]'
          : 'border-pebble-border/35 bg-[rgba(244,248,255,0.94)]'
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-pebble-border/35 bg-pebble-overlay/[0.08] text-pebble-text-secondary">
            <Bell className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-pebble-text-primary">Notifications</p>
            <p className="text-[11px] text-pebble-text-muted">{unreadCount} unread</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => markAllNotificationsRead()}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-pebble-border/35 bg-pebble-overlay/[0.08] px-2.5 text-[11px] font-medium text-pebble-text-secondary transition hover:border-pebble-border/55 hover:bg-pebble-overlay/[0.14] hover:text-pebble-text-primary"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Mark all
          </button>
          <button
            type="button"
            onClick={() => clearNotifications()}
            className="inline-flex h-8 rounded-lg border border-pebble-border/35 bg-pebble-overlay/[0.08] px-2 text-[11px] font-medium text-pebble-text-secondary transition hover:border-pebble-border/55 hover:bg-pebble-overlay/[0.14] hover:text-pebble-text-primary"
          >
            Clear
          </button>
          {showClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-pebble-border/35 bg-pebble-overlay/[0.08] text-pebble-text-secondary transition hover:border-pebble-border/55 hover:bg-pebble-overlay/[0.14] hover:text-pebble-text-primary"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 rounded-xl border border-pebble-border/30 bg-pebble-overlay/[0.06] p-1">
        {FILTERS.map((entry) => {
          const active = filter === entry.id
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onFilterChange(entry.id)}
              className={`inline-flex h-8 flex-1 items-center justify-center rounded-lg px-2 text-[12px] font-medium transition ${
                active
                  ? 'border border-pebble-accent/40 bg-pebble-accent/15 text-pebble-text-primary shadow-[0_8px_20px_rgba(37,99,235,0.16)]'
                  : 'text-pebble-text-secondary hover:bg-pebble-overlay/[0.12] hover:text-pebble-text-primary'
              }`}
            >
              {entry.label}
            </button>
          )
        })}
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-2">
          {filteredItems.length === 0
            ? <EmptyState />
            : filteredItems.map((item) => (
              <NotificationRow key={item.id} item={item} onSelect={handleSelect} />
            ))}
        </div>
      </div>
    </div>
  )
}

export function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const [filter, setFilter] = useState<NotificationFilter>('all')

  if (!open) {
    return null
  }

  return (
    <>
      <div
        className="absolute right-0 top-[calc(100%+0.65rem)] z-[180] hidden w-[380px] lg:block"
        data-notification-center-root="true"
      >
        <PanelContent
          filter={filter}
          onFilterChange={setFilter}
          onClose={onClose}
          showClose={false}
        />
      </div>

      <div
        className="fixed inset-0 z-[185] lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Notifications panel"
        data-notification-center-root="true"
      >
        <button
          type="button"
          aria-label="Close notifications"
          className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
          onClick={onClose}
        />
        <div className="absolute inset-x-0 bottom-0 max-h-[84vh] rounded-t-[24px] border border-pebble-border/35 bg-pebble-panel/96 p-3 shadow-[0_-16px_48px_rgba(2,8,23,0.38)]">
          <PanelContent
            filter={filter}
            onFilterChange={setFilter}
            onClose={onClose}
            showClose
          />
        </div>
      </div>
    </>
  )
}
