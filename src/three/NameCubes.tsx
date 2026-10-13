import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { buildNameLayout, type NameLayout } from './textSampler'
import { person } from '../content'
import { cssVar } from '../lib/env'
import { setCursorLabel } from '../lib/cursorStore'
import { useTheme } from '../lib/theme'
import { BASE_CAMERA_Z, pointer } from './shared'

/* ── Tuning knobs ────────────────────────────────────────────────
 * All distances are in "cap heights" (1.0 = height of a capital letter). */
const TUNE = {
  cubesDesktop: 5200, // total cubes in the name on desktop
  cubesLowPower: 1700, // phones and low-power devices
  cubeFill: 0.8, // cube size as a fraction of grid spacing (gaps between cubes)
  assembleSpread: 0.75, // seconds: left → right stagger of the fly-in
  assembleJitter: 0.45, // seconds of random extra delay per cube
  assembleDuration: 0.85, // seconds each cube spends in flight (+ up to 0.45 random)
  repelRadius: 0.62, // cursor influence radius
  repelForce: 95, // push strength
  springK: 70, // spring stiffness back to the letter
  springDamping: 9, // lower = bouncier
  tiltY: 0.16, // radians of yaw at the screen edge
  tiltX: 0.09, // radians of pitch at the screen edge
  bounceHeight: 0.28, // "Happy" hop height
  bounceDuration: 0.5,
}

interface Sim {
  total: number
  start: Float32Array
  offset: Float32Array
  vel: Float32Array
  axis: Float32Array
  rot: Float32Array
  delay: Float32Array
  dur: Float32Array
  arc: Float32Array
  seed: Float32Array
  rest: Uint8Array
  end: number
  applyAt: number | null
  assembled: boolean
  bounceAt: number
  hoverUntil: number
  smileP: number
  hovering: boolean
  firstFrame: boolean
}

