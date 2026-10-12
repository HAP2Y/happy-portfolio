import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { site, person, links } from './src/content.ts'

/**
 * Fills index.html from content.ts so the page title, meta tags and the
 * <noscript> fallback never drift from the rest of the site.
 */
function contentHtml(mode: string): Plugin {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  // General Sans is served by Fontshare (free, ITF licence). Loaded without
  // blocking render; the stack falls back to system grotesks until it lands.
  // The 'artifact' build (used for the hosted preview) bundles Geist instead,
  // because that sandbox only allows Google Fonts.
  const fonts =
    mode === 'artifact'
      ? ''
      : [
          '<link rel="preconnect" href="https://api.fontshare.com" crossorigin />',
          '<link rel="preconnect" href="https://cdn.fontshare.com" crossorigin />',
          '<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=general-sans@500,600&display=swap" media="print" onload="this.media=\'all\'" />',
        ].join('\n    ')

  const noscript = `<noscript>
      <main class="noscript">
        <h1>${esc(person.name)}</h1>
        <p>${esc(person.role)}. ${esc(person.tagline)}</p>
        <p>${esc(person.location)}</p>
        <p><a href="mailto:${esc(person.email)}">${esc(person.email)}</a></p>
        <ul>${links.map((l) => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join('')}</ul>
      </main>
    </noscript>`

  return {
    name: 'content-html',
    transformIndexHtml(html) {
      return html
        .replace(/%SITE_TITLE%/g, esc(site.title))
        .replace(/%SITE_DESCRIPTION%/g, esc(site.description))
        .replace(/%SITE_URL%/g, esc(site.url))
        .replace('<!--FONTS-->', fonts)
        .replace('<!--NOSCRIPT-->', noscript)
    },
  }
}

export default defineConfig(({ mode }) => ({
  // Relative base for the self-contained preview build, root for Vercel.
  base: mode === 'artifact' ? './' : '/',
  plugins: [react(), contentHtml(mode)],
  build: {
    target: 'es2020',
    outDir: mode === 'artifact' ? 'dist-preview' : 'dist',
    chunkSizeWarningLimit: 1000,
  },
}))
