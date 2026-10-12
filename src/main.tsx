import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/jetbrains-mono'
import './styles/tokens.css'
import './styles/global.css'
import { App } from './App'

// The hosted preview can't load Fontshare, so it bundles Geist as the display face.
if (import.meta.env.MODE === 'artifact') import('@fontsource-variable/geist')

document.documentElement.classList.add('js')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