function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function createSim(layout: NameLayout): Sim {
  const total = layout.count + layout.smileCount
  const start = new Float32Array(total * 3)
  const axis = new Float32Array(total * 3)
  const rot = new Float32Array(total)
  const delay = new Float32Array(total)
  const dur = new Float32Array(total)
  const arc = new Float32Array(total)
  const seed = new Float32Array(total)
  let end = 0
  for (let i = 0; i < total; i++) {
    const r1 = rand(i + 1), r2 = rand(i + 7.3), r3 = rand(i + 13.7), r4 = rand(i + 21.1)
    // scattered start: a wide shell around the name, biased to come from behind
    const theta = r1 * Math.PI * 2
    const phi = Math.acos(2 * r2 - 1)
    const dist = 5 + r3 * 13
    const i3 = i * 3
    start[i3] = layout.targets[i3] + Math.sin(phi) * Math.cos(theta) * dist * 1.4
    start[i3 + 1] = layout.targets[i3 + 1] + Math.cos(phi) * dist * 0.7
    start[i3 + 2] = layout.targets[i3 + 2] - 3 - r4 * 16
    // random rotation axis
    const ax = rand(i + 3.1) - 0.5, ay = rand(i + 5.9) - 0.5, az = rand(i + 9.4) - 0.5
    const len = Math.hypot(ax, ay, az) || 1
    axis[i3] = ax / len
    axis[i3 + 1] = ay / len
    axis[i3 + 2] = az / len
    rot[i] = 2 + r1 * 4
    delay[i] = layout.nx[i] * TUNE.assembleSpread + r3 * TUNE.assembleJitter
    dur[i] = TUNE.assembleDuration + r4 * 0.45
    arc[i] = (r2 - 0.3) * 2.2
    seed[i] = r1
    end = Math.max(end, delay[i] + dur[i])
  }
  return {
    total, start, axis, rot, delay, dur, arc, seed, end,
    offset: new Float32Array(total * 3),
    vel: new Float32Array(total * 3),
    rest: new Uint8Array(total),
    applyAt: null, assembled: false,
    bounceAt: -10, hoverUntil: -10, smileP: 0, hovering: false, firstFrame: true,
  }
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

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

interface Props {
  apply: boolean
  reduced: boolean
  lowPower: boolean
  onReady: () => void
  onAssembled: () => void
}

export function NameCubes({ apply, reduced, lowPower, onReady, onAssembled }: Props) {
  const { camera, size, invalidate } = useThree()
  const theme = useTheme()
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [layout, setLayout] = useState<NameLayout | null>(null)
  const twoLines = size.width / size.height < 1.1

  // Build (or rebuild on orientation change) the letter layout.
  useEffect(() => {
    let cancelled = false
    buildNameLayout({
      first: person.firstName,
      last: person.lastName,
      twoLines,
      targetCubes: lowPower ? TUNE.cubesLowPower : TUNE.cubesDesktop,
      layers: lowPower ? 1 : 2,
      smile: true,
      fontFamily: cssVar('--font-display') || 'sans-serif',
    }).then((l) => {
      if (!cancelled) setLayout(l)
    })
    return () => {
      cancelled = true
    }
  }, [twoLines, lowPower])

  const sim = useMemo(() => (layout ? createSim(layout) : null), [layout])
  const colorBuffer = useMemo(() => new Float32Array((sim?.total ?? 1) * 3), [sim])
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  // Flat voxel shading: faces toward the camera take the cube colour, side
  // faces fade toward the page colour so each cube reads as a cube.
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uBg: { value: new THREE.Color() }, uSide: { value: 0.55 } },
        vertexShader: /* glsl */ `
          varying vec3 vColor;
          varying vec3 vN;
          void main() {
            vN = normalize(normalMatrix * mat3(instanceMatrix) * normal);
            #ifdef USE_INSTANCING_COLOR
              vColor = instanceColor;
            #else
              vColor = vec3(1.0);
            #endif
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uBg;
          uniform float uSide;
          varying vec3 vColor;
          varying vec3 vN;
          void main() {
            vec3 n = normalize(vN);
            float side = (1.0 - abs(n.z)) * uSide + max(n.y, 0.0) * 0.12;
            gl_FragColor = vec4(mix(vColor, uBg, clamp(side, 0.0, 1.0)), 1.0);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  )
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  // Theme colours (linear space) read from CSS tokens.
  const colors = useMemo(() => {
    const bg = new THREE.Color(cssVar('--bg') || '#f4f3ef')
    const ink = new THREE.Color(cssVar('--ink') || '#0e0e0e')
    const accent = new THREE.Color(cssVar('--accent') || '#7b42bc')
    const faint = bg.clone().lerp(ink, 0.28)
    material.uniforms.uBg.value.copy(bg)
    return { ink, accent, faint, theme }
  }, [theme, material])

  // Signal readiness once cubes exist.
  useEffect(() => {
    if (!sim) return
    if (reduced) {
      sim.applyAt = -999
      sim.assembled = true
    }
    sim.firstFrame = true
    for (let i = 0; i < sim.total; i++) sim.rest[i] = 0
    onReady()
    invalidate()
  }, [sim, reduced, onReady, invalidate])

  // Repaint when theme changes (all cubes need new colours).
  useEffect(() => {
    if (!sim) return
    sim.firstFrame = true
    for (let i = 0; i < sim.total; i++) sim.rest[i] = 0
    invalidate()
  }, [colors, sim, invalidate])

  const ray = useMemo(() => new THREE.Raycaster(), [])
  const tmp = useMemo(
    () => ({
      ndc: new THREE.Vector2(),
      inv: new THREE.Matrix4(),
      localRay: new THREE.Ray(),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      hit: new THREE.Vector3(),
    }),
    [],
  )

  useFrame((state, rawDt) => {
    const mesh = meshRef.current
    const group = groupRef.current
    if (!mesh || !group || !sim || !layout || !mesh.instanceColor) return
    const dt = Math.min(rawDt, 1 / 30)
    const t = state.clock.elapsedTime

    // Start the fly-in when the terminal says so.
    if (apply && sim.applyAt === null) sim.applyAt = t
    const phaseT = sim.applyAt === null ? -1 : t - sim.applyAt
    if (!sim.assembled && sim.applyAt !== null && phaseT > sim.end) {
      sim.assembled = true
      onAssembled()
    }

    // Fit the name to the viewport (independent of the scroll dolly).
    const cam = camera as THREE.PerspectiveCamera
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * BASE_CAMERA_Z
    const visW = visH * cam.aspect
    const scale = Math.min(
      (visW * (twoLines ? 0.8 : 0.84)) / layout.width,
      (visH * (twoLines ? 0.33 : 0.3)) / layout.height,
    )
    group.scale.setScalar(scale)
    group.position.y = visH * (twoLines ? 0.07 : 0.035)

    // Parallax tilt
    const interactive = sim.assembled && !reduced
    if (!reduced) {
      const k = Math.min(1, dt * 3)
      const tx = pointer.active ? pointer.x : 0
      const ty = pointer.active ? pointer.y : 0
      group.rotation.y += (tx * TUNE.tiltY - group.rotation.y) * k
      group.rotation.x += (-ty * TUNE.tiltX - group.rotation.x) * k
    }
    group.updateMatrixWorld()

    // Cursor → point on the name's plane (local space)
    let hx = 0, hy = 0, hasHit = false
    if (interactive && pointer.active) {
      tmp.ndc.set(pointer.x, pointer.y)
      ray.setFromCamera(tmp.ndc, camera)
      tmp.inv.copy(group.matrixWorld).invert()
      tmp.localRay.copy(ray.ray).applyMatrix4(tmp.inv)
      if (tmp.localRay.intersectPlane(tmp.plane, tmp.hit)) {
        hx = tmp.hit.x
        hy = tmp.hit.y
        hasHit = true
      }
    }

    // Easter egg: hovering "Happy" bounces the letters and draws a smile.
    const hb = layout.happy
    const overHappy = hasHit && hx > hb.minX - 0.15 && hx < hb.maxX + 0.15 && hy > hb.minY - 0.35 && hy < hb.maxY + 0.15
    if (overHappy) {
      if (!sim.hovering && t - sim.bounceAt > 1.1) sim.bounceAt = t
      sim.hovering = true
      sim.hoverUntil = t + 0.5
    } else if (sim.hovering && t > sim.hoverUntil) {
      sim.hovering = false
    }
    if (!reduced) setCursorLabel(overHappy ? ':)' : null)
    const smileTarget = sim.hovering ? 1 : 0
    const smileStep = dt / 0.45
    sim.smileP = smileTarget > sim.smileP ? Math.min(1, sim.smileP + smileStep) : Math.max(0, sim.smileP - smileStep)

    const m = mesh.instanceMatrix.array as Float32Array
    const col = mesh.instanceColor!.array as Float32Array
    const T = layout.targets
    const { start: S, offset: O, vel: V, axis: A } = sim
    const cs = layout.cell * TUNE.cubeFill
    const R = TUNE.repelRadius, R2 = R * R
    const { springK: K, springDamping: C, repelForce: P } = TUNE
    const { ink, accent, faint } = colors
    const happyLetters = person.firstName.length
    const bounceT = t - sim.bounceAt
    let changed = sim.firstFrame

    for (let i = 0; i < sim.total; i++) {
      const i3 = i * 3
      const tx = T[i3], ty = T[i3 + 1], tz = T[i3 + 2]
      const letter = layout.letter[i]
      let px: number, py: number, pz: number, angle: number, s: number
      let cr: number, cg: number, cb: number

      if (letter === -1) {
        // smile cube
        const local = clamp01((sim.smileP - layout.nx[i] * 0.45) / 0.55)
        if (local <= 0 && sim.rest[i]) continue
        sim.rest[i] = local <= 0 ? 1 : 0
        const e = local * local * (3 - 2 * local)
        px = tx; py = ty - (1 - e) * 0.12; pz = tz
        angle = (1 - e) * 1.2
        s = e * cs * 0.9
        cr = accent.r; cg = accent.g; cb = accent.b
        changed = true
      } else if (!sim.assembled && phaseT < sim.delay[i]) {
        // scattered, waiting to be provisioned
        if (reduced) continue
        const sd = sim.seed[i] * 6.283
        px = S[i3] + Math.sin(t * 0.35 + sd) * 0.25
        py = S[i3 + 1] + Math.cos(t * 0.3 + sd) * 0.25
        pz = S[i3 + 2]
        angle = sd + t * 0.4
        s = cs * 0.5
        cr = faint.r; cg = faint.g; cb = faint.b
        changed = true
      } else if (!sim.assembled && phaseT < sim.delay[i] + sim.dur[i]) {
        // in flight
        const p = clamp01((phaseT - sim.delay[i]) / sim.dur[i])
        const e = 1 - Math.pow(1 - p, 4)
        px = S[i3] + (tx - S[i3]) * e
        py = S[i3 + 1] + (ty - S[i3 + 1]) * e + Math.sin(p * Math.PI) * sim.arc[i] * (1 - e)
        pz = S[i3 + 2] + (tz - S[i3 + 2]) * e
        angle = (1 - e) * sim.rot[i]
        s = cs * (0.5 + 0.5 * e)
        const c = clamp01((p - 0.7) / 0.3)
        cr = accent.r + (ink.r - accent.r) * c
        cg = accent.g + (ink.g - accent.g) * c
        cb = accent.b + (ink.b - accent.b) * c
        changed = true
      } else {
        // provisioned: spring back to the letter, pushed by the cursor
        let ox = O[i3], oy = O[i3 + 1], oz = O[i3 + 2]
        let vx = V[i3], vy = V[i3 + 1], vz = V[i3 + 2]
        let bounceY = 0
        if (interactive) {
          if (hasHit) {
            const dx = tx + ox - hx, dy = ty + oy - hy
            const d2 = dx * dx + dy * dy
            if (d2 < R2) {
              const d = Math.sqrt(d2) + 1e-4
              const f = 1 - d / R
              const force = f * f * P
              vx += (dx / d) * force * dt
              vy += (dy / d) * force * dt
              vz += force * 0.6 * dt
            }
          }
          vx += (-K * ox - C * vx) * dt
          vy += (-K * oy - C * vy) * dt
          vz += (-K * oz - C * vz) * dt
          ox += vx * dt; oy += vy * dt; oz += vz * dt
          if (letter >= 0 && letter < happyLetters) {
            const tb = bounceT - letter * 0.07
            if (tb > 0 && tb < TUNE.bounceDuration) bounceY = TUNE.bounceHeight * Math.sin((Math.PI * tb) / TUNE.bounceDuration)
          }
        }
        const moving = Math.abs(ox) + Math.abs(oy) + Math.abs(oz) + Math.abs(vx) + Math.abs(vy) + Math.abs(vz) > 1e-4 || bounceY !== 0
        if (!moving) {
          ox = oy = oz = vx = vy = vz = 0
          O[i3] = O[i3 + 1] = O[i3 + 2] = 0
          V[i3] = V[i3 + 1] = V[i3 + 2] = 0
          if (sim.rest[i] && !sim.firstFrame) continue
          sim.rest[i] = 1
        } else {
          sim.rest[i] = 0
          O[i3] = ox; O[i3 + 1] = oy; O[i3 + 2] = oz
          V[i3] = vx; V[i3 + 1] = vy; V[i3 + 2] = vz
        }
        const disp = Math.sqrt(ox * ox + oy * oy + oz * oz)
        px = tx + ox; py = ty + oy + bounceY; pz = tz + oz
        angle = Math.min(disp * 2.5, 1.6)
        s = cs
        const c = Math.min(disp * 1.6, 1) * 0.85
        cr = ink.r + (accent.r - ink.r) * c
        cg = ink.g + (accent.g - ink.g) * c
        cb = ink.b + (accent.b - ink.b) * c
        changed = true
      }

      writeMatrix(m, i * 16, px, py, pz, A[i3], A[i3 + 1], A[i3 + 2], angle, s)
      col[i3] = cr; col[i3 + 1] = cg; col[i3 + 2] = cb
    }

    sim.firstFrame = false
    if (changed) {
      mesh.instanceMatrix.needsUpdate = true
      mesh.instanceColor!.needsUpdate = true
    }
  })

  // Clear the cursor label when the scene unmounts
  useEffect(() => () => setCursorLabel(null), [])

  if (!layout || !sim) return null
  return (
    <group ref={groupRef}>
      <instancedMesh
        key={`${layout.lines}-${sim.total}`}
        ref={meshRef}
        args={[geometry, material, sim.total]}
        frustumCulled={false}
      >
        <instancedBufferAttribute attach="instanceColor" args={[colorBuffer, 3]} usage={THREE.DynamicDrawUsage} />
      </instancedMesh>
    </group>
  )
}
