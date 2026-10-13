import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CALM, seaFragment, seaUniforms, seaVertex } from './seaShader'
import { cssVar } from '../lib/env'
import { useTheme } from '../lib/theme'
import { heroScroll } from './shared'

/** The distant ground: a calm Raging Sea that fades into the page colour. */
export function Sea({ reduced }: { reduced: boolean }) {
  const theme = useTheme()
  const geometry = useMemo(() => new THREE.PlaneGeometry(280, 240, 160, 140), [])
  const material = useMemo(() => {
    const u = seaUniforms(CALM)
    u.uDepthColor.value = new THREE.Color()
    u.uSurfaceColor.value = new THREE.Color()
    u.uBg.value = new THREE.Color()
    u.uFade.value = { x: 30, y: 150 }
    return new THREE.ShaderMaterial({
      vertexShader: seaVertex,
      fragmentShader: seaFragment,
      uniforms: u,
      depthWrite: false,
    })
  }, [])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  useEffect(() => {
    const bg = new THREE.Color(cssVar('--bg') || '#f4f3ef')
    const ink = new THREE.Color(cssVar('--ink') || '#0e0e0e')
    const accent = new THREE.Color(cssVar('--accent') || '#7b42bc')
    const dark = theme === 'dark'
    const u = material.uniforms
    ;(u.uBg.value as THREE.Color).copy(bg)
    ;(u.uDepthColor.value as THREE.Color).copy(bg).lerp(ink, dark ? 0.08 : 0.12)
    ;(u.uSurfaceColor.value as THREE.Color).copy(bg).lerp(accent, dark ? 0.16 : 0.12)
  }, [theme, material])

  useFrame((state) => {
    const u = material.uniforms
    if (!reduced) u.uTime.value = state.clock.elapsedTime
    else u.uTime.value = 4
    u.uTravel.value = state.clock.elapsedTime * (reduced ? 0 : 0.55) + heroScroll.progress * 26
  })

  return (
    <mesh geometry={geometry} material={material} rotation-x={-Math.PI / 2} position={[0, -10, -100]} frustumCulled={false} />
  )
}
