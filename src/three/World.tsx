import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cssVar } from '../lib/env'
import { useTheme } from '../lib/theme'
import { BASE_CAMERA_Z, heroScroll, pointer } from './shared'

/**
 * The infinite infrastructure graph behind the name.
 *
 * Space is an endless lattice of cells. Whether a cell holds a node, and
 * whether two neighbouring nodes are linked, comes from a deterministic hash
 * of the cell coordinates, so any chunk can be regenerated identically and
 * links across chunk borders line up.
 *
 * A fixed pool of chunks is allocated once. As the world flows toward the
 * camera, the chunk that passes behind it is rewritten in place as the next
 * chunk ahead (new data into the same typed arrays), so the world never ends
 * and never allocates after start-up.
 */

const WORLD = {
  cell: 4.5, // spacing of the lattice
  xCells: 7, // nodes span -xCells..xCells
  yMin: -1,
  yMax: 2,
  zCellsPerChunk: 6,
  chunksDesktop: 6,
  chunksLowPower: 4,
  density: 0.3, // chance a cell holds a node
  linkChance: 0.55, // chance a node links to a given +x/+y/+z neighbour
  accentChance: 0.025, // rare "active resource" nodes in the accent colour
  jitter: 1.2,
  driftSpeed: 0.55, // units per second of ambient travel
  scrollTravel: 26, // extra units travelled across the full hero scroll
  pointSize: 3.2,
  nodeAlpha: 0.5,
  lineAlpha: 0.13,
}

function hash(x: number, y: number, z: number, salt: number): number {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(z | 0, 0x9e3779b1) ^ Math.imul(salt, 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39)
  h ^= h >>> 15
  return (h >>> 0) / 4294967296
}

const exists = (cx: number, cy: number, cz: number) => {
  // keep a clear tunnel down the camera axis so the name stays readable
  if (Math.abs(cx) <= 1 && cy === 0) return false
  return hash(cx, cy, cz, 1) < WORLD.density
}

function nodePos(cx: number, cy: number, cz: number, out: Float32Array, o: number) {
  out[o] = cx * WORLD.cell + (hash(cx, cy, cz, 2) - 0.5) * WORLD.jitter
  out[o + 1] = cy * WORLD.cell + (hash(cx, cy, cz, 3) - 0.5) * WORLD.jitter
  out[o + 2] = -cz * WORLD.cell + (hash(cx, cy, cz, 4) - 0.5) * WORLD.jitter
}

interface Chunk {
  index: number
  points: THREE.Points
  lines: THREE.LineSegments
  pPos: Float32Array
  pKind: Float32Array
  lPos: Float32Array
}

const vertexShared = /* glsl */ `
  uniform float uNear;
  uniform float uFar;
  varying float vAlpha;
  float depthFade(vec4 mv) {
    float d = -mv.z;
    return smoothstep(uNear * 0.4, uNear, d) * (1.0 - smoothstep(uFar * 0.45, uFar, d));
  }
`

function makePointMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uInk: { value: new THREE.Color() },
      uAccent: { value: new THREE.Color() },
      uTime: { value: 0 },
      uSize: { value: WORLD.pointSize },
      uPixelRatio: { value: 1 },
      uAlpha: { value: WORLD.nodeAlpha },
      uNear: { value: 12 },
      uFar: { value: 120 },
    },
    vertexShader: /* glsl */ `
      ${vertexShared}
      uniform float uTime;
      uniform float uSize;
      uniform float uPixelRatio;
      attribute float aKind;
      varying float vKind;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vAlpha = depthFade(mv);
        vKind = aKind;
        float pulse = aKind > 0.5 ? 1.5 + 0.35 * sin(uTime * 1.6 + position.x * 0.7) : 1.0;
        gl_PointSize = max(1.0, uSize * pulse * uPixelRatio * (12.0 / -mv.z));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk;
      uniform vec3 uAccent;
      uniform float uAlpha;
      varying float vAlpha;
      varying float vKind;
      void main() {
        if (vAlpha < 0.01) discard;
        vec3 c = mix(uInk, uAccent, vKind);
        gl_FragColor = vec4(c, vAlpha * mix(uAlpha, 0.9, vKind));
        #include <colorspace_fragment>
      }
    `,
  })
}

function makeLineMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uInk: { value: new THREE.Color() },
      uAlpha: { value: WORLD.lineAlpha },
      uNear: { value: 12 },
      uFar: { value: 120 },
    },
    vertexShader: /* glsl */ `
      ${vertexShared}
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vAlpha = depthFade(mv);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk;
      uniform float uAlpha;
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4(uInk, vAlpha * uAlpha);
        #include <colorspace_fragment>
      }
    `,
  })
}

export function World({ lowPower, reduced }: { lowPower: boolean; reduced: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const { gl, invalidate } = useThree()
  const theme = useTheme()
  const chunkCount = lowPower ? WORLD.chunksLowPower : WORLD.chunksDesktop
  const xCells = lowPower ? WORLD.xCells - 2 : WORLD.xCells
  const chunkDepth = WORLD.zCellsPerChunk * WORLD.cell
  const farFade = chunkDepth * (chunkCount - 1.5)

  const materials = useMemo(() => ({ points: makePointMaterial(), lines: makeLineMaterial() }), [])

  // Allocate the chunk pool once.
  const chunks = useMemo<Chunk[]>(() => {
    const ys = WORLD.yMax - WORLD.yMin + 1
    const maxNodes = (xCells * 2 + 1) * ys * WORLD.zCellsPerChunk
    const list: Chunk[] = []
    for (let k = 0; k < chunkCount; k++) {
      const pPos = new Float32Array(maxNodes * 3)
      const pKind = new Float32Array(maxNodes)
      const lPos = new Float32Array(maxNodes * 3 * 2 * 3)
      const pg = new THREE.BufferGeometry()
      pg.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage))
      pg.setAttribute('aKind', new THREE.BufferAttribute(pKind, 1).setUsage(THREE.DynamicDrawUsage))
      const lg = new THREE.BufferGeometry()
      lg.setAttribute('position', new THREE.BufferAttribute(lPos, 3).setUsage(THREE.DynamicDrawUsage))
      const points = new THREE.Points(pg, materials.points)
      const lines = new THREE.LineSegments(lg, materials.lines)
      points.frustumCulled = false
      lines.frustumCulled = false
      list.push({ index: Number.NaN, points, lines, pPos, pKind, lPos })
    }
    return list
  }, [chunkCount, xCells, materials])

  // Fill a pooled chunk with the data for lattice chunk `index`.
  const fill = useMemo(() => {
    const tmpA = new Float32Array(3)
    const tmpB = new Float32Array(3)
    // +x, +y, +z neighbour offsets and the hash salt for each link
    const neighbours: [number, number, number, number][] = [
      [1, 0, 0, 5],
      [0, 1, 0, 6],
      [0, 0, 1, 8],
    ]
    return (c: Chunk, index: number) => {
      c.index = index
      let n = 0
      let l = 0
      const z0 = index * WORLD.zCellsPerChunk
      for (let cz = z0; cz < z0 + WORLD.zCellsPerChunk; cz++) {
        for (let cy = WORLD.yMin; cy <= WORLD.yMax; cy++) {
          for (let cx = -xCells; cx <= xCells; cx++) {
            if (!exists(cx, cy, cz)) continue
            nodePos(cx, cy, cz, c.pPos, n * 3)
            c.pKind[n] = hash(cx, cy, cz, 7) < WORLD.accentChance ? 1 : 0
            n++
            nodePos(cx, cy, cz, tmpA, 0)
            for (const [ox, oy, oz, salt] of neighbours) {
              const nx = cx + ox, ny = cy + oy, nz = cz + oz
              if (nx > xCells || ny > WORLD.yMax) continue
              if (!exists(nx, ny, nz) || hash(cx, cy, cz, salt) > WORLD.linkChance) continue
              nodePos(nx, ny, nz, tmpB, 0)
              c.lPos.set(tmpA, l * 6)
              c.lPos.set(tmpB, l * 6 + 3)
              l++
            }
          }
        }
      }
      const pg = c.points.geometry
      const lg = c.lines.geometry
      pg.setDrawRange(0, n)
      lg.setDrawRange(0, l * 2)
      ;(pg.attributes.position as THREE.BufferAttribute).needsUpdate = true
      ;(pg.attributes.aKind as THREE.BufferAttribute).needsUpdate = true
      ;(lg.attributes.position as THREE.BufferAttribute).needsUpdate = true
    }
  }, [xCells])

  // Initial chunks: one just behind the camera, the rest ahead.
  useEffect(() => {
    chunks.forEach((c, k) => fill(c, k - 1))
    const g = groupRef.current
    if (g) chunks.forEach((c) => g.add(c.lines, c.points))
    invalidate()
    return () => {
      chunks.forEach((c) => {
        c.points.geometry.dispose()
        c.lines.geometry.dispose()
        g?.remove(c.lines, c.points)
      })
    }
  }, [chunks, fill, invalidate])

  useEffect(() => () => {
    materials.points.dispose()
    materials.lines.dispose()
  }, [materials])

  // Theme colours
  useEffect(() => {
    const ink = new THREE.Color(cssVar('--ink') || '#0e0e0e')
    const accent = new THREE.Color(cssVar('--accent') || '#7b42bc')
    materials.points.uniforms.uInk.value.copy(ink)
    materials.points.uniforms.uAccent.value.copy(accent)
    materials.lines.uniforms.uInk.value.copy(ink)
    const dark = theme === 'dark'
    materials.points.uniforms.uAlpha.value = dark ? WORLD.nodeAlpha * 0.8 : WORLD.nodeAlpha
    materials.lines.uniforms.uAlpha.value = dark ? WORLD.lineAlpha * 1.2 : WORLD.lineAlpha
    invalidate()
  }, [theme, materials, invalidate])

  useEffect(() => {
    materials.points.uniforms.uPixelRatio.value = gl.getPixelRatio()
    materials.points.uniforms.uFar.value = farFade
    materials.lines.uniforms.uFar.value = farFade
  }, [gl, materials, farFade])

  const travel = useRef(0)
  const drift = useRef(0)

  useFrame((state, rawDt) => {
    const g = groupRef.current
    if (!g) return
    const dt = Math.min(rawDt, 1 / 30)
    if (!reduced) drift.current += dt * WORLD.driftSpeed
    const target = drift.current + heroScroll.progress * WORLD.scrollTravel
    travel.current += (target - travel.current) * Math.min(1, dt * 4)
    g.position.z = travel.current
    materials.points.uniforms.uTime.value = state.clock.elapsedTime

    // gentle parallax + a slow sideways sway so the drift feels alive
    if (!reduced) {
      const t = state.clock.elapsedTime
      const px = (pointer.active ? -pointer.x : 0) * 1.2 + Math.sin(t * 0.05) * 1.5
      const py = (pointer.active ? -pointer.y : 0) * 0.6
      g.position.x += (px - g.position.x) * Math.min(1, dt * 1.5)
      g.position.y += (py - g.position.y) * Math.min(1, dt * 1.5)
    }

    // Recycle chunks that have flowed behind the camera.
    const camZ = BASE_CAMERA_Z
    for (const c of chunks) {
      const farEdge = -(c.index + 1) * chunkDepth + travel.current
      if (farEdge > camZ + 2) {
        let maxIndex = -Infinity
        for (const o of chunks) maxIndex = Math.max(maxIndex, o.index)
        fill(c, maxIndex + 1)
      }
    }
  })

  return <group ref={groupRef} />
}
