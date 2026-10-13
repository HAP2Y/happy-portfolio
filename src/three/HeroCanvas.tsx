import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { NameCubes } from './NameCubes'
import { World } from './World'
import { BASE_CAMERA_Z, CAMERA_FOV, trackPointer } from './shared'

export interface HeroCanvasProps {
  apply: boolean
  reduced: boolean
  lowPower: boolean
  onReady: () => void
  onAssembled: () => void
}

export default function HeroCanvas({ apply, reduced, lowPower, onReady, onAssembled }: HeroCanvasProps) {
  const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2)
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
        frameloop={reduced ? 'demand' : 'always'}
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
        <World lowPower={lowPower} reduced={reduced} />
        <NameCubes apply={apply} reduced={reduced} lowPower={lowPower} onReady={onReady} onAssembled={onAssembled} />
      </Canvas>
    </div>
  )
}
