import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { NameCubes } from './NameCubes'
import { World } from './World'
import { Sea } from './Sea'
import { BASE_CAMERA_Z, CAMERA_FOV, heroScroll, pointer, trackPointer } from './shared'
import { useTheme } from '../lib/theme'

export interface HeroCanvasProps {
  apply: boolean
  reduced: boolean
  lowPower: boolean
  /** false while the hero is off-screen: rendering pauses entirely */
  visible: boolean
  onReady: () => void
  onAssembled: () => void
}

/** Scroll dollies the camera forward; the pointer adds a touch of parallax. */
function CameraRig({ reduced }: { reduced: boolean }) {
  const { camera, gl } = useThree()
  useFrame((_, rawDt) => {
    const r = gl.domElement.getBoundingClientRect()
    heroScroll.progress = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)))
    if (reduced) return
    const dt = Math.min(rawDt, 1 / 30)
    const k = Math.min(1, dt * 2.5)
    const z = BASE_CAMERA_Z - heroScroll.progress * 5
    const x = pointer.active ? pointer.x * 0.35 : 0
    const y = pointer.active ? pointer.y * 0.2 : 0
    camera.position.z += (z - camera.position.z) * k
    camera.position.x += (x - camera.position.x) * k
    camera.position.y += (y - camera.position.y) * k
    camera.lookAt(0, 0, -8)
  })
  return null
}

/** Re-renders once on theme change when the frameloop is on demand. */
function ThemeInvalidator() {
  const theme = useTheme()
  const { invalidate } = useThree()
  useEffect(() => {
    invalidate()
  }, [theme, invalidate])
  return null
}

export default function HeroCanvas({ apply, reduced, lowPower, visible, onReady, onAssembled }: HeroCanvasProps) {
  const maxDpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2)
  const [dpr, setDpr] = useState(maxDpr)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduced || !wrapRef.current) return
    return trackPointer(wrapRef.current)
  }, [reduced])

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        flat
        dpr={dpr}
        frameloop={reduced ? 'demand' : visible ? 'always' : 'never'}
        camera={{ position: [0, 0, BASE_CAMERA_Z], fov: CAMERA_FOV, near: 0.1, far: 260 }}
        gl={{ antialias: !lowPower, alpha: true, powerPreference: 'high-performance', stencil: false }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x000000, 0)
          camera.lookAt(0, 0, -8)
          gl.outputColorSpace = THREE.SRGBColorSpace
        }}
        aria-hidden="true"
        style={{ pointerEvents: 'none' }}
      >
        {!reduced && (
          <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(maxDpr)} flipflops={3} onFallback={() => setDpr(1)} />
        )}
        <CameraRig reduced={reduced} />
        <ThemeInvalidator />
        <World lowPower={lowPower} reduced={reduced} />
        {!lowPower && <Sea reduced={reduced} />}
        <NameCubes apply={apply} reduced={reduced} lowPower={lowPower} onReady={onReady} onAssembled={onAssembled} />
      </Canvas>
    </div>
  )
}
