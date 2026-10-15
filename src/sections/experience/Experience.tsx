import { useEffect, useId, useRef, useState } from 'react'
import { experience } from '../../content'
import { Eyebrow, RevealLines } from '../../components/ui'
import { useReducedMotion } from '../../lib/env'
import { ScrollTrigger, gsap } from '../../lib/scroll'
import styles from './Experience.module.css'

type Role = (typeof experience.roles)[number]

function RoleItem({ role, open, onToggle }: { role: Role; open: boolean; onToggle: () => void }) {
  const id = useId()
  return (
    <li className={styles.role} data-role data-open={open || undefined}>
      <span className={styles.node} aria-hidden="true" />
      <h3 className={styles.roleHead}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={id}
          data-cursor={open ? 'Close' : 'Open'}
          onClick={onToggle}
        >
          <span className={`label ${styles.dates}`}>{role.dates}</span>
          <span className={styles.titleWrap}>
            <span className={styles.title}>{role.title}</span>
            {'tag' in role && role.tag && <span className={`label ${styles.tag}`}>{role.tag}</span>}
          </span>
          <span className={`label ${styles.place}`}>{role.place}</span>
          <span className={styles.plus} aria-hidden="true" />
        </button>
      </h3>
      <div id={id} className={styles.details} role="region" aria-label={`${role.title} details`}>
        <div className={styles.detailsInner}>
          <ul>
            {role.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  )
}

export function Experience() {
  const reduced = useReducedMotion()
  const [open, setOpen] = useState<number | null>(0)
  const listRef = useRef<HTMLOListElement>(null)
  const lineRef = useRef<HTMLSpanElement>(null)

  // The timeline line draws in with scroll; nodes fill as it passes them.
  useEffect(() => {
    const list = listRef.current, line = lineRef.current
    if (!list || !line) return
    if (reduced) {
      line.style.transform = 'scaleY(1)'
      list.querySelectorAll('[data-role]').forEach((r) => r.classList.add(styles.passed))
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: list, start: 'top 72%', end: 'bottom 62%', scrub: 0.6 },
        },
      )
      list.querySelectorAll<HTMLElement>('[data-role]').forEach((r) => {
        ScrollTrigger.create({
          trigger: r,
          start: 'top 66%',
          onEnter: () => r.classList.add(styles.passed),
          onLeaveBack: () => r.classList.remove(styles.passed),
        })
      })
    }, list)
    return () => ctx.revert()
  }, [reduced])

  // Height changes when a role opens: keep pinned sections below in sync.
  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 650)
    return () => clearTimeout(t)
  }, [open])

  return (
    <section id="experience" className={`section wrap ${styles.experience}`} aria-labelledby="exp-title">
      <Eyebrow path="~/experience.log" note={experience.span} />
      <div className={styles.head}>
        <RevealLines lines={experience.heading} className="h2" id="exp-title" />
        <p className={`label ${styles.company}`}>{experience.company}</p>
      </div>

      <div className={styles.timeline}>
        <span className={styles.rail} aria-hidden="true">
          <span ref={lineRef} className={styles.railFill} />
        </span>
        <ol ref={listRef} className={styles.list}>
          {experience.roles.map((role, i) => (
            <RoleItem key={role.title + role.dates} role={role} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
          ))}
        </ol>
      </div>
      <p className={`label ${styles.footnote}`}>{experience.footnote}</p>
    </section>
  )
}
