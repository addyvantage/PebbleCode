import type { ButtonHTMLAttributes, CSSProperties, PointerEvent, ReactElement, ReactNode } from 'react'
import { cloneElement, isValidElement, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '../../hooks/useTheme'

type InteractiveGradientButtonProps = {
  asChild?: boolean
  className?: string
  ringClassName?: string
  children: ReactNode
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type'>

type CssVars = CSSProperties & {
  '--mx': string
  '--my': string
}

export function InteractiveGradientButton({
  asChild = false,
  className,
  ringClassName,
  children,
  onClick,
  type = 'button',
}: InteractiveGradientButtonProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [cursor, setCursor] = useState({ x: '50%', y: '50%' })

  const styleVars = useMemo<CssVars>(() => ({
    '--mx': cursor.x,
    '--my': cursor.y,
  }), [cursor.x, cursor.y])

  function updateCursor(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top))
    setCursor({ x: `${x}px`, y: `${y}px` })
  }

  function resetCursor(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    setCursor({ x: `${rect.width / 2}px`, y: `${rect.height / 2}px` })
  }

  const ringBase = isDark
    ? 'linear-gradient(90deg, rgba(120,170,255,0.9), rgba(60,120,255,0.9), rgba(160,140,255,0.75))'
    : 'linear-gradient(90deg, rgba(59,130,255,0.9), rgba(120,170,255,0.9), rgba(99,102,241,0.6))'
  const ringSpotlight = isDark
    ? 'radial-gradient(120px circle at var(--mx) var(--my), rgba(170,220,255,0.65), rgba(170,220,255,0) 60%)'
    : 'radial-gradient(140px circle at var(--mx) var(--my), rgba(59,130,255,0.45), rgba(59,130,255,0) 60%)'

  const innerBaseClass = isDark
    ? 'relative z-20 inline-flex items-center justify-center rounded-full px-6 py-2.5 text-[15px] font-medium tracking-tight text-[#EEF5FF] border border-[rgba(157,194,255,0.26)] bg-gradient-to-b from-[#0B1220] via-[#0A1020] to-[#070C16] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_6px_14px_rgba(2,8,23,0.52)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[1px] hover:border-[rgba(170,220,255,0.45)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.13),0_8px_18px_rgba(2,8,23,0.6)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/50'
    : 'relative z-20 inline-flex items-center justify-center rounded-full px-6 py-2.5 text-[15px] font-medium tracking-tight text-[#0B1220] border border-[rgba(59,130,255,0.35)] bg-gradient-to-b from-[#FFFFFF] via-[#F7FAFF] to-[#ECF3FF] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_5px_14px_rgba(37,99,235,0.2)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[1px] hover:border-[rgba(59,130,255,0.52)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_7px_18px_rgba(37,99,235,0.24)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60'

  const wrappedChild = asChild && isValidElement(children)
    ? cloneElement(children as ReactElement<{ className?: string }>, {
      className: cn(innerBaseClass, (children as ReactElement<{ className?: string }>).props.className, className),
    })
    : (
      <button type={type} onClick={onClick} className={cn(innerBaseClass, className)}>
        {children}
      </button>
    )

  return (
    <div
      className={cn(
        'group relative inline-flex w-fit rounded-full p-[2px] transition-transform duration-200',
        ringClassName,
      )}
      style={styleVars}
      onPointerMove={updateCursor}
      onPointerLeave={resetCursor}
      onPointerDown={updateCursor}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-full transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: `${ringSpotlight}, ${ringBase}` }}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -inset-[5px] z-0 rounded-full blur-md transition-opacity duration-200',
          isDark ? 'opacity-[0.45] group-hover:opacity-[0.58]' : 'opacity-[0.25] group-hover:opacity-[0.34]',
        )}
        style={{ background: ringBase }}
      />
      {wrappedChild}
    </div>
  )
}
