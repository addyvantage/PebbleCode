import { useEffect } from 'react'

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') {
      return
    }

    const html = document.documentElement
    const previousOverflow = document.body.style.overflow
    const previousHtmlOverflow = html.style.overflow

    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      html.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousOverflow
    }
  }, [locked])
}
