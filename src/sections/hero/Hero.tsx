import { useCallback, useEffect, useState } from 'react'
import { hero, person } from '../../content'
import { useReducedMotion } from '../../lib/env'
import { scrollToEl } from '../../lib/scroll'
import { Terminal } from './Terminal'
import styles from './Hero.module.css'

export function Hero() {
  const reduced = useReducedMotion()
  const [typed, setTyped] = useState(false)
  const [assembled, setAssembled] = useState(false)

  // The typographic name "provisions" once the command has typed.
  useEffect(() => {
    if (!typed) return
    const t = setTimeout(() => setAssembled(true), reduced ? 0 : 500)
    return () => clearTimeout(t)
  }, [typed, reduced])

  const onTyped = useCallback(() => setTyped(true), [])

  return (
    <section id="top" className={styles.hero} data-assembled={assembled || undefined}>
      <h1 className={styles.fallbackName}>
        <span className={styles.fallbackLine}>{person.firstName}</span>{' '}
        <span className={styles.fallbackLine}>{person.lastName}</span>
      </h1>

      <div className={styles.top}>
        <Terminal reduced={reduced} sceneReady applying={typed} assembled={assembled} onTyped={onTyped} />
        <p className={`${styles.corner} label`}>
          {person.role}
        </p>
      </div>

      <div className={styles.bottom}>
        <p className={styles.tagline}>{person.tagline}</p>
        <p className={`${styles.region} label`}>
          <span>{person.regionLine}</span>
          <span>Open to remote</span>
        </p>
        <a
          href="#about"
          className={`${styles.scroll} label`}
          data-cursor="Scroll"
          onClick={(e) => {
            const target = document.getElementById('about')
            if (!target) return
            e.preventDefault()
            scrollToEl(target)
          }}
        >
          <span>{hero.scrollCue}</span>
          <span className={styles.scrollLine} aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
