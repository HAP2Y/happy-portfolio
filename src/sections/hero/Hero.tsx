import { Component, Suspense, lazy, useCallback, useEffect, useState, type ReactNode } from 'react'
import { hero, person } from '../../content'
import { hasWebGL, isLowPower, useReducedMotion } from '../../lib/env'
import { scrollToEl } from '../../lib/scroll'
import { Terminal } from './Terminal'
import styles from './Hero.module.css'

// Three.js and the scene load in their own chunk, after first paint.
const HeroCanvas = lazy(() => import('../../three/HeroCanvas'))

/** If WebGL fails at runtime, fall back to the typographic name. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function Hero() {
  const reduced = useReducedMotion()
  const [webgl, setWebgl] = useState(() => hasWebGL())
  const [lowPower] = useState(() => isLowPower())
  const [load3D, setLoad3D] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [typed, setTyped] = useState(false)
  const [assembled, setAssembled] = useState(false)

  // Defer the 3D chunk until the page has painted.
  useEffect(() => {
    if (!webgl) return
    const id = requestAnimationFrame(() => setLoad3D(true))
    return () => cancelAnimationFrame(id)
  }, [webgl])

  // Without WebGL the typographic name stands in for the cubes.
  useEffect(() => {
    if (webgl || !typed) return
    const t = setTimeout(() => setAssembled(true), reduced ? 0 : 500)
    return () => clearTimeout(t)
  }, [webgl, typed, reduced])

  const onReady = useCallback(() => setSceneReady(true), [])
  const onAssembled = useCallback(() => setAssembled(true), [])
  const onTyped = useCallback(() => setTyped(true), [])
  const onSceneError = useCallback(() => setWebgl(false), [])

  const apply = typed && sceneReady
  // A reduced-motion scene is assembled the moment it exists.
  useEffect(() => {
    if (reduced && sceneReady) setAssembled(true)
  }, [reduced, sceneReady])

  return (
    <section id="top" className={styles.hero} data-assembled={assembled || undefined}>
      <div className={styles.canvas} aria-hidden="true">
        {webgl && load3D && (
          <SceneBoundary onError={onSceneError}>
            <Suspense fallback={null}>
              <HeroCanvas
                apply={apply}
                reduced={reduced}
                lowPower={lowPower}
                onReady={onReady}
                onAssembled={onAssembled}
              />
            </Suspense>
          </SceneBoundary>
        )}
      </div>

      <h1 className={webgl ? 'sr-only' : styles.fallbackName}>
        <span className={styles.fallbackLine}>{person.firstName}</span>{' '}
        <span className={styles.fallbackLine}>{person.lastName}</span>
      </h1>

      <div className={styles.top}>
        <Terminal
          reduced={reduced}
          sceneReady={sceneReady || !webgl}
          applying={apply || (!webgl && typed)}
          assembled={assembled}
          onTyped={onTyped}
        />
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
