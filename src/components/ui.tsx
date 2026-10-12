import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { gsap } from '../lib/scroll'

/* ───────────────────────── RevealLines ─────────────────────────
 * Headings that slide up line by line as they enter the viewport.
 * Lines are authored in content.ts so breaks are deliberate. */
export function RevealLines({
  lines,
  as: Tag = 'h2',
  className = '',
  id,
}: {
  lines: string[]
  as?: 'h1' | 'h2' | 'h3' | 'p'
  className?: string
  id?: string
}) {
  return (
    <Tag className={`reveal-lines ${className}`} data-reveal id={id}>
      {lines.map((line, i) => (
        <span className="rl" key={i}>
          <span className="rl-i" style={{ '--i': i } as React.CSSProperties}>
            {line}
          </span>
        </span>
      ))}
    </Tag>
  )
}

/** One shared observer adds `.is-in` to every [data-reveal] element. */
export function initReveals(reduced: boolean): () => void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'))
    return () => {}
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in')
          io.unobserve(e.target)
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  els.forEach((el) => io.observe(el))
  return () => io.disconnect()
}

/* ───────────────────────── Scramble ─────────────────────────────
 * Text that briefly decodes itself on hover or focus. */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>=+'

export function Scramble({ text, className = '', duration = 520 }: { text: string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const raf = useRef(0)

  const run = () => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    cancelAnimationFrame(raf.current)
    const start = performance.now()
    let frame = 0
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      frame++
      if (frame % 2 === 0 || p === 1) {
        let out = ''
        for (let i = 0; i < text.length; i++) {
          const ch = text[i]
          const settle = (i / text.length) * 0.7 + 0.3
          out += p >= settle || ch === ' ' || ch === '·' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
        }
        el.textContent = out
      }
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  return (
    <span className={`scramble ${className}`} onPointerEnter={run}>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden="true">
        {text}
      </span>
    </span>
  )
}

/* ───────────────────────── Eyebrow ──────────────────────────────
 * Section label: a file path on the left, a note on the right, and a
 * rule that wipes across as the section arrives. */
export function Eyebrow({ path, note }: { path: string; note?: ReactNode }) {
  return (
    <div className="eyebrow" data-reveal>
      <span className="label keep" style={{ color: 'var(--ink)' }}>
        {path}
      </span>
      {note && <span className="label">{note}</span>}
    </div>
  )
}

/* ───────────────────────── Magnetic ─────────────────────────────
 * Elements with [data-magnetic] lean toward the cursor and spring back. */
export function initMagnetic(): () => void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {}
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-magnetic]'))
  const cleanups = els.map((el) => {
    const strength = Number(el.dataset.magnetic) || 0.3
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const leave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: true })
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      gsap.set(el, { clearProps: 'transform' })
    }
  })
  return () => cleanups.forEach((c) => c())
}

/* ───────────────────────── Toast ────────────────────────────── */
let toastMsg: string | null = null
let toastTimer: ReturnType<typeof setTimeout> | undefined
const toastListeners = new Set<() => void>()

export function showToast(msg: string) {
  toastMsg = msg
  toastListeners.forEach((l) => l())
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMsg = null
    toastListeners.forEach((l) => l())
  }, 2400)
}

export function Toast() {
  const msg = useSyncExternalStore(
    (cb) => {
      toastListeners.add(cb)
      return () => toastListeners.delete(cb)
    },
    () => toastMsg,
  )
  return (
    <div className="toast" role="status" aria-live="polite" data-show={msg ? '' : undefined}>
      <span className="toast-dot" aria-hidden="true" />
      <span>{msg ?? ''}</span>
    </div>
  )
}
