import { useSyncExternalStore } from 'react'

/** Media-query hook that re-renders when the query flips. */
export function useMedia(query: string, serverFallback = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => serverFallback,
  )
}

export const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'
export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

export const useReducedMotion = () => useMedia(REDUCED_QUERY)
export const useFinePointer = () => useMedia(FINE_POINTER_QUERY, true)

export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_QUERY).matches
}

export function isFinePointer(): boolean {
  return window.matchMedia(FINE_POINTER_QUERY).matches
}

/** Reads a design token (CSS custom property) from :root. */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
