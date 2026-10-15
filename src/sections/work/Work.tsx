import { useEffect, useRef } from 'react'
import { projects, work } from '../../content'
import { RevealLines } from '../../components/ui'
import { useMedia, useReducedMotion } from '../../lib/env'
import { ScrollTrigger, gsap, getLenis, getScrollY, scrollToY } from '../../lib/scroll'
import { ProjectCardView } from './cards/ProjectCard'
import { CertCard } from './cards/CertCard'
import { EndCard } from './cards/EndCard'
import styles from './Work.module.css'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Recent projects & certificates.
 *
 * Desktop (fine pointer, ≥ 900px, motion allowed): the section pins and
 * vertical scroll drives the track sideways (GSAP ScrollTrigger). Click-drag
 * and horizontal trackpad swipes move the page scroll, so every input stays
 * in sync with the pin.
 *
 * Touch, narrow screens and reduced motion: a native swipe carousel with
 * scroll-snap. Same progress bar and counter.
 */
export function Work() {
  const reduced = useReducedMotion()
  const wide = useMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)', true)
  const pinned = wide && !reduced
  const touch = !useMedia('(hover: hover) and (pointer: fine)', true)

  const pinRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLOListElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)
  const stRef = useRef<ScrollTrigger | null>(null)
  const total = projects.length

  const setProgress = (p: number) => {
    if (barRef.current) barRef.current.style.transform = `scaleX(${Math.max(0.0001, p)})`
    if (countRef.current) countRef.current.textContent = pad(Math.round(p * (total - 1)) + 1)
  }

  // ── Pinned horizontal scroll ─────────────────────────────
  useEffect(() => {
    const pin = pinRef.current, track = trackRef.current, viewport = viewportRef.current
    if (!pinned || !pin || !track || !viewport) return
    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth)
    const ctx = gsap.context(() => {
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.5,
          invalidateOnRefresh: true,
          onUpdate: (self) => setProgress(self.progress),
        },
      })
      stRef.current = tween.scrollTrigger ?? null
    }, pin)
    // fonts and layout can shift widths after first paint
    const ro = new ResizeObserver(() => ScrollTrigger.refresh())
    ro.observe(track)
    return () => {
      ro.disconnect()
      ctx.revert()
      stRef.current = null
    }
  }, [pinned])

  // ── Native carousel progress ─────────────────────────────
  useEffect(() => {
    const viewport = viewportRef.current
    if (pinned || !viewport) return
    const onScroll = () => {
      const max = viewport.scrollWidth - viewport.clientWidth
      setProgress(max > 0 ? viewport.scrollLeft / max : 0)
    }
    onScroll()
    viewport.addEventListener('scroll', onScroll, { passive: true })
    return () => viewport.removeEventListener('scroll', onScroll)
  }, [pinned])

  // ── Click-drag + horizontal trackpad swipe ───────────────
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    let down = false
    let moved = 0
    let startX = 0
    let start = 0
    let lastX = 0
    let lastT = 0
    let velocity = 0

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      down = true
      moved = 0
      startX = lastX = e.clientX
      lastT = performance.now()
      velocity = 0
      start = pinned ? getScrollY() : viewport.scrollLeft
    }
    const onMove = (e: PointerEvent) => {
      if (!down) return
      const dx = startX - e.clientX
      moved = Math.max(moved, Math.abs(dx))
      if (moved > 4) {
        viewport.dataset.dragging = ''
        viewport.setPointerCapture?.(e.pointerId)
      }
      const now = performance.now()
      velocity = (lastX - e.clientX) / Math.max(1, now - lastT)
      lastX = e.clientX
      lastT = now
      if (pinned) scrollToY(start + dx, true)
      else viewport.scrollLeft = start + dx
    }
    const onUp = (e: PointerEvent) => {
      if (!down) return
      down = false
      delete viewport.dataset.dragging
      viewport.releasePointerCapture?.(e.pointerId)
      // a little inertia
      if (moved > 4 && Math.abs(velocity) > 0.2) {
        const fling = velocity * 260
        if (pinned) scrollToY(getScrollY() + fling)
        else viewport.scrollBy({ left: fling, behavior: 'smooth' })
      }
    }
    // A drag shouldn't click the card it ends on.
    const onClick = (e: MouseEvent) => {
      if (moved > 4) {
        e.preventDefault()
        e.stopPropagation()
        moved = 0
      }
    }
    const onWheel = (e: WheelEvent) => {
      if (!pinned) return
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      const lenis = getLenis()
      if (lenis) lenis.scrollTo(lenis.targetScroll + e.deltaX)
      else window.scrollBy(0, e.deltaX)
    }
    const onDragStart = (e: DragEvent) => e.preventDefault()

    viewport.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    viewport.addEventListener('click', onClick, true)
    viewport.addEventListener('wheel', onWheel, { passive: false })
    viewport.addEventListener('dragstart', onDragStart)
    return () => {
      viewport.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      viewport.removeEventListener('click', onClick, true)
      viewport.removeEventListener('wheel', onWheel)
      viewport.removeEventListener('dragstart', onDragStart)
    }
  }, [pinned])

  // ── Keyboard: bring a focused card into view ──────────────
  useEffect(() => {
    const track = trackRef.current, viewport = viewportRef.current
    if (!track || !viewport) return
    const onFocus = (e: FocusEvent) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>('[data-card]')
      if (!item) return
      if (pinned && stRef.current) {
        const st = stRef.current
        const distance = st.end - st.start
        const inset = parseFloat(getComputedStyle(track).paddingLeft) || 0
        const offset = Math.min(distance, Math.max(0, item.offsetLeft - inset))
        scrollToY(st.start + offset)
      } else {
        const left = item.offsetLeft - (parseFloat(getComputedStyle(track).paddingLeft) || 0)
        viewport.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' })
      }
    }
    track.addEventListener('focusin', onFocus)
    // overflow: clip can't scroll, but guard browsers that fall back to hidden
    const reset = () => {
      if (pinned && viewport.scrollLeft !== 0) viewport.scrollLeft = 0
    }
    viewport.addEventListener('scroll', reset)
    return () => {
      track.removeEventListener('focusin', onFocus)
      viewport.removeEventListener('scroll', reset)
    }
  }, [pinned, reduced])

  return (
    <section id="work" className={styles.work} data-mode={pinned ? 'pinned' : 'native'} aria-labelledby="work-title">
      <div ref={pinRef} className={styles.pin}>
        <div className={`eyebrow ${styles.eyebrow}`} data-reveal>
          <span className="label keep" style={{ color: 'var(--ink)' }}>
            ~/work/
          </span>
          <span className="label">{pad(total)} items</span>
        </div>

        {!pinned && <RevealLines lines={work.heading} className={`h2 wrap ${styles.headingNative}`} id="work-title" />}

        <div ref={viewportRef} className={styles.viewport} data-cursor="Drag" tabIndex={-1}>
          <ol ref={trackRef} className={styles.track}>
            {pinned && (
              <li className={styles.intro}>
                <RevealLines lines={work.heading} className={`h2 ${styles.heading}`} id="work-title" />
              </li>
            )}
            {projects.map((p, i) => {
              if (p.kind === 'cert') return <CertCard key={p.kind} index={i} project={p} touch={touch} reduced={reduced} />
              if (p.kind === 'end') return <EndCard key={p.kind} index={i} project={p} touch={touch} reduced={reduced} />
              return <ProjectCardView key={p.kind} index={i} project={p} touch={touch} reduced={reduced} />
            })}
          </ol>
        </div>

        <div className={`wrap ${styles.progressRow}`}>
          <span className="label">{pinned ? work.hint : 'Swipe'}</span>
          <span className={styles.progress} aria-hidden="true">
            <span ref={barRef} className={styles.progressFill} />
          </span>
          <span className={`label ${styles.counter}`}>
            <span ref={countRef} style={{ color: 'var(--ink)' }}>
              01
            </span>{' '}
            / {pad(total)}
          </span>
        </div>
      </div>
    </section>
  )
}
