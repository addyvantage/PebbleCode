import { type ReactNode, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type AnimatedBorderRingProps = {
  children: ReactNode
  className?: string
  variant?: 'avatar'
}

export function AnimatedBorderRing({
  children,
  className,
  variant = 'avatar',
}: AnimatedBorderRingProps) {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    const syncTheme = () => {
      setIsDark(
        root.classList.contains('theme-dark') ||
          root.classList.contains('dark') ||
          root.getAttribute('data-theme') === 'dark',
      )
    }

    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  const ringGradient = isDark
    ? 'linear-gradient(45deg, rgba(120,170,255,0.95), rgba(80,130,255,0.35), rgba(120,170,255,0.95))'
    : 'linear-gradient(45deg, rgba(59,130,255,0.85), rgba(59,130,255,0.25), rgba(59,130,255,0.85))'

  const glowBlur = isDark ? 22 : 13
  const glowOpacity = isDark ? 0.7 : 0.45
  const ringOpacity = isDark ? 0.9 : 0.72
  const ringRadius = variant === 'avatar' ? 'rounded-full' : 'rounded-xl'

  return (
    <div className={cn('relative isolate inline-flex items-center justify-center', ringRadius, className)}>
      <motion.div
        className={cn('pointer-events-none absolute inset-0', ringRadius)}
        style={{
          backgroundImage: ringGradient,
          backgroundSize: '240% 240%',
          opacity: ringOpacity,
        }}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 16, ease: 'linear', repeat: Infinity }}
      />

      <motion.div
        className={cn('pointer-events-none absolute -inset-[1px]', ringRadius)}
        style={{
          backgroundImage: ringGradient,
          backgroundSize: '240% 240%',
          opacity: glowOpacity,
          filter: `blur(${glowBlur}px)`,
        }}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 16, ease: 'linear', repeat: Infinity }}
      />

      <div className={cn('relative z-10 flex h-full w-full items-center justify-center p-[2px]', ringRadius)}>
        {children}
      </div>
    </div>
  )
}
