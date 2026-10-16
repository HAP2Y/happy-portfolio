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
  if (isSoftwareRenderer()) return true
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
let softwareCache = false

/** WebGL support, plus a note of whether the GPU is a software rasteriser. */
export function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache
  // Manual override for testing the typographic fallback: ?webgl=0
  if (new URLSearchParams(window.location.search).get('webgl') === '0') return (webglCache = false)
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    webglCache = Boolean(gl)
    if (gl) {
      const info = gl.getExtension('WEBGL_debug_renderer_info')
      const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '')
      softwareCache = /swiftshader|llvmpipe|software|basic render/i.test(renderer)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    webglCache = false
  }
  return webglCache
}

/**
 * True when WebGL runs on the CPU (no GPU acceleration; also most CI and
 * audit machines, e.g. PageSpeed Insights).
 */
export function isSoftwareRenderer(): boolean {
  hasWebGL()
  return softwareCache
}

/**
 * Whether to run the WebGL scenes. On a software rasteriser, creating the
 * context and linking shaders blocks the main thread for ~1–2 s and frames
 * crawl, so those visitors get the typographic name instead.
 * `?quality=high` or `?quality=low` forces the scene on for testing.
 */
export function use3D(): boolean {
  const forced = new URLSearchParams(window.location.search).get('quality')
  if (forced === 'high' || forced === 'low') return hasWebGL()
  return hasWebGL() && !isSoftwareRenderer()
}

/** Reads a design token (CSS custom property) from :root. */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
