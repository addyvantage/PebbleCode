import { storageKeys } from './storageKeys'
import { safeGetItem, safeSetItem } from '../lib/safeStorage'

const DEMO_MODE_EVENT = 'pebble:demo-mode'

export function getDemoMode() {
  if (typeof window === 'undefined') {
    return false
  }

  return safeGetItem(storageKeys.demoMode) === '1'
}

export function setDemoMode(isEnabled: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  safeSetItem(storageKeys.demoMode, isEnabled ? '1' : '0', { maxBytes: 32, silent: true })
  window.dispatchEvent(
    new CustomEvent<boolean>(DEMO_MODE_EVENT, {
      detail: isEnabled,
    }),
  )
}

export function subscribeDemoMode(listener: (isEnabled: boolean) => void) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleEvent = (event: Event) => {
    const demoEvent = event as CustomEvent<boolean>
    listener(demoEvent.detail)
  }

  window.addEventListener(DEMO_MODE_EVENT, handleEvent)

  return () => {
    window.removeEventListener(DEMO_MODE_EVENT, handleEvent)
  }
}
