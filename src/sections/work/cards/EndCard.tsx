import { useRef } from 'react'
import { useCardActive } from '../../../lib/hooks'
import type { CardProps } from './ProjectCard'
import styles from './Cards.module.css'

const pad = (n: number) => String(n).padStart(2, '0')

/** Card 06. "32 more on GitHub": 32 small resources provision on hover. */
export function EndCard({ index, project, touch, reduced }: CardProps) {
  const ref = useRef<HTMLAnchorElement>(null)
  const active = useCardActive(ref, { touch, reduced })
  const count = Number(project.title.match(/\d+/)?.[0] ?? 32)

  return (
    <li className={styles.item} data-card>
      <a
        ref={ref}
        href={project.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.card} ${styles.end}`}
        data-active={active || undefined}
        data-static={reduced || undefined}
        data-cursor={project.cursor ?? 'Explore'}
      >
        <div className={styles.top}>
          <span className="label" style={{ color: 'var(--ink)' }}>
            {pad(index + 1)}
          </span>
          <span className="label">{project.kicker}</span>
        </div>
        <div className={styles.repoGrid} aria-hidden="true">
          {Array.from({ length: count }, (_, i) => (
            <span key={i} style={{ transitionDelay: `${active ? i * 22 : 0}ms` }} />
          ))}
        </div>
        <div className={styles.body}>
          <h3 className={styles.endTitle}>
            {project.title} <span className="arrow">→</span>
          </h3>
          <p className={styles.summary}>{project.summary}</p>
          <span className={`label keep ${styles.link}`}>{project.linkLabel}</span>
        </div>
      </a>
    </li>
  )
}
