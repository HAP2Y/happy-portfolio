/**
 * Turns "HAPPY PATEL" into cube positions.
 *
 * The name is drawn letter by letter into an offscreen 2D canvas in the
 * display font, then sampled on a grid. Each filled grid cell becomes one
 * cube per depth layer. Drawing letters separately tells us which letter
 * every cube belongs to (used for the "Happy" bounce).
 *
 * Local units: 1.0 = the cap height of the font.
 */

export interface NameLayout {
  /** cubes that form letters */
  count: number
  /** extra cubes that draw the smile under "HAPPY" (0 in two-line layout) */
  smileCount: number
  /** (count + smileCount) * 3 target positions */
  targets: Float32Array
  /** letter index per cube: 0–4 = H A P P Y, 5–9 = P A T E L, -1 = smile */
  letter: Int8Array
  /** 0..1 horizontal position of each cube, used to stagger assembly left → right */
  nx: Float32Array
  /** grid spacing in local units */
  cell: number
  width: number
  height: number
  happy: { minX: number; maxX: number; minY: number; maxY: number }
  lines: 1 | 2
}

interface Options {
  first: string
  last: string
  twoLines: boolean
  targetCubes: number
  layers: number
  smile: boolean
  fontFamily: string
}

const FONT_PX = 200

async function waitForFont(fontFamily: string) {
  if (!('fonts' in document)) return
  const timeout = new Promise((r) => setTimeout(r, 2500))
  try {
    await Promise.race([document.fonts.load(`600 ${FONT_PX}px ${fontFamily}`, 'HAPPYTEL'), timeout])
  } catch {
    /* fall back to whatever is available */
  }
}

export async function buildNameLayout(o: Options): Promise<NameLayout> {
  await waitForFont(o.fontFamily)

  const words = [o.first.toUpperCase(), o.last.toUpperCase()]
  const measureCanvas = document.createElement('canvas')
  const mctx = measureCanvas.getContext('2d')!
  const font = `600 ${FONT_PX}px ${o.fontFamily}`
  mctx.font = font

  const capH = mctx.measureText('H').actualBoundingBoxAscent || FONT_PX * 0.7
  const tracking = FONT_PX * 0.05
  const wordGap = FONT_PX * 0.3
  const lineH = capH * 1.42
  const pad = Math.ceil(FONT_PX * 0.2)

  type Glyph = { ch: string; x: number; w: number; line: number; letter: number }
  const glyphs: Glyph[] = []
  const lineWidths: number[] = []

  const lineWords = o.twoLines ? [[0], [1]] : [[0, 1]]
  let letterIndex = 0
  lineWords.forEach((wordIdxs, line) => {
    let x = 0
    wordIdxs.forEach((wi, k) => {
      if (k > 0) x += wordGap
      for (const ch of words[wi]) {
        const w = mctx.measureText(ch).width
        glyphs.push({ ch, x, w, line, letter: letterIndex++ })
        x += w + tracking
      }
      x -= tracking
    })
    lineWidths.push(x)
  })

  const maxW = Math.max(...lineWidths)
  const cw = Math.ceil(maxW + pad * 2)
  const ch = Math.ceil(pad * 2 + capH + (lineWords.length - 1) * lineH)
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.font = font
  ctx.fillStyle = '#000'
  ctx.textBaseline = 'alphabetic'

  const baselineOf = (line: number) => pad + capH + line * lineH
  const lineOffset = (line: number) => pad + (maxW - lineWidths[line]) / 2
  for (const g of glyphs) ctx.fillText(g.ch, lineOffset(g.line) + g.x, baselineOf(g.line))

  const data = ctx.getImageData(0, 0, cw, ch).data
  const filled = (x: number, y: number) => data[(y * cw + x) * 4 + 3] > 127

  // Find the finest grid step that stays under the cube budget.
  const countFor = (step: number) => {
    let n = 0
    for (let y = Math.floor(step / 2); y < ch; y += step)
      for (let x = Math.floor(step / 2); x < cw; x += step) if (filled(x, y)) n++
    return n
  }
  let step = 3
  while (step < 24 && countFor(step) * o.layers > o.targetCubes) step++

  // Collect cells
  const cells: { px: number; py: number; letter: number }[] = []
  for (let y = Math.floor(step / 2); y < ch; y += step) {
    const line = o.twoLines ? (y < pad + capH + (lineH - capH) / 2 ? 0 : 1) : 0
    for (let x = Math.floor(step / 2); x < cw; x += step) {
      if (!filled(x, y)) continue
      // which glyph owns this column?
      let letter = 0
      let best = Infinity
      for (const g of glyphs) {
        if (g.line !== line) continue
        const gx0 = lineOffset(g.line) + g.x
        const gx1 = gx0 + g.w
        const d = x < gx0 ? gx0 - x : x > gx1 ? x - gx1 : 0
        if (d < best) {
          best = d
          letter = g.letter
        }
      }
      cells.push({ px: x, py: y, letter })
    }
  }

  let minPx = Infinity, maxPx = -Infinity, minPy = Infinity, maxPy = -Infinity
  for (const c of cells) {
    minPx = Math.min(minPx, c.px); maxPx = Math.max(maxPx, c.px)
    minPy = Math.min(minPy, c.py); maxPy = Math.max(maxPy, c.py)
  }
  const midX = (minPx + maxPx) / 2
  const midY = (minPy + maxPy) / 2
  const cell = step / capH

  const smileCount = o.smile && !o.twoLines ? 30 : 0
  const count = cells.length * o.layers
  const total = count + smileCount
  const targets = new Float32Array(total * 3)
  const letter = new Int8Array(total)
  const nx = new Float32Array(total)
  const happy = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }

  let i = 0
  for (let l = 0; l < o.layers; l++) {
    const z = (l - (o.layers - 1) / 2) * cell
    for (const c of cells) {
      const x = (c.px - midX) / capH
      const y = -(c.py - midY) / capH
      targets[i * 3] = x
      targets[i * 3 + 1] = y
      targets[i * 3 + 2] = z
      letter[i] = c.letter
      nx[i] = (c.px - minPx) / Math.max(1, maxPx - minPx)
      if (c.letter < words[0].length) {
        happy.minX = Math.min(happy.minX, x); happy.maxX = Math.max(happy.maxX, x)
        happy.minY = Math.min(happy.minY, y); happy.maxY = Math.max(happy.maxY, y)
      }
      i++
    }
  }

  // The smile: a shallow arc of cubes under "HAPPY".
  if (smileCount) {
    const w = happy.maxX - happy.minX
    const x0 = happy.minX + w * 0.2
    const x1 = happy.maxX - w * 0.2
    const top = happy.minY - 0.24
    const sag = 0.2
    for (let k = 0; k < smileCount; k++) {
      const u = k / (smileCount - 1)
      const t = u * 2 - 1
      targets[i * 3] = x0 + (x1 - x0) * u
      targets[i * 3 + 1] = top - sag * (1 - t * t)
      targets[i * 3 + 2] = 0
      letter[i] = -1
      nx[i] = u
      i++
    }
  }

  return {
    count,
    smileCount,
    targets,
    letter,
    nx,
    cell,
    width: (maxPx - minPx) / capH + cell,
    height: (maxPy - minPy) / capH + cell,
    happy,
    lines: o.twoLines ? 2 : 1,
  }
}
