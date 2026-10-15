import { useId, useRef, type ReactNode } from 'react'
import type { ProjectCard } from '../../../content'
import { useCardActive } from '../../../lib/hooks'
import { RepoFactoryStage } from './RepoFactoryStage'
import styles from './Cards.module.css'

export interface CardProps {
  index: number
  project: ProjectCard
  touch: boolean
  reduced: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

function Stage({ kind, active, reduced }: { kind: ProjectCard['kind']; active: boolean; reduced: boolean }): ReactNode {
  switch (kind) {
    case 'repo-factory':
      return <RepoFactoryStage active={active} reduced={reduced} />
    default:
      return null
  }
}

/**
 * A project card: number + kicker, an interactive stage that plays while the
 * card is hovered / focused / centred, then title, summary, stack and link.
 * The title link stretches over the whole card.
 */
export function ProjectCardView({ index, project, touch, reduced }: CardProps) {
  const ref = useRef<HTMLElement>(null)
  const active = useCardActive(ref, { touch, reduced })
  const titleId = useId()
  const { href } = project

  return (
    <li className={styles.item} data-card>
      <article
        ref={ref}
        className={styles.card}
        data-kind={project.kind}
        data-active={active || undefined}
        data-cursor={href ? project.cursor ?? 'View' : undefined}
        tabIndex={href ? undefined : 0}
        aria-labelledby={titleId}
      >
        <div className={styles.top}>
          <span className="label" style={{ color: 'var(--ink)' }}>
            {pad(index + 1)}
          </span>
          <span className="label">{project.kicker}</span>
        </div>

        <div className={styles.stage} aria-hidden="true">
          <Stage kind={project.kind} active={active} reduced={reduced} />
        </div>

        <div className={styles.body}>
          <h3 id={titleId} className={styles.title}>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className={styles.stretch}>
                {project.title}
              </a>
            ) : (
              project.title
            )}
          </h3>
          <p className={styles.summary}>{project.summary}</p>
          <div className={styles.foot}>
            <ul className={styles.tags} aria-label="Stack">
              {project.stack.map((s) => (
                <li key={s} className="label">
                  {s}
                </li>
              ))}
            </ul>
            {href && (
              <span className={`label keep ${styles.link}`}>
                {project.linkLabel} <span className="arrow">↗</span>
              </span>
            )}
          </div>
        </div>
      </article>
    </li>
  )
}
