import { useId, useRef, useState } from 'react'
import { cert } from '../../../content'
import { useCardActive } from '../../../lib/hooks'
import type { CardProps } from './ProjectCard'
import styles from './Cards.module.css'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Card 05. Flips on hover or keyboard focus to show the credential ID and a
 * verify link. On touch it flips on tap. Reduced motion shows both sides
 * as one static face.
 */
export function CertCard({ index, project, touch, reduced }: CardProps) {
  const ref = useRef<HTMLElement>(null)
  const hoverOrFocus = useCardActive(ref, { touch: false, reduced })
  const [tapped, setTapped] = useState(false)
  const flipped = !reduced && (hoverOrFocus || tapped)
  const titleId = useId()

  const seal = (
    <div className={styles.seal} aria-hidden="true">
      <span className="label">{cert.issuer} Certified</span>
      <span className={styles.sealName}>Terraform Associate</span>
      <span className={styles.sealCode}>004</span>
    </div>
  )

  const verify = (
    <a href={cert.verifyUrl} target="_blank" rel="noopener noreferrer" className={styles.verify} data-cursor="Verify">
      <span className="u">Verify credential</span> <span className="arrow">↗</span>
    </a>
  )

  return (
    <li className={styles.item} data-card>
      <article
        ref={ref}
        className={`${styles.card} ${styles.cert}`}
        data-kind="cert"
        data-flipped={flipped || undefined}
        data-static={reduced || undefined}
        aria-labelledby={titleId}
        tabIndex={0}
        onClick={(e) => {
          if (!touch || (e.target as HTMLElement).closest('a')) return
          setTapped((t) => !t)
        }}
        data-cursor={reduced ? undefined : 'Flip'}
      >
        <div className={styles.flipInner}>
          {/* front */}
          <div className={styles.face}>
            <div className={styles.top}>
              <span className="label" style={{ color: 'var(--ink)' }}>
                {pad(index + 1)}
              </span>
              <span className="label">{project.kicker}</span>
            </div>
            <div className={styles.certStage}>{seal}</div>
            <div className={styles.body}>
              <h3 id={titleId} className={styles.title}>
                {cert.name}
              </h3>
              <p className={styles.tagChip}>{cert.tag}</p>
              {reduced ? (
                <div className={styles.certMeta}>
                  <span className="label">Credential ID</span>
                  <span className={styles.credId}>{cert.credentialId}</span>
                  {verify}
                </div>
              ) : (
                <p className={`label ${styles.flipHint}`}>{touch ? 'Tap to flip' : 'Hover to verify'}</p>
              )}
            </div>
          </div>

          {/* back */}
          {!reduced && (
            <div className={`${styles.face} ${styles.back}`} inert={!flipped}>
              <div className={styles.top}>
                <span className="label" style={{ color: 'var(--on-ink)' }}>
                  {pad(index + 1)}
                </span>
                <span className="label" style={{ color: 'var(--on-ink)' }}>
                  Credential
                </span>
              </div>
              <div className={styles.backBody}>
                <span className="label">Credential ID</span>
                <span className={styles.credId}>{cert.credentialId}</span>
                <span className="label">Issuer</span>
                <span className={styles.credIssuer}>{cert.issuer}</span>
              </div>
              <div className={styles.body}>
                {verify}
                <p className={styles.tagChip}>{cert.tag}</p>
              </div>
            </div>
          )}
        </div>
      </article>
    </li>
  )
}
