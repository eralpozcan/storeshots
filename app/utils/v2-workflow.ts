import type { Device, ImagesKey, Orientation, UserConfig, SlideCopy } from './types'
import { IPHONE_SIZES, ANDROID_SIZES, IPAD_SIZES, IPAD_L_SIZES, ANDROID_7P_SIZES, ANDROID_7L_SIZES, ANDROID_10P_SIZES, ANDROID_10L_SIZES, FG_SIZES, VARIANT_PRESETS } from './canvas'
import { appleAssetSpec } from './apple-assets'
import { DEFAULT_CONFIG } from './defaults'
import { applyLayoutTemplate, exportableSlides } from './editor-v2'

type Output = { id: string; label: string; device: Device; orientation: Orientation; imageKey: ImagesKey; sizes: readonly { w: number; h: number }[] }
const regular: Output[] = [
  { id: 'iphone', label: 'iPhone · 4 sizes', device: 'iphone', orientation: 'portrait', imageKey: 'iphone', sizes: IPHONE_SIZES },
  { id: 'android', label: 'Android phone', device: 'android', orientation: 'portrait', imageKey: 'androidPhone', sizes: ANDROID_SIZES },
  { id: 'ipad', label: 'iPad · 2 sizes', device: 'ipad', orientation: 'portrait', imageKey: 'ipad', sizes: IPAD_SIZES },
  { id: 'ipad-landscape', label: 'iPad landscape · 2 sizes', device: 'ipad', orientation: 'landscape', imageKey: 'ipadLandscape', sizes: IPAD_L_SIZES },
  { id: 'android-7', label: 'Android 7” tablet', device: 'android-7', orientation: 'portrait', imageKey: 'androidTablet7P', sizes: ANDROID_7P_SIZES },
  { id: 'android-7-landscape', label: 'Android 7” landscape', device: 'android-7', orientation: 'landscape', imageKey: 'androidTablet7L', sizes: ANDROID_7L_SIZES },
  { id: 'android-10', label: 'Android 10” tablet', device: 'android-10', orientation: 'portrait', imageKey: 'androidTablet10P', sizes: ANDROID_10P_SIZES },
  { id: 'android-10-landscape', label: 'Android 10” landscape', device: 'android-10', orientation: 'landscape', imageKey: 'androidTablet10L', sizes: ANDROID_10L_SIZES },
  { id: 'feature-graphic', label: 'Google Play Feature Graphic', device: 'feature-graphic', orientation: 'portrait', imageKey: 'iphone', sizes: FG_SIZES },
]
const apple: Output[] = (['iphone-duo-outer', 'iphone-duo-inner', 'apple-header', 'apple-search'] as Device[]).flatMap(device =>
  (device.startsWith('iphone-duo') ? ['portrait', 'landscape'] as const : ['portrait'] as const).map(orientation => {
    const spec = appleAssetSpec(device, orientation)!
    return { id: `${device}${orientation === 'landscape' ? '-landscape' : ''}`, label: `${spec.label}${orientation === 'landscape' ? ' landscape' : ''}`, device, orientation, imageKey: spec.imageKey, sizes: [{ w: spec.w, h: spec.h }] }
  }),
)
export const V2_OUTPUT_TARGETS = [...regular, ...apple]

export function selectedOutputs(ids: string[]) {
  const outputs = V2_OUTPUT_TARGETS.filter(output => ids.includes(output.id))
  if (!outputs.length || ids.some(id => !outputs.some(output => output.id === id))) throw new Error('Select valid outputs for your package.')
  return outputs
}

export function outputsMatch(a: string[], b: string[]) {
  return a.length === b.length && a.every(id => b.includes(id))
}

// Only automatically adapted slots follow the source. Editing a target unlinks it.
export function updateWorkflowImages(config: UserConfig, key: ImagesKey, images: (string | null)[]): UserConfig {
  const next: UserConfig = JSON.parse(JSON.stringify(config))
  const workflow = next.v2Workflow
  const changed = images.flatMap((image, i) => image !== config.images[key][i] ? [i] : [])
  next.images[key] = images
  if (workflow?.sourceKey === key) {
    for (const [target, slots] of Object.entries(workflow.linkedSlots || {})) {
      for (const i of slots || []) next.images[target as ImagesKey][i] = images[i] || null
    }
  } else if (workflow?.linkedSlots?.[key]) {
    workflow.linkedSlots[key] = workflow.linkedSlots[key]!.filter(i => !changed.includes(i))
  }
  return next
}

export function prepareSet(config: UserConfig, ids: string[], sourceKey: ImagesKey): UserConfig {
  const next: UserConfig = JSON.parse(JSON.stringify(config))
  const outputs = selectedOutputs(ids)
  const source = config.images[sourceKey]
  const linkedSlots = config.v2Workflow?.sourceKey === sourceKey ? { ...next.v2Workflow?.linkedSlots } : {}
  for (const output of outputs) {
    const spec = appleAssetSpec(output.device, output.orientation)
    if (spec?.kind === 'creative') continue
    if (output.imageKey === sourceKey) continue
    const slots = new Set(linkedSlots[output.imageKey] || [])
    next.images[output.imageKey] = next.images[output.imageKey].map((image, i) => {
      if (slots.has(i) || !image) {
        slots.add(i)
        return source[i] || null
      }
      return image
    })
    linkedSlots[output.imageKey] = [...slots]
  }
  const phrases = config.appDescription.split(/[.!?\n]+/).map(text => text.trim()).filter(Boolean)
  const copy = config.v2Workflow?.prepared ? next.copy : next.copy.map((slide, i) => ({ ...slide,
    headline: slide.headline === DEFAULT_CONFIG.copy[i]?.headline || !slide.headline.trim()
      ? phrases[i] || config.features[i] || config.appName : slide.headline,
    label: slide.label === DEFAULT_CONFIG.copy[i]?.label ? config.appName : slide.label,
  }))
  const sequence = [1, 3, 7, 5, 1, 8, 3, 6, 7, outputs.some(output => next.images[output.imageKey][9]) ? 1 : 10]
  next.copy = config.v2Workflow?.prepared ? copy : applyLayoutTemplate(copy, sequence, VARIANT_PRESETS)
  // A newly added tenth screenshot must replace the optional closing card.
  if (sequence[9] !== 10 && next.copy[9]?.variant === 10) {
    next.copy[9] = applyLayoutTemplate([next.copy[9]], [1], VARIANT_PRESETS)[0]!
    next.copy[9].elements = next.copy[9].elements?.map(element => element.type === 'device' ? { ...element, imageIdx: 9 } : element)
  }
  next.copyByLocale[next.locale] = next.copy
  next.v2Workflow = { ...config.v2Workflow, outputs: ids, prepared: true, sourceKey, linkedSlots }
  return next
}

