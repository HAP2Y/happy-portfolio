import { useEffect, useRef, useState } from 'react'
import { triage } from '../../../content'
import styles from './Cards.module.css'

/**
 * Card 03. A messy pile of tickets sorts itself into queues, and the
 * manual-triage bar drops from 100% to 60%.
 */
const TICKET_H = 30
const GAP = 8

// deterministic "messy pile" offsets
const PILE = triage.tickets.map((_, i) => ({
  fx: Math.sin(i * 2.1) * 0.2, // fraction of stage width
  fy: i / triage.tickets.length, // fraction of the pile height
  rot: Math.sin(i * 3.3) * 9,
}))

export function TriageStage({ active, reduced }: { active: boolean; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 360, h: 220 })
  const sorted = reduced || active
  const [load, setLoad] = useState(reduced ? triage.to : triage.from)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // count the bar label in step with its width transition
  useEffect(() => {
    if (reduced) {
      setLoad(triage.to)
      return
    }
    const from = load
    const to = active ? triage.to : triage.from
    if (from === to) return
    const t0 = performance.now()
    const dur = 900
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0 - (active ? 350 : 0)) / dur)
      const e = p <= 0 ? 0 : 1 - Math.pow(1 - p, 3)
      setLoad(Math.round(from + (to - from) * e))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, reduced])

  const cols = triage.columns.length
  const boardH = size.h - 46
  const colW = (size.w - GAP * (cols - 1)) / cols
  const counters = new Array(cols).fill(0)

  return (
    <div ref={ref} className={styles.triage} data-sorted={sorted || undefined}>
      {triage.columns.map((c, i) => (
        <span key={c} className={`label ${styles.triageCol}`} style={{ left: i * (colW + GAP), width: colW }}>
          {c}
        </span>
      ))}
      {triage.tickets.map((t, i) => {
        const row = counters[t.col]++
        const sx = t.col * (colW + GAP)
        const sy = 24 + row * (TICKET_H + GAP)
        const px = size.w / 2 - colW / 2 + PILE[i].fx * size.w
        const py = boardH * 0.12 + PILE[i].fy * boardH * 0.62 + Math.cos(i * 1.7) * 6
        const transform = sorted
          ? `translate(${sx}px, ${sy}px) rotate(0deg)`
          : `translate(${px}px, ${py}px) rotate(${PILE[i].rot}deg)`
        return (
          <div
            key={t.id}
            className={styles.ticket}
            style={{ width: colW, height: TICKET_H, transform, transitionDelay: `${(sorted ? i : triage.tickets.length - i) * 55}ms` }}
          >
            <span className={styles.ticketId}>{t.id}</span>
            <span className={styles.ticketText}>{t.text}</span>
            <span className={styles.ticketCheck} aria-hidden="true">✓</span>
          </div>
        )
      })}
      <div className={styles.bar}>
        <span className="label">{triage.barLabel}</span>
        <span className={styles.barTrack}>
          <span className={styles.barFill} style={{ transform: `scaleX(${(sorted ? triage.to : triage.from) / 100})` }} />
        </span>
        <span className={`label ${styles.barValue}`}>{load}%</span>
      </div>
    </div>
  )
}
