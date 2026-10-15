import { useEffect, useRef } from 'react'
import { projects, work } from '../../content'
import { RevealLines } from '../../components/ui'
import { useMedia, useReducedMotion } from '../../lib/env'
import { ProjectCardView } from './cards/ProjectCard'
import styles from './Work.module.css'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Recent projects & certificates: a native swipe carousel with scroll-snap,
 * a progress bar and a counter.
 */
export function Work() {
  const reduced = useReducedMotion()
  const touch = !useMedia('(hover: hover) and (pointer: fine)', true)

  const viewportRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)
  const total = projects.length

  const setProgress = (p: number) => {
    if (barRef.current) barRef.current.style.transform = `scaleX(${Math.max(0.0001, p)})`
    if (countRef.current) countRef.current.textContent = pad(Math.round(p * (total - 1)) + 1)
  }

  // ── Carousel progress ────────────────────────────────────
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const onScroll = () => {
      const max = viewport.scrollWidth - viewport.clientWidth
      setProgress(max > 0 ? viewport.scrollLeft / max : 0)
    }
    onScroll()
    viewport.addEventListener('scroll', onScroll, { passive: true })
    return () => viewport.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section id="work" className={styles.work} data-mode="native" aria-labelledby="work-title">
      <div className={styles.pin}>
        <div className={`eyebrow ${styles.eyebrow}`} data-reveal>
          <span className="label keep" style={{ color: 'var(--ink)' }}>
            ~/work/
          </span>
          <span className="label">{pad(total)} items</span>
        </div>

        <RevealLines lines={work.heading} className={`h2 wrap ${styles.headingNative}`} id="work-title" />

        <div ref={viewportRef} className={styles.viewport} tabIndex={-1}>
          <ol className={styles.track}>
            {projects.map((p, i) => (
              <ProjectCardView key={p.kind} index={i} project={p} touch={touch} reduced={reduced} />
            ))}
          </ol>
        </div>

        <div className={`wrap ${styles.progressRow}`}>
          <span className="label">Swipe</span>
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
