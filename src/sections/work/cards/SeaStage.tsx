import { useEffect, useRef, useState } from 'react'
import { use3D } from '../../../lib/env'
import { useInView } from '../../../lib/hooks'
import { useTheme } from '../../../lib/theme'
import type { SeaPreview } from '../../../three/seaPreview'
import styles from './Cards.module.css'

/**
 * Card 04. A live mini-canvas of the Raging Sea shader, using the original
 * repo's parameters. Created when the card nears the viewport (a still
 * frame), animated only while the card is active.
 */
export function SeaStage({ active, reduced }: { active: boolean; reduced: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const near = useInView(wrapRef, { rootMargin: '300px' })
  const theme = useTheme()
  const [sea, setSea] = useState<SeaPreview | null>(null)
  const [webgl] = useState(() => use3D())

  useEffect(() => {
    if (!near || !webgl || !canvasRef.current) return
    let disposed = false
    let instance: SeaPreview | null = null
    import('../../../three/seaPreview').then(({ createSeaPreview }) => {
      if (disposed || !canvasRef.current) return
      instance = createSeaPreview(canvasRef.current)
      setSea(instance)
    })
    return () => {
      disposed = true
      instance?.dispose()
      setSea(null)
    }
  }, [near, webgl])

  useEffect(() => {
    sea?.refreshColors()
  }, [sea, theme])

  useEffect(() => {
    if (!sea) return
    if (active && !reduced) sea.start()
    else sea.stop()
  }, [sea, active, reduced])

  return (
    <div ref={wrapRef} className={styles.seaStage}>
      {webgl ? (
        <canvas ref={canvasRef} className={styles.seaCanvas} />
      ) : (
        <svg className={styles.seaCanvas} viewBox="0 0 400 200" preserveAspectRatio="none">
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={`M0 ${40 + i * 18} ${Array.from({ length: 21 }, (_, k) => `L${k * 20} ${40 + i * 18 + Math.sin(k * 0.7 + i) * (6 - i * 0.4)}`).join(' ')}`}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.15 + i * 0.07}
            />
          ))}
        </svg>
      )}
      <span className={`label ${styles.seaLabel}`}>{active && !reduced ? 'uTime running' : 'uTime paused'}</span>
    </div>
  )
}
