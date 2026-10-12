import { useEffect } from 'react'
import { useReducedMotion } from './lib/env'
import { initSmoothScroll } from './lib/scroll'

export function App() {
  const reduced = useReducedMotion()

  // Smooth scroll (off for reduced motion)
  useEffect(() => {
    if (reduced) return
    return initSmoothScroll()
  }, [reduced])

  return (
    <main id="main">
      <h1>Happy Patel</h1>
      <p>Provisioning…</p>
      {/* temporary: something to scroll through */}
      <div style={{ height: '300vh' }} />
    </main>
  )
}
