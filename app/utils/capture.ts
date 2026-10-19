import { toPng, toJpeg, getFontEmbedCSS } from 'html-to-image'

export async function captureElement(el: HTMLElement, tw: number, th: number, format: 'png' | 'jpeg' = 'png'): Promise<string> {
  // JPEG cannot carry an alpha channel; Apple assets must be opaque.
  const capture = format === 'jpeg' ? toJpeg : toPng
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try { await (document.fonts as any).ready } catch (e) { console.warn('Font loading failed, proceeding anyway:', e) }
  }

  let fontEmbedCSS: string | undefined
  try { fontEmbedCSS = await getFontEmbedCSS(el) } catch (e) { console.warn('getFontEmbedCSS failed:', e) }

  const clone = el.cloneNode(true) as HTMLElement
  const container = document.createElement('div')
  // Off-viewport but laid out — html-to-image needs real layout, but the user
  // shouldn't see a giant flash of the export node during capture.
  container.style.position = 'fixed'
  container.style.left = '-100000px'
  container.style.top = '0px'
  container.style.width = `${tw}px`
  container.style.height = `${th}px`
  container.style.pointerEvents = 'none'
  container.style.display = 'block'
  container.style.overflow = 'visible'
  container.setAttribute('aria-hidden', 'true')

  clone.style.position = 'static'
  clone.style.width = `${tw}px`
  clone.style.height = `${th}px`
  clone.style.visibility = 'visible'
  clone.style.display = 'block'
  clone.style.overflow = 'visible'

  container.appendChild(clone)
  document.body.appendChild(container)

  await new Promise(r => requestAnimationFrame(() => r(null)))
  await new Promise(r => setTimeout(r, 200))
  container.offsetHeight
  clone.offsetHeight

  // pixelRatio MUST be 1: tw/th are already the exact pixel dimensions the
  // store requires. A ratio of 2 doubles the output (e.g. 1320×2868 → 2640×5736),
  // which App Store Connect rejects as the wrong size.
  const opts = { width: tw, height: th, pixelRatio: 1, cacheBust: true, fontEmbedCSS, ...(format === 'jpeg' ? { quality: 1, backgroundColor: '#ffffff' } : {}) }

  try {
    try { await capture(clone, opts) } catch (e) { console.warn('First capture attempt failed:', e) }
    try {
      return await capture(clone, opts)
    } catch (e) {
      console.error('Capture failed, falling back to container capture:', e)
      return await capture(container, opts)
    }
  } finally {
    document.body.removeChild(container)
  }
}
