import { useEffect, useState } from 'react'
import { repoFactory } from '../../../content'
import styles from './Cards.module.css'

/**
 * Card 01. At rest: the catalogue entry that defines a repository.
 * On hover / focus: `terraform plan` types out line by line.
 */
const CHARS_PER_MS = 0.11 // typing speed
const LINE_GAP_MS = 70 // pause between lines

function schedule(lines: string[]) {
  let t = 120
  return lines.map((l) => {
    const start = t
    t += l.length / CHARS_PER_MS + LINE_GAP_MS
    return start
  })
}
const starts = schedule(repoFactory.plan)

function lineClass(line: string) {
  const s = line.trimStart()
  if (s.startsWith('$')) return styles.tfCmd
  if (s.startsWith('+')) return styles.tfAdd
  if (s.startsWith('Plan:')) return styles.tfPlan
  if (s.startsWith('#')) return styles.tfComment
  return styles.tfMuted
}

export function RepoFactoryStage({ active, reduced }: { active: boolean; reduced: boolean }) {
  const [elapsed, setElapsed] = useState(-1)

  useEffect(() => {
    if (reduced || !active) {
      setElapsed(-1)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const end = starts[starts.length - 1] + repoFactory.plan[repoFactory.plan.length - 1].length / CHARS_PER_MS + 10
    const tick = (now: number) => {
      const t = now - t0
      setElapsed(t)
      if (t < end) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, reduced])

  const showPlan = reduced || elapsed >= 0
  const lines = showPlan ? repoFactory.plan : repoFactory.input

  return (
    <pre className={styles.tf} data-mode={showPlan ? 'plan' : 'input'}>
      {lines.map((line, i) => {
        let text = line
        let caret = false
        if (showPlan && !reduced) {
          const visible = Math.floor((elapsed - starts[i]) * CHARS_PER_MS)
          if (visible <= 0) return <span key={i} className={styles.tfLine}>{' '}</span>
          text = line.slice(0, visible)
          caret = visible < line.length || i === lines.length - 1
        }
        return (
          <span key={i} className={`${styles.tfLine} ${lineClass(line)}`}>
            {text}
            {caret && <span className={styles.tfCaret} />}
          </span>
        )
      })}
    </pre>
  )
}
