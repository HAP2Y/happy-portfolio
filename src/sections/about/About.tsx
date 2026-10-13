import { about } from '../../content'
import { Eyebrow, RevealLines, Scramble } from '../../components/ui'
import styles from './About.module.css'

export function About() {
  return (
    <section id="about" className={`section wrap ${styles.about}`} aria-labelledby="about-title">
      <Eyebrow path="~/about.md" note="About" />
      <RevealLines lines={about.heading} className={`h2 ${styles.heading}`} id="about-title" />

      <div className={styles.grid}>
        <div className={`${styles.state} fade-in`} data-reveal>
          <p className="label">$ terraform state show module.happy_patel</p>
          <dl className={styles.stateList}>
            {about.state.map(([k, v]) => (
              <div key={k} className={styles.stateRow}>
                <dt>{k}</dt>
                <dd>
                  <span className={styles.eq}>=</span> &quot;{v}&quot;
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={styles.copy}>
          <p className={`${styles.lead} fade-in`} data-reveal>
            {about.lead}
          </p>
          {about.body.map((para, i) => (
            <p key={i} className={`${styles.body} fade-in`} data-reveal style={{ '--delay': `${80 * (i + 1)}ms` } as React.CSSProperties}>
              {para}
            </p>
          ))}

          <div className={styles.tools}>
            {about.tools.map((group) => (
              <div key={group.group} className={`${styles.toolGroup} fade-in`} data-reveal>
                <h3 className="label">{group.group}</h3>
                <ul>
                  {group.items.map((tool) => (
                    <li key={tool}>
                      <Scramble text={tool} className={styles.tool} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className={`label ${styles.toolsNote}`}>{about.toolsNote}</p>
        </div>
      </div>
    </section>
  )
}
