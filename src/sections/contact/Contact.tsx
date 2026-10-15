import { contact, links, person, site } from '../../content'
import { Eyebrow, RevealLines, showToast } from '../../components/ui'
import { scrollToY } from '../../lib/scroll'
import styles from './Contact.module.css'

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for browsers / frames that refuse the async clipboard
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    ta.remove()
    return ok
  }
}

export function Contact() {
  const resumeHref = `${import.meta.env.BASE_URL}${person.resume}`

  return (
    <section id="contact" className={`section wrap ${styles.contact}`} aria-labelledby="contact-title">
      <Eyebrow path="~/outputs.tf" note="Contact" />

      <RevealLines lines={contact.heading} className={styles.heading} id="contact-title" />

      <div className={styles.grid}>
        <div className={styles.primary}>
          <p className={`${styles.intro} fade-in`} data-reveal>
            {contact.intro}
          </p>
          <button
            type="button"
            className={styles.email}
            data-cursor="Copy"
            data-magnetic="0.15"
            onClick={async () => {
              const ok = await copyText(person.email)
              showToast(ok ? contact.copied : `Select and copy: ${person.email}`)
            }}
          >
            <span className="u">{person.email}</span>
            <span className={`label ${styles.copyHint}`}>Click to copy</span>
          </button>

          <ul className={styles.links}>
            {links.map((l) => (
              <li key={l.label}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className={styles.link} data-magnetic="0.25">
                  <span className="u">{l.label}</span> <span className="arrow">↗</span>
                  <span className={`label keep ${styles.handle}`}>{l.handle}</span>
                </a>
              </li>
            ))}
            <li>
              <a href={resumeHref} download className={styles.link} data-magnetic="0.25" data-cursor="Save">
                <span className="u">Résumé</span> <span className={styles.down}>↓</span>
                <span className={`label ${styles.handle}`}>PDF</span>
              </a>
            </li>
          </ul>
        </div>

        <div className={styles.side}>
          <pre className={`${styles.outputs} fade-in`} data-reveal>
            <span className={styles.outHead}>Outputs:</span>
            {'\n\n'}
            {contact.outputs.map(([k, v]) => (
              <span key={k} className={styles.outRow}>
                <span className={styles.outKey}>{k.padEnd(9)}</span>= {v}
                {'\n'}
              </span>
            ))}
          </pre>
          <p className={styles.location}>{person.location}</p>
        </div>
      </div>

      <footer className={styles.footer}>
        <span className="label">© {site.year} {person.name}</span>
        <span className="label">Built with React Three Fiber, GSAP and Lenis</span>
        <a
          href="#top"
          className={`label ${styles.top}`}
          onClick={(e) => {
            e.preventDefault()
            scrollToY(0)
          }}
        >
          <span className="u">Back to top</span> ↑
        </a>
      </footer>
    </section>
  )
}
