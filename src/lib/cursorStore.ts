/**
 * Tiny store so non-DOM sources (the WebGL hero) can set the cursor label.
 * DOM elements use a `data-cursor="Label"` attribute instead.
 */
type Listener = (label: string | null) => void

let current: string | null = null
const listeners = new Set<Listener>()

export function setCursorLabel(label: string | null) {
  if (label === current) return
  current = label
  listeners.forEach((l) => l(label))
}

export function onCursorLabel(l: Listener) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
