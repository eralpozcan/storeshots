// Tiny client-side palette extractor. Draws the screenshot to a small offscreen
// canvas, buckets the resulting pixels by quantised RGB, and returns the most
// frequent buckets. Skips near-white and near-black since they are usually
// background/text rather than brand colours.

import type { BrandColors } from './types'

type Rgb = { r: number, g: number, b: number, count: number }

function quantize(channel: number, step = 32): number {
  return Math.min(255, Math.floor(channel / step) * step)
}

function rgbHex({ r, g, b }: Rgb): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function isNearWhite({ r, g, b }: Rgb) {
  return r > 235 && g > 235 && b > 235
}

function isNearBlack({ r, g, b }: Rgb) {
  return r < 25 && g < 25 && b < 25
}

function isNearGray({ r, g, b }: Rgb) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max - min < 18
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function topColors(src: string, n = 6): Promise<Rgb[]> {
  const img = await loadImage(src)
  const w = 80
  const h = Math.max(1, Math.round((img.height / img.width) * w))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return []
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data

  const buckets = new Map<string, Rgb>()
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 200) continue
    const r = quantize(data[i])
    const g = quantize(data[i + 1])
    const b = quantize(data[i + 2])
    const key = `${r},${g},${b}`
    const existing = buckets.get(key)
    if (existing) existing.count++
    else buckets.set(key, { r, g, b, count: 1 })
  }

  return [...buckets.values()]
    .filter(c => !isNearWhite(c) && !isNearBlack(c) && !isNearGray(c))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

function darken({ r, g, b }: Rgb, amount = 0.4): Rgb {
  return {
    r: Math.round(r * (1 - amount)),
    g: Math.round(g * (1 - amount)),
    b: Math.round(b * (1 - amount)),
    count: 0,
  }
}

function lightenForText({ r, g, b }: Rgb): string {
  // Pick white/black for text contrast. Luminance threshold ~ WCAG.
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.55 ? '#0d1b3e' : '#ffffff'
}

// Best-effort palette derivation. Returns null if the image is too uniform
// (e.g. all white) so the caller can fall back to defaults.
export async function extractPalette(images: (string | null)[]): Promise<BrandColors | null> {
  const valid = images.filter((s): s is string => !!s)
  if (!valid.length) return null

  // Sample up to 3 screenshots to cover apps with varied UI palettes.
  const samples = valid.slice(0, 3)
  const all: Rgb[] = []
  for (const src of samples) {
    try {
      const top = await topColors(src, 6)
      all.push(...top)
    }
    catch { /* skip image on load error */ }
  }
  if (!all.length) return null

  // Re-bucket merged samples so dominant colours across multiple shots win.
  const merged = new Map<string, Rgb>()
  for (const c of all) {
    const key = `${c.r},${c.g},${c.b}`
    const existing = merged.get(key)
    if (existing) existing.count += c.count
    else merged.set(key, { ...c })
  }
  const ranked = [...merged.values()].sort((a, b) => b.count - a.count)
  if (!ranked.length) return null

  const primary = ranked[0]
  // Pick an accent that's visually distinct from primary.
  const accent = ranked.slice(1).find((c) => {
    const dr = Math.abs(c.r - primary.r)
    const dg = Math.abs(c.g - primary.g)
    const db = Math.abs(c.b - primary.b)
    return dr + dg + db > 120
  }) || ranked[1] || primary

  const bgFrom = darken(primary, 0.55)
  const bgTo = darken(primary, 0.25)

  return {
    primary: rgbHex(primary),
    accent: rgbHex(accent),
    textDark: '#0d1b3e',
    textLight: '#ffffff',
    bgFrom: rgbHex(bgFrom),
    bgTo: rgbHex(bgTo),
  }
}

// Helper exposed for situations where the caller already has a single image.
export async function paletteFromImage(src: string): Promise<BrandColors | null> {
  return extractPalette([src])
}

export const __test = { quantize, rgbHex, lightenForText }
