import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, scrollToEl } from '../lib/scroll'
import { prefersReducedMotion } from '../lib/env'

let overlay: HTMLDivElement | null = null
let caption: HTMLSpanElement | null = null
let busy = false

/**
 * Section transition for nav jumps: an ink panel wipes up, the page jumps
 * underneath it, and the panel wipes away. ~0.9s, shows a `cd` line.
 */
export function wipeTo(id: string, path: string) {
  const target = document.getElementById(id)
  if (!target) return
  if (!overlay || !caption || prefersReducedMotion()) {
    scrollToEl(target, prefersReducedMotion())
    return
  }
  if (busy) return
  busy = true
  caption.textContent = `$ cd ${path}`
  gsap
    .timeline({ onComplete: () => void (busy = false) })
    .set(overlay, { display: 'grid', transformOrigin: '50% 100%', scaleY: 0 })
    .set(caption, { opacity: 0, y: 12 })
    .to(overlay, { scaleY: 1, duration: 0.42, ease: 'power3.inOut' })
    .to(caption, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, '-=0.12')
    .add(() => {
      scrollToEl(target, true)
      ScrollTrigger.update()
      history.replaceState(null, '', `#${id}`)
    })
    .set(overlay, { transformOrigin: '50% 0%' }, '+=0.12')
    .to(caption, { opacity: 0, duration: 0.15 }, '<')
    .to(overlay, { scaleY: 0, duration: 0.5, ease: 'power3.inOut' }, '<')
    .set(overlay, { display: 'none' })
}

export function Wipe() {
  const ref = useRef<HTMLDivElement>(null)
  const capRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    overlay = ref.current
    caption = capRef.current
    return () => {
      overlay = null
      caption = null
    }
  }, [])
  return (
    <div ref={ref} className="wipe" aria-hidden="true">
      <span ref={capRef} className="wipe-caption" />
    </div>
  )
}
