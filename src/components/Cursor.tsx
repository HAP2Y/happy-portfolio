import { useEffect, useRef } from 'react'
import { onCursorLabel } from '../lib/cursorStore'
import { useFinePointer, useReducedMotion } from '../lib/env'

/**
 * Dot + trailing ring. Over interactive elements the ring grows; over
 * elements with data-cursor="Label" it fills and shows the label.
 * Mouse / trackpad only; touch devices keep their native behaviour.
 */
export function Cursor() {
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = rootRef.current, dot = dotRef.current, ring = ringRef.current, labelEl = labelRef.current
    if (!fine || !root || !dot || !ring || !labelEl) return
    const html = document.documentElement
    html.classList.add('has-cursor')

    let x = -100, y = -100, rx = -100, ry = -100
    let domLabel: string | null = null
    let domHover = false
    let canvasLabel: string | null = null
    let raf = 0

    const render = () => {
      const label = domLabel ?? (domHover ? null : canvasLabel)
      root.dataset.state = label ? 'label' : domHover ? 'hover' : 'idle'
      if (label && labelEl.textContent !== label) labelEl.textContent = label
    }

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      x = e.clientX
      y = e.clientY
      if (root.dataset.visible !== '1') {
        root.dataset.visible = '1'
        rx = x
        ry = y
      }
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }
    const over = (e: PointerEvent) => {
      const target = e.target as Element | null
      const labelled = target?.closest?.('[data-cursor]')
      const interactive = target?.closest?.('a, button, [role="button"], summary, [tabindex="0"]')
      domLabel = labelled?.getAttribute('data-cursor') || null
      domHover = Boolean(interactive || labelled)
      render()
    }
    const out = (e: PointerEvent) => {
      if (!e.relatedTarget) root.dataset.visible = '0'
    }
    const down = () => (root.dataset.down = '1')
    const up = () => (root.dataset.down = '0')
    const offCanvas = onCursorLabel((l) => {
      canvasLabel = l
      render()
    })

    const ease = reduced ? 1 : 0.2
    const loop = () => {
      rx += (x - rx) * ease
      ry += (y - ry) * ease
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerover', over, { passive: true })
    document.addEventListener('pointerout', out, { passive: true })
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      html.classList.remove('has-cursor')
      offCanvas()
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', over)
      document.removeEventListener('pointerout', out)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [fine, reduced])

  if (!fine) return null
  return (
    <div ref={rootRef} className="cursor" data-state="idle" data-visible="0" aria-hidden="true">
      <div ref={ringRef} className="cursor-ring">
        <div className="cursor-ring-shape">
          <span ref={labelRef} className="cursor-label" />
        </div>
      </div>
      <div ref={dotRef} className="cursor-dot" />
    </div>
  )
}
