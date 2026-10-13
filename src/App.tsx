import { useEffect } from 'react'
import { Header } from './components/Header'
import { Cursor } from './components/Cursor'
import { Wipe } from './components/Wipe'
import { Toast, initMagnetic, initReveals } from './components/ui'
import { Hero } from './sections/hero/Hero'
import { About } from './sections/about/About'
import { useReducedMotion } from './lib/env'
import { initSmoothScroll } from './lib/scroll'

export function App() {
  const reduced = useReducedMotion()

  // Smooth scroll (off for reduced motion)
  useEffect(() => {
    if (reduced) return
    return initSmoothScroll()
  }, [reduced])

  // Heading reveals + magnetic links
  useEffect(() => {
    const offReveal = initReveals(reduced)
    const offMagnetic = initMagnetic()
    return () => {
      offReveal()
      offMagnetic()
    }
  }, [reduced])

  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <About />
        {/* placeholder until the real section lands */}
        <section id="work" className="section wrap" style={{ minHeight: '100svh' }}>
          <p className="label">work</p>
        </section>
        {/* placeholder until the real section lands */}
        <section id="experience" className="section wrap" style={{ minHeight: '100svh' }}>
          <p className="label">experience</p>
        </section>
        {/* placeholder until the real section lands */}
        <section id="contact" className="section wrap" style={{ minHeight: '100svh' }}>
          <p className="label">contact</p>
        </section>
      </main>
      <Wipe />
      <Toast />
      <Cursor />
    </>
  )
}
