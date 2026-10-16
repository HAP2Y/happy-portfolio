# hap2y.vercel.app: "Provisioning Happy"

Personal site for Happy Patel, Platform / DevOps Engineer.
Vite + React 19 + TypeScript, React Three Fiber for the 3D, GSAP ScrollTrigger + Lenis for scroll, CSS modules on design tokens.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build → dist/
npm run preview    # serve dist/ locally
```

Node 20+ recommended.

---

## Edit the content

**Everything you'd want to change lives in [`src/content.ts`](src/content.ts):** bio, tagline, tools, projects, cert, roles, links, the terminal lines, the terraform plan on card 01, the SmartSort lanes, and the triage tickets. Page `<title>`, meta description, Open Graph tags and the `<noscript>` fallback are generated from it at build time, so they never drift.

Placeholders to fill in (search for `✎`):

| Field | Where |
| --- | --- |
| `site.url` | your production URL (canonical + `og:image`) |
| `cert.credentialId`, `cert.verifyUrl` | credential ID and Credly link for the Terraform Associate card |
| Bullets for *Platform Support Engineer* and *Technical Support Engineer* | inferred from your summary; replace with specifics |

Other files:

- **Résumé:** `public/Happy-Patel-Resume.pdf` (currently your LinkedIn export). Swap the file and keep the name, or change `person.resume`.
- **Social preview:** `public/og.png` (1200×630).
- **Colours, type, spacing:** `src/styles/tokens.css`. The light palette is on `:root`; dark mode redefines the same tokens. The 3D scene reads `--bg`, `--ink` and `--accent` from CSS, so changing a token recolours the WebGL too.
- **Card 01 plan:** the module creates 7 resources per repo (it also manages `.gitignore`), but the card shows the 6 you specified, ending in "Plan: 6 to add". Edit `repoFactory.plan` if you want it exact.

## Fonts

- **Display:** General Sans, loaded from Fontshare without blocking render (`vite.config.ts`). To self-host it instead, download the woff2 files from fontshare.com, add an `@font-face` in `src/styles/global.css`, and delete the Fontshare `<link>`s in the config.
- **Mono:** JetBrains Mono, bundled via `@fontsource-variable/jetbrains-mono`.

## Deploy (Vercel)

1. Push this folder to a GitHub repo.
2. In Vercel: **Add New → Project → import the repo**. Framework preset: **Vite**. Build `npm run build`, output `dist`. `vercel.json` already sets these, plus long-cache headers for `/assets`.
3. Or from your machine: `npx vercel` then `npx vercel --prod`.

## Testing switches

| URL / setting | Effect |
| --- | --- |
| `?quality=high` | Force the full 3D tier (5,200 cubes, 2 layers, sea plane, AA) |
| `?quality=low` | Force the phone tier (~1,700 cubes, 1 layer, no sea, DPR ≤ 1.5) |
| `?webgl=0` | Typographic fallback, as seen with no WebGL |
| OS "reduce motion" | Static name, no drift, no Lenis, no pin, pre-rendered card states |
| OS dark mode / toggle | Theme. The toggle choice is remembered in `localStorage` |

## Performance and accessibility notes

- The 3D scene is a separate chunk (`three-*.js`, ~246 KB gzip), requested after first paint. LCP is the tagline text, not the canvas.
- The canvas stops rendering entirely when the hero leaves the viewport. DPR is capped at 2 (1.5 on low-power devices), and drei's `PerformanceMonitor` drops to 1 if frames struggle.
- Shaders are compiled with `compileAsync` before the first frame. The terminal's "Acquiring state lock…" line covers the wait if there is one.
- **Machines without GPU acceleration** (software WebGL: SwiftShader, llvmpipe) get the typographic name instead of the 3D scene. On those, creating the context and linking shaders blocks for 1–2 s. This also covers PageSpeed Insights, which has no GPU. Measured in that environment: Lighthouse desktop **Performance 99 · Accessibility 100 · Best Practices 96 · SEO 100**. The BP point was the Fontshare request, blocked by the sandbox's network.
- Low-power detection (`src/lib/env.ts`): touch/coarse pointer, width < 768, ≤ 4 CPU cores, ≤ 4 GB memory, or Save-Data.
- All content is real DOM. The `<h1>` is the name (visually hidden while the cubes render it). Cards are links or focusable, and every hover effect also runs on keyboard focus. Focus rings use the accent colour, and colour contrast is AA in both themes.
- The world allocates a fixed pool of chunks once and rewrites them in place as they recycle, so memory stays flat no matter how long the page is open.

---

## Where each interaction lives

| Interaction | File | Knobs |
| --- | --- | --- |
| Terminal typing + apply log | `src/sections/hero/Terminal.tsx` | typing rhythm in the `tick` timeout; lines in `content.ts → hero` |
| Hero orchestration (lazy load, pause off-screen, fallbacks) | `src/sections/hero/Hero.tsx` | |
| Name → cube positions (canvas text sampling) | `src/three/textSampler.ts` | `tracking`, `wordGap`, smile arc (`top`, `sag`) |
| Cube fly-in, cursor repulsion, springs, tilt, "Happy" bounce + smile, ":)" cursor | `src/three/NameCubes.tsx` | the `TUNE` object at the top: cube counts, stagger, repel radius/force, spring stiffness/damping, tilt, bounce |
| Voxel shading (side faces fade to the page colour) | `src/three/NameCubes.tsx` → `material` | `uSide` |
| Infinite chunked infrastructure graph | `src/three/World.tsx` | the `WORLD` object: density, link chance, accent nodes, drift speed, scroll travel |
| Calm Raging Sea ground plane | `src/three/Sea.tsx`, shader in `src/three/seaShader.ts` | `CALM` params in `seaShader.ts` |
| Camera dolly on scroll, pointer parallax | `src/three/HeroCanvas.tsx → CameraRig` | |
| Shader warm-up, DPR, render pausing | `src/three/HeroCanvas.tsx` | |
| Custom cursor (dot + ring + labels) | `src/components/Cursor.tsx`, styles in `src/styles/components.css` | add `data-cursor="Label"` to any element |
| Magnetic buttons/links | `src/components/ui.tsx → initMagnetic` | `data-magnetic="0.3"` (strength) on any element |
| Headings revealing line by line | `src/components/ui.tsx → RevealLines`, CSS `.rl` in `components.css` | lines are authored in `content.ts` |
| Tool-name scramble | `src/components/ui.tsx → Scramble` | `duration`, `GLYPHS` |
| Section wipe on nav click | `src/components/Wipe.tsx` | timeline durations |
| Section rule wipe-in | `.eyebrow::after` in `src/styles/global.css` | |
| Lenis + ScrollTrigger wiring | `src/lib/scroll.ts` | `lerp` |
| Theme toggle (circular View Transition) | `src/lib/theme.ts`, `src/components/Header.tsx` | `theme-reveal` keyframes in `global.css` |
| Horizontal pin, drag, trackpad swipe, progress, counter, keyboard scroll-into-view | `src/sections/work/Work.tsx` | `scrub`, fling strength (`velocity * 260`) |
| Mobile / reduced-motion swipe carousel | `src/sections/work/Work.module.css` (`[data-mode='native']`) | |
| When a card is "active" (hover, focus, or centred on touch) | `src/lib/hooks.ts → useCardActive` | |
| 01 Repo Factory: `terraform plan` types out | `src/sections/work/cards/RepoFactoryStage.tsx` | `CHARS_PER_MS`, `LINE_GAP_MS` |
| 02 SmartSort: files stream through the router into 4 lanes | `src/sections/work/cards/SmartSortStage.tsx` | spawn interval, dot speed; lane weights in `content.ts` |
| 03 Triage: tickets auto-sort, load bar 100% → 60% | `src/sections/work/cards/TriageStage.tsx` | `PILE`, ticket size; tickets/columns in `content.ts` |
| 04 Raging Sea: live mini-canvas | `src/sections/work/cards/SeaStage.tsx`, `src/three/seaPreview.ts` | camera, colours; `ORIGINAL` params in `seaShader.ts` |
| 05 Certificate flip | `src/sections/work/cards/CertCard.tsx`, `.flipInner` in `Cards.module.css` | |
| 06 "32 more on GitHub": 32 squares provision | `src/sections/work/cards/EndCard.tsx` | count comes from the title in `content.ts` |
| Timeline line draw + expandable roles | `src/sections/experience/Experience.tsx` | ScrollTrigger `start`/`end` |
| Email copy + toast | `src/sections/contact/Contact.tsx`, `Toast` in `src/components/ui.tsx` | toast text in `content.ts → contact.copied` |

## Project structure

```
src/
  content.ts              ← all copy and data
  main.tsx, App.tsx
  styles/                 tokens.css · global.css · components.css
  lib/                    env (device/motion/WebGL), theme, scroll (Lenis+GSAP), hooks, cursorStore
  components/             Header, Cursor, Wipe, ui (RevealLines, Scramble, Eyebrow, Magnetic, Toast)
  sections/
    hero/                 Hero, Terminal
    about/  work/ (+ cards/)  experience/  contact/
  three/                  HeroCanvas, NameCubes, textSampler, World, Sea, seaShader, seaPreview, shared
public/                   résumé, favicon, og.png, robots.txt
```

`npm run build -- --mode artifact` produces a self-contained `dist-preview/` with relative paths and a bundled display font (Geist). It's only used for the hosted preview, since that sandbox can't load Fontshare. You don't need it for Vercel.
