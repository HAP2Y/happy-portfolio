import { useEffect } from 'react'
import { Header } from './components/Header'
import { Cursor } from './components/Cursor'
import { Wipe } from './components/Wipe'
import { Toast, initMagnetic, initReveals } from './components/ui'
import { Hero } from './sections/hero/Hero'
import { About } from './sections/about/About'
import { Work } from './sections/work/Work'
import { useReducedMotion } from './lib/env'
import { ScrollTrigger, initSmoothScroll } from './lib/scroll'

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

  // Late font loads change text widths: re-measure pinned sections.
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Work />
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
