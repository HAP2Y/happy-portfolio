import { useEffect, useState, type RefObject } from 'react'

/** True once (or while) the element intersects the viewport. */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { once = true, rootMargin = '0px', threshold = 0 }: { once?: boolean; rootMargin?: string; threshold?: number } = {},
): boolean {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) io.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { rootMargin, threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, once, rootMargin, threshold])
  return inView
}

/**
 * Drives each project card's micro-interaction.
 * Active while hovered (mouse), while focus is inside the card (keyboard),
 * or, on touch devices, while the card is mostly visible in the carousel.
 * Always false under reduced motion: cards then show a pre-rendered state.
 */
export function useCardActive<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { touch, reduced }: { touch: boolean; reduced: boolean },
): boolean {
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    const enter = (e: PointerEvent) => e.pointerType === 'mouse' && setHover(true)
    const leave = (e: PointerEvent) => e.pointerType === 'mouse' && setHover(false)
    const fin = () => setFocus(true)
    const fout = (e: FocusEvent) => {
      if (!el.contains(e.relatedTarget as Node | null)) setFocus(false)
    }
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('focusin', fin)
    el.addEventListener('focusout', fout)

    let io: IntersectionObserver | undefined
    if (touch) {
      io = new IntersectionObserver(([e]) => setVisible(e.intersectionRatio > 0.6), {
        threshold: [0, 0.6, 1],
      })
      io.observe(el)
    }
    return () => {
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('focusin', fin)
      el.removeEventListener('focusout', fout)
      io?.disconnect()
    }
  }, [ref, touch, reduced])

  if (reduced) return false
  return hover || focus || (touch && visible)
}
