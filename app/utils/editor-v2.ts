// Fill empty slots without replacing screenshots already in the project.
export function placeUploads(images: (string | null)[], incoming: string[]): (string | null)[] {
  const slots = images.flatMap((image, i) => image ? [] : [i])
  if (incoming.length > slots.length) throw new Error(`Only ${slots.length} empty slots remain. Remove a screenshot before adding more.`)
  const next = [...images]
  incoming.forEach((image, i) => { next[slots[i]!] = image })
  return next
}

export function exportableSlides(images: (string | null)[], variants: number[], includeClosing = true): number[] {
  return variants.flatMap((variant, i) => images[i] || (includeClosing && variant === 10) ? [i] : [])
}

export function applyLayoutTemplate(
  copy: SlideCopy[],
  sequence: number[],
  presets: Record<number, SlideElement[]>,
): SlideCopy[] {
  return copy.map((current, i) => {
    const variant = sequence[i % sequence.length]!
    const { elements, position, variant: previousVariant, ...text } = current
    void elements; void position; void previousVariant
    return {
      ...text,
      variant,
      elements: (presets[variant] || []).map(element =>
        element.type === 'device' ? { ...element, imageIdx: i } : { ...element },
      ),
    }
  })
}
import type { SlideCopy, SlideElement } from './types'

// AI sees a compact list of uploads; keep its text attached to the original slots.
export function copyForScreenshots(copy: SlideCopy[], slides: { imageIndex?: unknown; headline?: unknown; label?: unknown }[], images: (string | null)[]): SlideCopy[] {
  const slots = images.flatMap((image, i) => image ? [i] : [])
  const next = copy.map(slide => ({ ...slide }))
  const used = new Set<number>()
  for (const slide of slides) {
    const closing = copy.findIndex((item, i) => item.variant === 10 && !images[i])
    const index = typeof slide.imageIndex === 'number' && Number.isInteger(slide.imageIndex) ? slots[slide.imageIndex]
      : slide.imageIndex === null && closing >= 0 ? closing : undefined
    if (index === undefined || used.has(index) || typeof slide.headline !== 'string' || typeof slide.label !== 'string') continue
    next[index] = { ...next[index]!, headline: slide.headline, label: slide.label }
    used.add(index)
  }
  return next
}
