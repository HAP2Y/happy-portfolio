import { useEffect, useRef } from 'react'
import { projects, work } from '../../content'
import { RevealLines } from '../../components/ui'
import { useMedia, useReducedMotion } from '../../lib/env'
import { ScrollTrigger, gsap } from '../../lib/scroll'
import { ProjectCardView } from './cards/ProjectCard'
import styles from './Work.module.css'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Recent projects & certificates.
 *
 * Desktop (fine pointer, ≥ 900px, motion allowed): the section pins and
 * vertical scroll drives the track sideways (GSAP ScrollTrigger).
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
      gsap.to(track, {
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
    }, pin)
    // fonts and layout can shift widths after first paint
    const ro = new ResizeObserver(() => ScrollTrigger.refresh())
    ro.observe(track)
    return () => {
      ro.disconnect()
      ctx.revert()
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

        <div ref={viewportRef} className={styles.viewport} tabIndex={-1}>
          <ol ref={trackRef} className={styles.track}>
            {pinned && (
              <li className={styles.intro}>
                <RevealLines lines={work.heading} className={`h2 ${styles.heading}`} id="work-title" />
              </li>
            )}
            {projects.map((p, i) => (
              <ProjectCardView key={p.kind} index={i} project={p} touch={touch} reduced={reduced} />
            ))}
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
