import { createPortal } from 'react-dom'
import { useTheme } from '../../hooks/useTheme'
import { buttonClass } from '../ui/buttonStyles'
import { useI18n } from '../../i18n/useI18n'

type ProfileMenuProps = {
  open: boolean
  anchorRect: DOMRect | null
  userName: string
  userEmail: string
  userBio: string
  avatarUrl: string | null
  isGuest?: boolean
  isAdmin?: boolean
  onSignOut: () => void
  onRequestClose: () => void
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function ProfileMenu({
  open,
  anchorRect,
  userName,
  userEmail,
  userBio,
  avatarUrl,
  isGuest,
  isAdmin,
  onSignOut,
  onRequestClose,
}: ProfileMenuProps) {
  const { theme } = useTheme()
  const { t, isRTL } = useI18n()
  const dark = theme === 'dark'

  if (!open || !anchorRect || typeof window === 'undefined') {
    return null
  }

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const viewportPadding = 8
  const panelWidth = Math.min(320, viewportWidth - viewportPadding * 2)
  const panelHeightEstimate = 280
  const belowTop = anchorRect.bottom + 8
  const aboveTop = anchorRect.top - panelHeightEstimate - 8
  const top =
    belowTop + panelHeightEstimate <= viewportHeight - viewportPadding
      ? belowTop
      : clamp(aboveTop, viewportPadding, viewportHeight - panelHeightEstimate - viewportPadding)
  const left = clamp(
    anchorRect.right - panelWidth,
    viewportPadding,
    viewportWidth - panelWidth - viewportPadding,
  )

  const shellClass = dark
    ? 'border border-[rgba(154,172,210,0.34)] shadow-[0_24px_60px_rgba(2,8,23,0.48)]'
    : 'border border-pebble-border/25 shadow-[0_12px_40px_rgba(55,72,110,0.18)]'

  const metaTextClass = dark ? 'text-[rgba(191,205,232,0.86)]' : 'text-pebble-text-muted'
  const titleTextClass = dark ? 'text-[rgba(241,247,255,0.98)]' : 'text-pebble-text-primary'
  const secondaryTextClass = dark ? 'text-[rgba(207,219,242,0.92)]' : 'text-pebble-text-muted'
  const dividerClass = dark ? 'border-[rgba(160,176,208,0.28)]' : 'border-pebble-border/22'
  const noteSurfaceClass = dark
    ? 'border-[rgba(160,176,208,0.24)] bg-[rgba(255,255,255,0.04)]'
    : 'border-pebble-border/22 bg-pebble-overlay/[0.05]'
  const actionClass = dark
    ? 'w-full rounded-[12px] border border-[rgba(160,176,208,0.30)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.05)_100%)] text-[rgba(233,242,255,0.96)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-[rgba(170,190,225,0.48)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.13)_0%,rgba(255,255,255,0.08)_100%)] hover:text-[rgba(245,250,255,1)]'
    : `${buttonClass('secondary', 'sm')} w-full`

  const displayName = userName || 'Set username'

  return createPortal(
    <div
      data-profile-menu-root="true"
      role="menu"
      className={`fixed z-[100] isolate overflow-hidden rounded-[14px] backdrop-blur-xl ${shellClass}`}
      style={{ top, left, width: panelWidth }}
    >
      {/* Base layer */}
      <div className={`absolute inset-0 ${dark ? 'bg-pebble-panel' : 'bg-pebble-panel'}`} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: dark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 100%)'
            : 'linear-gradient(180deg, rgba(241,245,252,0.98) 0%, rgba(228,234,246,0.94) 100%)',
        }}
      />

      <div className="relative p-4 space-y-3">

        {/* ── Identity block ── */}
        <div className="flex items-center gap-3">
          {/* Mini avatar — clean circle, image if available */}
          <div
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border overflow-hidden"
            style={{
              borderColor: dark ? 'rgba(180,195,230,0.18)' : 'rgba(55,72,110,0.16)',
              background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.90)',
              boxShadow: dark
                ? '0 0 10px 3px rgba(96,165,250,0.20)'
                : '0 0 10px 3px rgba(29,78,216,0.10)',
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>

          {/* Name + email */}
          <div className={`min-w-0 flex-1 ${isRTL ? 'rtlText' : ''}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.07em] ${metaTextClass}`}>
              {t('profile.signedInAs')}
            </p>
            <p className={`mt-0.5 truncate text-[14px] font-semibold leading-5 ${titleTextClass}`}>
              {displayName}
            </p>
            {userEmail && (
              <p className={`truncate text-[11.5px] leading-4 ${secondaryTextClass}`}>
                {userEmail}
              </p>
            )}
          </div>

          {/* Role badge */}
          {isGuest && (
            <span className="shrink-0 rounded-full border border-pebble-border/35 bg-pebble-overlay/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-pebble-text-muted">
              Guest
            </span>
          )}
          {isAdmin && !isGuest && (
            <span className="shrink-0 rounded-full border border-pebble-accent/40 bg-pebble-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-pebble-accent">
              Admin
            </span>
          )}
        </div>

        {/* ── Bio (only when present) ── */}
        {userBio && (
          <div className={`rounded-[10px] border px-3 py-2.5 ${noteSurfaceClass}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.06em] ${metaTextClass}`}>
              {t('profile.bio')}
            </p>
            <p className={`mt-1 text-[12.5px] leading-5 ${secondaryTextClass} ${isRTL ? 'rtlText' : ''}`}>
              {userBio}
            </p>
          </div>
        )}

        <div className={`border-t ${dividerClass}`} />

        {/* ── Actions ── */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => {
              onRequestClose()
              window.location.href = '/profile'
            }}
            className={actionClass}
          >
            {t('profile.viewProfile')}
          </button>

          <button
            type="button"
            onClick={() => {
              onSignOut()
              onRequestClose()
            }}
            className={actionClass}
          >
            {t('profile.signOut')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
