import type { ReactNode } from 'react'

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
