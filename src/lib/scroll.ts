import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

/**
 * Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger and Lenis
 * share one clock. Skipped entirely for reduced motion.
 */
export function initSmoothScroll(): () => void {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 })
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

export const getLenis = () => lenis

export function getScrollY(): number {
  return lenis ? lenis.scroll : window.scrollY
}

/** Where a scroll is heading (Lenis target while animating). */
export function getTargetScrollY(): number {
  return lenis ? lenis.targetScroll : window.scrollY
}

export function scrollToY(y: number, immediate = false) {
  if (lenis) lenis.scrollTo(y, { immediate, force: true })
  else window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' })
}

export function scrollToEl(el: HTMLElement, immediate = false) {
  const y = el.getBoundingClientRect().top + window.scrollY
  scrollToY(y, immediate)
}

export { gsap, ScrollTrigger }
