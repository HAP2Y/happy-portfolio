import { useEffect, useRef } from 'react'
import { smartsort } from '../../../content'
import { cssVar } from '../../../lib/env'
import { useTheme } from '../../../lib/theme'
import styles from './Cards.module.css'

/**
 * Card 02. Files (dots) stream into the router, which sends each one down a
 * weighted lane (rules · ai-small · ai-large · ocr) to its worker pool.
 * A "done" counter ticks as files land. Canvas 2D; runs only while active.
 */
interface Dot {
  lane: number
  d: number // distance travelled along its path (px)
  speed: number
  jitter: number
}

const PRESET: Dot[] = [
  { lane: 0, d: 40, speed: 0, jitter: 0 },
  { lane: 1, d: 170, speed: 0, jitter: 0 },
  { lane: 1, d: 260, speed: 0, jitter: 0 },
  { lane: 2, d: 210, speed: 0, jitter: 0 },
  { lane: 0, d: 320, speed: 0, jitter: 0 },
  { lane: 3, d: 150, speed: 0, jitter: 0 },
  { lane: 1, d: 95, speed: 0, jitter: 0 },
]

function pickLane() {
  let r = Math.random()
  for (let i = 0; i < smartsort.lanes.length; i++) {
    r -= smartsort.lanes[i].weight
    if (r <= 0) return i
  }
  return 0
}

export function SmartSortStage({ active, reduced }: { active: boolean; reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const doneRef = useRef<HTMLSpanElement>(null)
  const theme = useTheme()
  const state = useRef({ dots: [] as Dot[], done: 0, spawn: 0, raf: 0, running: false, w: 0, h: 0, active: false, flashes: [0, 0, 0, 0] })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const s = state.current
    let colors = { ink: '#0e0e0e', muted: '#6b6a66', line: '#dad9d3', accent: '#7b42bc', bg: '#f4f3ef' }

    const readColors = () => {
      colors = {
        ink: cssVar('--ink'),
        muted: cssVar('--muted'),
        line: cssVar('--line'),
        accent: cssVar('--accent'),
        bg: cssVar('--bg'),
      }
    }

    // Geometry: inbound → router → fan out → lanes → workers
    const geo = () => {
      const { w, h } = s
      const rx = w * 0.2
      const ry = h * 0.52
      const fanX = w * 0.4
      const endX = w - 18
      const laneY = (i: number) => h * (0.2 + i * 0.22)
      return { rx, ry, fanX, endX, laneY }
    }
    const pathLen = (lane: number) => {
      const g = geo()
      const a = g.rx
      const b = Math.hypot(g.fanX - g.rx, g.laneY(lane) - g.ry)
      const c = g.endX - g.fanX
      return a + b + c
    }
    const posAt = (lane: number, d: number, jitter: number) => {
      const g = geo()
      if (d <= g.rx) return [d, g.ry + jitter * (1 - d / g.rx)]
      d -= g.rx
      const ly = g.laneY(lane)
      const b = Math.hypot(g.fanX - g.rx, ly - g.ry)
      if (d <= b) {
        const t = d / b
        return [g.rx + (g.fanX - g.rx) * t, g.ry + (ly - g.ry) * t]
      }
      d -= b
      return [g.fanX + d, ly]
    }

    const draw = () => {
      const { w, h } = s
      const g = geo()
      ctx.clearRect(0, 0, w, h)
      ctx.lineWidth = 1
      ctx.strokeStyle = colors.line
      // inbound line
      ctx.beginPath()
      ctx.moveTo(0, g.ry + 0.5)
      ctx.lineTo(g.rx, g.ry + 0.5)
      ctx.stroke()
      // lanes
      ctx.font = `10px ${cssVar('--font-mono') || 'monospace'}`
      ctx.textBaseline = 'bottom'
      smartsort.lanes.forEach((lane, i) => {
        const y = Math.round(g.laneY(i)) + 0.5
        ctx.strokeStyle = colors.line
        ctx.beginPath()
        ctx.moveTo(g.rx, g.ry)
        ctx.lineTo(g.fanX, y)
        ctx.lineTo(g.endX, y)
        ctx.stroke()
        ctx.fillStyle = colors.muted
        ctx.textAlign = 'left'
        ctx.fillText(lane.id, g.fanX + 6, y - 5)
        // worker pool at lane end, flashes when a file lands
        const f = s.flashes[i]
        ctx.fillStyle = f > 0 ? colors.accent : colors.ink
        const size = 7 + f * 4
        ctx.fillRect(g.endX - size / 2, y - size / 2, size, size)
      })
      // router node
      ctx.fillStyle = colors.bg
      ctx.fillRect(g.rx - 9, g.ry - 9, 18, 18)
      ctx.strokeStyle = colors.ink
      ctx.strokeRect(g.rx - 8.5, g.ry - 8.5, 17, 17)
      ctx.fillStyle = colors.ink
      ctx.fillRect(g.rx - 3, g.ry - 3, 6, 6)
      ctx.fillStyle = colors.muted
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText('router', g.rx, g.ry + 14)
      // files
      ctx.fillStyle = colors.ink
      for (const dot of s.dots) {
        const [x, y] = posAt(dot.lane, dot.d, dot.jitter)
        ctx.fillRect(x - 2, y - 2, 4, 4)
      }
    }

    const setDone = () => {
      if (doneRef.current) doneRef.current.textContent = String(s.done).padStart(4, '0')
    }

    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(50, now - last)
      last = now
      if (s.active) {
        s.spawn -= dt
        while (s.spawn <= 0) {
          s.dots.push({ lane: pickLane(), d: 0, speed: 0.11 + Math.random() * 0.07, jitter: (Math.random() - 0.5) * 14 })
          s.spawn += 55 + Math.random() * 60
        }
      }
      for (let i = s.dots.length - 1; i >= 0; i--) {
        const dot = s.dots[i]
        dot.d += dot.speed * dt * (s.w / 420)
        if (dot.d >= pathLen(dot.lane)) {
          s.flashes[dot.lane] = 1
          s.dots.splice(i, 1)
          s.done++
        }
      }
      for (let i = 0; i < 4; i++) s.flashes[i] = Math.max(0, s.flashes[i] - dt / 220)
      setDone()
      draw()
      if (s.active || s.dots.length) s.raf = requestAnimationFrame(tick)
      else s.running = false
    }

    const start = () => {
      if (s.running) return
      s.running = true
      last = performance.now()
      s.raf = requestAnimationFrame(tick)
    }

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      s.w = r.width
      s.h = r.height
      canvas.width = Math.round(r.width * dpr)
      canvas.height = Math.round(r.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (!s.running) draw()
    }

    readColors()
    // Pre-rendered resting state
    if (!s.dots.length && !s.running) {
      s.dots = PRESET.map((d) => ({ ...d }))
      s.done = reduced ? 128 : 0
      setDone()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    s.active = active && !reduced
    if (s.active && s.dots.some((d) => d.speed === 0)) s.dots = s.dots.filter((d) => d.speed > 0)
    // keep running after hover ends until the files in flight have landed
    if (s.active || s.dots.some((d) => d.speed > 0)) start()

    return () => {
      ro.disconnect()
      cancelAnimationFrame(s.raf)
      s.running = false
    }
  }, [active, reduced, theme])

  return (
    <div className={styles.sortStage}>
      <canvas ref={canvasRef} className={styles.sortCanvas} />
      <span className={`label ${styles.sortDone}`}>
        done <span ref={doneRef} style={{ color: 'var(--ink)' }}>0000</span>
      </span>
    </div>
  )
}
