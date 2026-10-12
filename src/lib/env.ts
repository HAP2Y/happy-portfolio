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

/**
 * Rough "is this a phone / weak laptop" check. Used to cut cube count,
 * world density, antialiasing and the sea plane.
 */
export function isLowPower(): boolean {
  // Manual override for testing: ?quality=low or ?quality=high
  const forced = new URLSearchParams(window.location.search).get('quality')
  if (forced === 'low') return true
  if (forced === 'high') return false
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  const cores = nav.hardwareConcurrency ?? 8
  const memory = nav.deviceMemory ?? 8
  return (
    !isFinePointer() ||
    window.innerWidth < 768 ||
    cores <= 4 ||
    memory <= 4 ||
    Boolean(nav.connection?.saveData)
  )
}

let webglCache: boolean | null = null
export function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache
  try {
    const c = document.createElement('canvas')
    webglCache = Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    webglCache = false
  }
  return webglCache
}

/** Reads a design token (CSS custom property) from :root. */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
