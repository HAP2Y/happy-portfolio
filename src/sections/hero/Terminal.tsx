import { useEffect, useRef, useState } from 'react'
import { hero } from '../../content'
import styles from './Hero.module.css'

interface Props {
  reduced: boolean
  /** the 3D scene has built its cubes and can start the fly-in */
  sceneReady: boolean
  /** the fly-in has started */
  applying: boolean
  /** every cube has landed */
  assembled: boolean
  onTyped: () => void
}

/**
 * The hero's terraform session. Types the command, waits for the scene if it
 * is still loading (that wait doubles as the loader), then reports the apply.
 */
export function Terminal({ reduced, sceneReady, applying, assembled, onTyped }: Props) {
  const cmd = hero.command
  const [n, setN] = useState(reduced ? cmd.length : 0)
  const [showWaiting, setShowWaiting] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const typedRef = useRef(false)
  const onTypedRef = useRef(onTyped)
  onTypedRef.current = onTyped

  // Type the command with a slightly human rhythm.
  useEffect(() => {
    const done = () => {
      if (typedRef.current) return
      typedRef.current = true
      onTypedRef.current()
    }
    if (reduced) {
      setN(cmd.length)
      done()
      return
    }
    let i = 0
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      i++
      setN(i)
      if (i < cmd.length) {
        const prev = cmd[i - 1]
        timer = setTimeout(tick, 18 + Math.random() * 34 + (prev === ' ' ? 45 : 0))
      } else {
        timer = setTimeout(done, 220)
      }
    }
    timer = setTimeout(tick, 450)
    return () => clearTimeout(timer)
  }, [reduced, cmd])

  const typed = n >= cmd.length

  // Only mention the state lock if the scene is genuinely still loading.
  useEffect(() => {
    if (!typed || sceneReady || reduced) {
      setShowWaiting(false)
      return
    }
    const t = setTimeout(() => setShowWaiting(true), 300)
    return () => clearTimeout(t)
  }, [typed, sceneReady, reduced])

  useEffect(() => {
    if (!assembled) return
    if (reduced) {
      setShowComplete(true)
      return
    }
    const t = setTimeout(() => setShowComplete(true), 260)
    return () => clearTimeout(t)
  }, [assembled, reduced])

  const lastLine = showComplete ? 'complete' : assembled ? 'created' : applying ? 'creating' : showWaiting ? 'waiting' : 'cmd'

  return (
    <div className={styles.terminal} aria-hidden="true">
      <p className={styles.cmd}>
        {cmd.slice(0, n)}
        {lastLine === 'cmd' && <span className={styles.caret} />}
      </p>
      {showWaiting && !applying && (
        <p className={styles.log}>
          {hero.waiting}
          {lastLine === 'waiting' && <span className={styles.caret} />}
        </p>
      )}
      {applying && !reduced && (
        <p className={styles.log}>
          {hero.creating}
          {lastLine === 'creating' && <span className={styles.caret} />}
        </p>
      )}
      {assembled && (
        <p className={styles.log}>
          {hero.created}
          {lastLine === 'created' && <span className={styles.caret} />}
        </p>
      )}
      {showComplete && (
        <p className={styles.done}>
          {hero.complete}
          <span className={styles.caret} />
        </p>
      )}
    </div>
  )
}