export function sizeKey(size: { w: number; h: number }) { return `${size.w}x${size.h}` }

export function outputSizes(config: UserConfig, output: Output) {
  const selection = config.v2Workflow?.exportSizes?.[output.id]
  if (!selection) return output.sizes
  const sizes = output.sizes.filter(size => selection.includes(sizeKey(size)))
  if (!sizes.length) throw new Error(`Select at least one size for ${output.label}.`)
  return sizes
}

export function bundleJobs(config: UserConfig, ids: string[]) {
  const outputs = selectedOutputs(ids)
  const locales = [...new Set(config.selectedLocales.length ? config.selectedLocales : [config.locale])]
  for (const locale of locales) {
    if (locale !== config.locale && (config.copyByLocale[locale]?.length !== config.copy.length || config.copyByLocale[locale]?.some(slide => typeof slide?.headline !== 'string' || typeof slide?.label !== 'string'))) throw new Error(`Generate or add the missing ${locale} headlines before downloading.`)
  }
  return locales.flatMap(locale => outputs.flatMap(output => {
    const spec = appleAssetSpec(output.device, output.orientation)
    const images = config.images[output.imageKey]
    if (spec && !images.some(Boolean)) throw new Error(`Add artwork for ${output.label} before preparing the package.`)
    const copy = config.copy.map((slide, i) => locale === config.locale ? slide : {
      ...slide, headline: config.copyByLocale[locale]![i]!.headline, label: config.copyByLocale[locale]![i]!.label,
    })
    const variants = copy.map((slide, i) => slide.variant ?? i + 1)
    const indices = output.device === 'feature-graphic' ? [0] : spec
      ? images.flatMap((image, i) => image ? [i] : []) : exportableSlides(images, variants, config.v2Workflow?.includeClosing !== false)
    if (!indices.length) throw new Error(`Add screenshots for ${output.label}.`)
    return outputSizes(config, output).flatMap(size => indices.map(index => ({
      output, size, index, locale, copy, variant: variants[index]!, format: spec ? 'jpeg' as const : 'png' as const,
      path: `${encodeURIComponent(locale)}/${output.id}/${size.w}x${size.h}/${String(index + 1).padStart(2, '0')}.${spec ? 'jpg' : 'png'}`,
    })))
  }))
}

// Move the story across all screenshot outputs; dedicated artwork stays put.
export function reorderSet(config: UserConfig, from: number, to: number): UserConfig {
  const length = config.copy.length
  if (![from, to].every(i => Number.isInteger(i) && i >= 0 && i < length)) throw new Error('Choose a valid slide to move.')
  const next: UserConfig = JSON.parse(JSON.stringify(config))
  const order = Array.from({ length }, (_, i) => i)
  order.splice(to, 0, order.splice(from, 1)[0]!)
  const remap = (index: number) => order.indexOf(index)
  const moveCopy = (slides: SlideCopy[]) => order.map(i => {
    const slide = slides[i]
    if (!slide) return undefined as unknown as SlideCopy
    return { ...slide, variant: slide.variant ?? i + 1,
      elements: (slide.elements || VARIANT_PRESETS[slide.variant ?? i + 1] || []).map(el => el.type === 'device' ? { ...el, imageIdx: remap(el.imageIdx) } : el) }
  })
  next.copy = moveCopy(next.copy)
  for (const [locale, slides] of Object.entries(next.copyByLocale)) next.copyByLocale[locale] = moveCopy(slides)
  next.copyByLocale[next.locale] = next.copy
  for (const key of Object.keys(next.images) as ImagesKey[]) {
    if (key === 'appleHeader' || key === 'appleSearch') continue
    next.images[key] = order.map(i => next.images[key][i] || null)
  }
  if (next.v2Workflow?.linkedSlots) {
    for (const key of Object.keys(next.v2Workflow.linkedSlots) as ImagesKey[]) {
      next.v2Workflow.linkedSlots[key] = next.v2Workflow.linkedSlots[key]!.map(remap)
    }
  }
  return next
}

type LayoutSnapshot = Pick<SlideCopy, 'variant' | 'elements' | 'position'>[]
export function captureLayouts(copy: SlideCopy[]): LayoutSnapshot {
  return JSON.parse(JSON.stringify(copy.map(({ variant, elements, position }) => ({ variant, elements, position }))))
}

// Undo placement only: words edited after a template change must survive.
export function restoreLayouts(copy: SlideCopy[], snapshot: LayoutSnapshot): SlideCopy[] {
  return copy.map(({ variant, elements, position, ...text }, i) => ({ ...text, ...snapshot[i] }))
}
