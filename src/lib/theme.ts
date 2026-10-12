import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'hp-theme'
const listeners = new Set<() => void>()
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

/** Effective theme: an explicit data-theme wins, otherwise the OS setting. */
export function getTheme(): Theme {
  const attr = document.documentElement.dataset.theme
  if (attr === 'dark' || attr === 'light') return attr
  return darkQuery().matches ? 'dark' : 'light'
}

function notify() {
  listeners.forEach((l) => l())
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* storage can be unavailable (private mode, sandboxed previews) */
  }
  notify()
}

/**
 * Toggles theme with a circular reveal from the click point
 * (View Transitions API), falling back to an instant swap.
 */
export function toggleTheme(origin?: { x: number; y: number }, reduced = false) {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark'
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => unknown
  }
  if (!doc.startViewTransition || reduced) {
    setTheme(next)
    return
  }
  const root = document.documentElement
  if (origin) {
    const r = Math.hypot(
      Math.max(origin.x, window.innerWidth - origin.x),
      Math.max(origin.y, window.innerHeight - origin.y),
    )
    root.style.setProperty('--vt-x', `${origin.x}px`)
    root.style.setProperty('--vt-y', `${origin.y}px`)
    root.style.setProperty('--vt-r', `${r}px`)
  }
  doc.startViewTransition(() => setTheme(next))
}

export function subscribeTheme(cb: () => void) {
  listeners.add(cb)
  const mq = darkQuery()
  mq.addEventListener('change', cb)
  // A host page (or devtools) may flip data-theme on the root directly.
  const mo = new MutationObserver(cb)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => {
    listeners.delete(cb)
    mq.removeEventListener('change', cb)
    mo.disconnect()
  }
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, getTheme, () => 'light')
}
