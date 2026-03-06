import type { HTMLAttributes } from 'react'
import { AlertTriangle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'

type StatusPillVariant = 'fail' | 'warn' | 'success' | 'info'

type StatusPillProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: StatusPillVariant
  showIcon?: boolean
}

const variantClasses: Record<StatusPillVariant, string> = {
  fail:
    'border-amber-400/55 bg-amber-500/12 text-amber-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:border-[#FF7A1A] dark:bg-[#FF7A1A] dark:text-[#0B0F1A] dark:font-medium dark:shadow-[0_8px_18px_rgba(0,0,0,0.28)]',
  warn:
    'border-amber-400/52 bg-amber-500/12 text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:border-amber-300/50 dark:bg-amber-400/18 dark:text-amber-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
  success:
    'border-emerald-400/52 bg-emerald-500/12 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:border-emerald-300/50 dark:bg-emerald-400/18 dark:text-emerald-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
  info:
    'border-blue-400/48 bg-blue-500/12 text-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:border-blue-300/50 dark:bg-blue-400/16 dark:text-blue-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
}

const variantIcons: Record<StatusPillVariant, typeof AlertTriangle> = {
  fail: AlertTriangle,
  warn: TriangleAlert,
  success: CheckCircle2,
  info: Info,
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function StatusPill({
  className,
  variant = 'info',
  showIcon = false,
  children,
  ...props
}: StatusPillProps) {
  const Icon = variantIcons[variant]

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.01em]',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {showIcon ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
      <span>{children}</span>
    </span>
  )
}
