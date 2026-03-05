import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type NoiseBackgroundProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  containerClassName?: string
  gradientColors?: [string, string, string] | string[]
}

const DEFAULT_GRADIENT: [string, string, string] = [
  'rgb(59, 130, 246)',
  'rgb(147, 197, 253)',
  'rgb(37, 99, 235)',
]

export function NoiseBackground({
  children,
  className,
  containerClassName,
  gradientColors = DEFAULT_GRADIENT,
  ...props
}: NoiseBackgroundProps) {
  const [c1, c2, c3] = (gradientColors.length >= 3
    ? [gradientColors[0], gradientColors[1], gradientColors[2]]
    : DEFAULT_GRADIENT) as [string, string, string]

  return (
    <div
      className={cn('relative isolate overflow-hidden', containerClassName)}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-85 dark:opacity-75"
        style={{
          backgroundImage: `linear-gradient(130deg, ${c1}, ${c2}, ${c3}, ${c1})`,
          backgroundSize: '260% 260%',
          animation: 'noise-gradient-shift 16s ease infinite',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-[0.10] dark:opacity-[0.14]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.35) 0.6px, transparent 0.6px)',
          backgroundSize: '3px 3px',
          mixBlendMode: 'soft-light',
        }}
      />
      <div className={cn('relative z-10', className)}>{children}</div>
    </div>
  )
}
