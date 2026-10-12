import { hero, person } from '../../content'
import { scrollToEl } from '../../lib/scroll'
import styles from './Hero.module.css'

export function Hero() {
  return (
    <section id="top" className={styles.hero} data-assembled>
      <h1 className={styles.fallbackName}>
        <span className={styles.fallbackLine}>{person.firstName}</span>{' '}
        <span className={styles.fallbackLine}>{person.lastName}</span>
      </h1>

      <div className={styles.top}>
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
