/**
 * State shared by the hero scene's components, kept outside React so the
 * per-frame loops can read it without re-rendering.
 */

export const BASE_CAMERA_Z = 16
export const CAMERA_FOV = 32

/** Pointer in normalised device coords (-1..1) relative to the hero canvas. */
export const pointer = { x: 0, y: 0, active: false }

/** 0 at the top of the page, 1 once the hero has scrolled fully out of view. */
export const heroScroll = { progress: 0 }

let touchTimer: ReturnType<typeof setTimeout> | undefined

/** Tracks the pointer over the canvas element's rect (DOM overlays don't block it). */
export function trackPointer(canvas: HTMLElement): () => void {
  const update = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
    if (!inside) {
      pointer.active = false
      return
    }
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1
    pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1)
    pointer.active = true
    if (e.pointerType !== 'mouse') {
      clearTimeout(touchTimer)
    }
  }
  const up = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return
    clearTimeout(touchTimer)
    touchTimer = setTimeout(() => (pointer.active = false), 700)
  }
  const out = (e: PointerEvent) => {
    if (!e.relatedTarget) pointer.active = false
  }
  window.addEventListener('pointermove', update, { passive: true })
  window.addEventListener('pointerdown', update, { passive: true })
  window.addEventListener('pointerup', up, { passive: true })
  window.addEventListener('pointercancel', up, { passive: true })
  document.addEventListener('pointerout', out, { passive: true })
  return () => {
    window.removeEventListener('pointermove', update)
    window.removeEventListener('pointerdown', update)
    window.removeEventListener('pointerup', up)
    window.removeEventListener('pointercancel', up)
    document.removeEventListener('pointerout', out)
  }
}
