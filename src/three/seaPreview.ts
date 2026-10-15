import * as THREE from 'three'
import { ORIGINAL, seaFragment, seaUniforms, seaVertex } from './seaShader'
import { cssVar } from '../lib/env'

/**
 * Mini Raging Sea for project card 04: the original repo's plane (2×2,
 * 512² segments → 256² here), camera and wave parameters, recoloured to
 * the site palette. Plain three.js, no React, one small WebGL context.
 */
export interface SeaPreview {
  start(): void
  stop(): void
  refreshColors(): void
  dispose(): void
}

export function createSeaPreview(canvas: HTMLCanvasElement): SeaPreview {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  const scene = new THREE.Scene()
  // the original repo's view: camera at (1, 1, 1) looking at the origin
  const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 100)
  camera.position.set(1, 1, 1)
  camera.lookAt(0, 0, 0)

  const uniforms = seaUniforms(ORIGINAL)
  uniforms.uDepthColor.value = new THREE.Color()
  uniforms.uSurfaceColor.value = new THREE.Color()
  uniforms.uBg.value = new THREE.Color()
  uniforms.uFade.value = { x: 2.2, y: 4.2 }
  const material = new THREE.ShaderMaterial({ vertexShader: seaVertex, fragmentShader: seaFragment, uniforms })
  const geometry = new THREE.PlaneGeometry(4, 4, 256, 256)
  const water = new THREE.Mesh(geometry, material)
  water.rotation.x = -Math.PI * 0.5
  scene.add(water)

  let lastNow = 0
  let raf = 0
  let running = false
  let time = 2.4 // the still frame

  const resize = () => {
    const r = canvas.getBoundingClientRect()
    if (!r.width || !r.height) return
    renderer.setSize(r.width, r.height, false)
    camera.aspect = r.width / r.height
    camera.updateProjectionMatrix()
    render()
  }

  const render = () => {
    uniforms.uTime.value = time
    renderer.render(scene, camera)
  }

  const refreshColors = () => {
    const bg = new THREE.Color(cssVar('--bg') || '#f4f3ef')
    const dark = document.documentElement.dataset.theme === 'dark' ||
      (!document.documentElement.dataset.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const ink = new THREE.Color(cssVar('--ink') || '#0e0e0e')
    const accent = new THREE.Color(cssVar('--accent') || '#7b42bc')
    ;(uniforms.uBg.value as THREE.Color).copy(bg)
    // The original goes deep blue → pale blue. Same structure, in the site's violet.
    const deep = dark ? bg.clone().lerp(accent, 0.32) : ink.clone().lerp(accent, 0.5)
    const crest = dark ? accent.clone().lerp(ink, 0.45) : bg.clone().lerp(accent, 0.28)
    ;(uniforms.uDepthColor.value as THREE.Color).copy(deep)
    ;(uniforms.uSurfaceColor.value as THREE.Color).copy(crest)
    renderer.setClearColor(bg)
    render()
  }

  const loop = (now: number) => {
    if (lastNow) time += Math.min(0.05, (now - lastNow) / 1000)
    lastNow = now
    render()
    raf = requestAnimationFrame(loop)
  }

  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  refreshColors()
  resize()

  return {
    start() {
      if (running) return
      running = true
      lastNow = 0
      raf = requestAnimationFrame(loop)
    },
    stop() {
      running = false
      cancelAnimationFrame(raf)
    },
    refreshColors,
    dispose() {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
