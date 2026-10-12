import { useEffect, useState } from 'react'
import { nav, person } from '../content'
import { toggleTheme, useTheme } from '../lib/theme'
import { useReducedMotion } from '../lib/env'
import { getScrollY } from '../lib/scroll'
import { wipeTo } from './Wipe'

export function Header() {
  const theme = useTheme()
  const reduced = useReducedMotion()
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Hide on scroll down, reveal on scroll up.
  useEffect(() => {
    let last = getScrollY()
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = getScrollY()
        const delta = y - last
        if (Math.abs(delta) > 6) {
          setHidden(delta > 0 && y > 160)
          last = y
        }
        setScrolled(y > 40)
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const dark = theme === 'dark'

  return (
    <header className="header" data-hidden={hidden || undefined} data-scrolled={scrolled || undefined}>
      <a
        href="#top"
        className="header-brand"
        data-magnetic="0.25"
        onClick={(e) => {
          e.preventDefault()
          wipeTo('top', '~')
        }}
      >
        <span className="header-mark" aria-hidden="true" />
        {person.name}
      </a>
      <nav aria-label="Primary" className="header-nav">
        <ul>
          {nav.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="label header-link"
                data-magnetic="0.3"
                onClick={(e) => {
                  e.preventDefault()
                  wipeTo(item.id, item.path)
                }}
              >
                <span className="u">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <button
        type="button"
        className="theme-toggle label"
        aria-pressed={dark}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        data-magnetic="0.3"
        onClick={(e) => toggleTheme({ x: e.clientX, y: e.clientY }, reduced)}
      >
        <span className="theme-glyph" aria-hidden="true" />
        <span className="theme-text">{dark ? 'Light' : 'Dark'}</span>
      </button>
    </header>
  )
}
