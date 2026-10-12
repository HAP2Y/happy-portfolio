import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { NameCubes } from './NameCubes'
import { BASE_CAMERA_Z, CAMERA_FOV } from './shared'

export interface HeroCanvasProps {
  reduced: boolean
  lowPower: boolean
  onReady: () => void
}

export default function HeroCanvas({ reduced, lowPower, onReady }: HeroCanvasProps) {
  const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2)

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
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
        <ambientLight intensity={1.6} />
        <directionalLight position={[4, 6, 8]} intensity={2.2} />
        <directionalLight position={[-6, -2, 4]} intensity={0.6} />
        <NameCubes lowPower={lowPower} onReady={onReady} />
      </Canvas>
    </div>
  )
}
