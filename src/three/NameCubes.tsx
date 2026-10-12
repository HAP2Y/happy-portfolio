import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { buildNameLayout, type NameLayout } from './textSampler'
import { person } from '../content'
import { cssVar } from '../lib/env'
import { useTheme } from '../lib/theme'
import { BASE_CAMERA_Z } from './shared'

/* ── Tuning knobs ────────────────────────────────────────────────
 * All distances are in "cap heights" (1.0 = height of a capital letter). */
const TUNE = {
  cubesDesktop: 5200, // total cubes in the name on desktop
  cubesLowPower: 1700, // phones and low-power devices
  cubeFill: 0.8, // cube size as a fraction of grid spacing (gaps between cubes)
}

/** Writes a column-major 4×4 (axis-angle rotation, uniform scale, translation). */
function writeMatrix(m: Float32Array, o: number, px: number, py: number, pz: number, ax: number, ay: number, az: number, angle: number, s: number) {
  if (s <= 0) {
    m.fill(0, o, o + 16)
    return
  }
  const h = angle * 0.5
  const sn = Math.sin(h)
  const x = ax * sn, y = ay * sn, z = az * sn, w = Math.cos(h)
  const x2 = x + x, y2 = y + y, z2 = z + z
  const xx = x * x2, xy = x * y2, xz = x * z2
  const yy = y * y2, yz = y * z2, zz = z * z2
  const wx = w * x2, wy = w * y2, wz = w * z2
  m[o] = (1 - (yy + zz)) * s; m[o + 1] = (xy + wz) * s; m[o + 2] = (xz - wy) * s; m[o + 3] = 0
  m[o + 4] = (xy - wz) * s; m[o + 5] = (1 - (xx + zz)) * s; m[o + 6] = (yz + wx) * s; m[o + 7] = 0
  m[o + 8] = (xz + wy) * s; m[o + 9] = (yz - wx) * s; m[o + 10] = (1 - (xx + yy)) * s; m[o + 11] = 0
  m[o + 12] = px; m[o + 13] = py; m[o + 14] = pz; m[o + 15] = 1
}

interface Props {
  lowPower: boolean
  onReady: () => void
}

export function NameCubes({ lowPower, onReady }: Props) {
  const { camera, size, invalidate } = useThree()
  const theme = useTheme()
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [layout, setLayout] = useState<NameLayout | null>(null)
  const twoLines = size.width / size.height < 1.1
  const dirty = useRef(true)

  // Build (or rebuild on orientation change) the letter layout.
  useEffect(() => {
    let cancelled = false
    buildNameLayout({
      first: person.firstName,
      last: person.lastName,
      twoLines,
      targetCubes: lowPower ? TUNE.cubesLowPower : TUNE.cubesDesktop,
      layers: lowPower ? 1 : 2,
      smile: false,
      fontFamily: cssVar('--font-display') || 'sans-serif',
    }).then((l) => {
      if (!cancelled) setLayout(l)
    })
    return () => {
      cancelled = true
    }
  }, [twoLines, lowPower])

  const total = layout ? layout.count + layout.smileCount : 0
  const colorBuffer = useMemo(() => new Float32Array(Math.max(1, total) * 3), [total])
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const material = useMemo(() => new THREE.MeshLambertMaterial({ color: '#ffffff' }), [])
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  // Theme colour (linear space) read from the CSS token.
  const ink = useMemo(() => {
    void theme // recompute when the theme flips
    return new THREE.Color(cssVar('--ink') || '#0e0e0e')
  }, [theme])

  // Cubes exist: tell the hero.
  useEffect(() => {
    if (!layout) return
    dirty.current = true
    onReady()
    invalidate()
  }, [layout, onReady, invalidate])

  // Repaint when the theme changes.
  useEffect(() => {
    dirty.current = true
    invalidate()
  }, [ink, invalidate])

  useFrame(() => {
    const mesh = meshRef.current
    const group = groupRef.current
    if (!mesh || !group || !layout || !mesh.instanceColor) return

    // Fit the name to the viewport.
    const cam = camera as THREE.PerspectiveCamera
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * BASE_CAMERA_Z
    const visW = visH * cam.aspect
    const scale = Math.min(
      (visW * (twoLines ? 0.8 : 0.84)) / layout.width,
      (visH * (twoLines ? 0.33 : 0.3)) / layout.height,
    )
    group.scale.setScalar(scale)
    group.position.y = visH * (twoLines ? 0.07 : 0.035)

    // Write every cube once (and again after a theme change).
    if (!dirty.current) return
    dirty.current = false
    const m = mesh.instanceMatrix.array as Float32Array
    const col = mesh.instanceColor.array as Float32Array
    const T = layout.targets
    const cs = layout.cell * TUNE.cubeFill
    for (let i = 0; i < total; i++) {
      const i3 = i * 3
      writeMatrix(m, i * 16, T[i3], T[i3 + 1], T[i3 + 2], 0, 0, 1, 0, cs)
      col[i3] = ink.r; col[i3 + 1] = ink.g; col[i3 + 2] = ink.b
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.instanceColor.needsUpdate = true
  })

  if (!layout) return null
  return (
    <group ref={groupRef}>
      <instancedMesh
        key={`${layout.lines}-${total}`}
        ref={meshRef}
        args={[geometry, material, total]}
        frustumCulled={false}
      >
        <instancedBufferAttribute attach="instanceColor" args={[colorBuffer, 3]} usage={THREE.DynamicDrawUsage} />
      </instancedMesh>
    </group>
  )
}
