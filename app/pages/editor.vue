<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { toPng, getFontEmbedCSS } from 'html-to-image'
import JSZip from 'jszip'
import type { Device, Orientation, SlideElement, TextElement } from '~/utils/types'
import {
  FGW, FGH, STORE_PRESETS, FG_PRESET,
  IPHONE_SIZES, IPAD_SIZES, ANDROID_SIZES, ANDROID_7P_SIZES, ANDROID_10P_SIZES,
} from '~/utils/canvas'
import type { StorePreset } from '~/utils/canvas'
import { SLIDE_COUNT_APPLE, SLIDE_COUNT_ANDROID, DEFAULT_CONFIG } from '~/utils/defaults'
import { START_TEMPLATES, type StartTemplate } from '~/utils/templates'
import { customFontFaceCss, injectCustomFont } from '~/utils/fonts'

definePageMeta({ layout: false })

useSeoMeta({
  title: 'Editor — Storeshots',
  description: 'Design App Store & Google Play screenshots with AI-powered copywriting, device mockups, and smart slide ordering.',
  ogImage: 'https://storeshots.org/logo.png',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://storeshots.org/logo.png',
  robots: 'noindex, follow',
})

const {
  config, device, orientation, sizeIdx, exporting, generating,
  ready, isTablet, canvasDims, slideConfig, sizePick,
  updateConfig, switchLocale, generateCopy, generateFullDesign,
  exportProject, importProject,
  extractColorsFromScreenshots,
  copyVariants, generateCopyVariants, applyVariant,
  getUploadedImages,
  applyLayoutToAllLocales, setLocaleCopy, setLocaleCell,
  exportLocaleCopy, translateLocales,
} = useScreenshots()

// Keep the uploaded custom font's @font-face injected so it renders in the
// preview AND is reachable by getFontEmbedCSS during PNG export. Fires on mount
// (covers reload / project import) and whenever the custom font changes.
watch(() => config.value.customFont, (cf) => {
  injectCustomFont(cf ? customFontFaceCss(cf.dataUrl, cf.format) : null)
}, { immediate: true })

// Locale tab bar: shown when more than one language is selected. A language
// has "content" once it's been generated/edited (present in copyByLocale).
const localeTabs = computed(() => {
  const sel = config.value.selectedLocales?.length ? config.value.selectedLocales : [config.value.locale]
  return sel.map(code => ({
    code,
    hasCopy: !!config.value.copyByLocale?.[code]?.length,
  }))
})

// Variants modal — opened from the AI step / variants button.
const variantsOpen = ref(false)
async function openVariants() {
  variantsOpen.value = true
  if (!copyVariants.value.length) await generateCopyVariants()
}
function chooseVariant(i: number) {
  applyVariant(i)
  variantsOpen.value = false
}

// Preview-card refs (rendered) — used by the thumbnails strip to scroll
// to a specific slide. Distinct from `exportRefs` which point at the
// offscreen full-size capture targets.
const previewRefs = ref<(HTMLElement | null)[]>([])
function setPreviewRef(i: number, el: Element | ComponentPublicInstance | null) {
  previewRefs.value[i] = el as HTMLElement | null
}
function scrollToSlide(i: number) {
  const el = previewRefs.value[i]
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// Quick-start templates. Show the chooser only on a truly fresh editor —
// detected by the copy still matching the default placeholder. Once the
// user dismisses or applies a template the picker stays out of the way.
const templatePickerOpen = ref(false)
const templatesDismissed = ref(false)
const isFreshEditor = computed(() => {
  const c = config.value
  if (c.copy.some(s => s.headline && s.headline !== 'Your headline\nhere.')) return false
  if (c.appDescription) return false
  if (c.features.length) return false
  return true
})
// App Store preview — simulates how the first 3 slides look in a real
// store listing (above-the-fold). Available for every device except the
// feature graphic (which is a single banner, not a slide row).
const storePreviewOpen = ref(false)
const storePreviewPlatform = computed(() =>
  device.value === 'android' || device.value === 'android-7' || device.value === 'android-10'
    ? 'Play Store'
    : 'App Store',
)

// Translations manager — side-by-side table to import / translate / edit every
// language's copy in one place.
const translationsOpen = ref(false)
function onTranslate(payload: { source: string, targets: string[] }) {
  translateLocales(payload.source, payload.targets)
}

function applyTemplate(t: StartTemplate) {
  // Apply tone-of-voice fields only — never overwrite user's icon, screenshots, or AI key.
  updateConfig({
    colors: t.colors,
    copy: t.copy,
    features: t.features,
    aiBrief: t.aiBrief,
  })
  templatePickerOpen.value = false
  templatesDismissed.value = true
}

// Empty-state detection — true when the user hasn't uploaded any screenshots
// at all yet. Drives a friendly banner over the slide grid that points back
// to the Screenshots step.
const hasAnyImages = computed(() => {
  const imgs = config.value.images
  return Object.values(imgs).some(arr => arr.some(Boolean))
})

// Inline slide-copy editor — open via the pencil overlay on each SlideCard.
const editingSlide = ref<number | null>(null)
const editingDraft = ref<{ label: string, headline: string }>({ label: '', headline: '' })
function openEdit(i: number) {
  const slide = config.value.copy[i]
  editingDraft.value = { label: slide?.label || '', headline: slide?.headline || '' }
  editingSlide.value = i
}
function saveEdit() {
  if (editingSlide.value == null) return
  const next = [...config.value.copy]
  // Preserve any existing fine-tune position when overwriting label/headline.
  next[editingSlide.value] = { ...next[editingSlide.value], ...editingDraft.value }
  updateConfig({ copy: next })
  editingSlide.value = null
}

// Focused canvas — one slide blown up in the center, thumb strip beneath for
// quick switching. Entered via the maximize button on each SlideCard's hover
// overlay or by clicking a thumbnail. Exit with ESC or the close button.
// Device transform handles live in this mode only.
const focusedSlideIdx = ref<number | null>(null)
function enterFocus(i: number) { focusedSlideIdx.value = i }
function exitFocus() { focusedSlideIdx.value = null }

// Read/write helper for the per-slide elements[] override. Used by the
// transform overlay's element-change events.
const { resolveElements, patchElement, addElement, removeElement, resetSlide, setVariant, isOverridden } = useElementOverride(config, updateConfig)

// Element factories — used by the focused header's "+ Add" buttons. Each new
// element gets a unique id (type + random suffix) and a sensible default
// placement (centered on the canvas) so the user can immediately drag it
// where they want.
function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

function addDevice(slideIdx: number) {
  const variant = resolveVariant(slideIdx)
  addElement(slideIdx, variant, {
    id: uid('device'), type: 'device',
    imageIdx: 0, widthRole: 'primary',
    x: 50, y: 50, anchor: 'c',
    zIndex: 5,
  })
}
function addCaption(slideIdx: number) {
  const variant = resolveVariant(slideIdx)
  addElement(slideIdx, variant, {
    id: uid('caption'), type: 'caption',
    x: 50, y: 50, anchor: 'c',
    widthPct: 70,
    zIndex: 10,
  })
}
function addIcon(slideIdx: number) {
  // The icon element renders nothing without an uploaded app icon, so adding
  // one when none exists would silently drop an invisible element. Block it.
  if (!config.value.appIcon) {
    toast.add({
      title: 'No app icon yet',
      description: 'Upload an app icon in the sidebar (Basics) before adding an icon element.',
      color: 'warning',
      icon: 'i-lucide-image-off',
    })
    return
  }
  const variant = resolveVariant(slideIdx)
  addElement(slideIdx, variant, {
    id: uid('icon'), type: 'icon',
    x: 50, y: 50, anchor: 'c',
    sizePct: 18,
    zIndex: 6,
  })
}
function onElementDelete(slideIdx: number, elementId: string) {
  const variant = resolveVariant(slideIdx)
  removeElement(slideIdx, variant, elementId)
}

// Each slide picks its variant from either a per-slide override
// (SlideCopy.variant) or the positional default (slideVariants[i]). Used by
// both the grid and focused-mode renders.
function resolveVariant(i: number): number {
  return config.value.copy[i]?.variant ?? slideVariants.value[i] ?? 1
}

function onElementChange(slideIdx: number, payload: { id: string, patch: Partial<SlideElement> }) {
  const variant = resolveVariant(slideIdx)
  patchElement(slideIdx, variant, payload.id, payload.patch)
}

// ─── Per-device screenshot picker (paired-device slides) ───
// Paired variants (V2/V6) render two device frames. By default both show the
// slide's own screenshot. This lets the user pick a DIFFERENT uploaded
// screenshot for each frame explicitly — replacing the old auto "n+1" behaviour
// that silently consumed the next slide's screenshot and caused collisions.
const focusedDeviceElements = computed(() => {
  if (focusedSlideIdx.value === null) return []
  const variant = resolveVariant(focusedSlideIdx.value)
  return resolveElements(focusedSlideIdx.value, variant)
    .filter((e): e is Extract<SlideElement, { type: 'device' }> => e.type === 'device')
})

// Every screenshot slot for the current device, as picker options.
const deviceImageOptions = computed(() =>
  slideConfig.value.images.map((img, idx) => ({ idx, img })),
)

function deviceElLabel(el: { id: string }): string {
  if (el.id.includes('bg')) return 'Back'
  if (el.id.includes('fg')) return 'Front'
  return 'Device'
}

function setDeviceImage(elId: string, imageIdx: number) {
  if (focusedSlideIdx.value === null) return
  onElementChange(focusedSlideIdx.value, { id: elId, patch: { imageIdx } })
}

// ─── Feature Graphic editing ───
// The FG is a single canvas (no slide index), so it has its own element store
// (config.fgElements) and a lightweight set of write helpers mirroring the
// slide element flow. The SlideTransformOverlay is reused as-is for drag/resize.
const fgEditMode = ref(false)
const fgTextElements = computed(() => config.value.fgElements.filter((e): e is TextElement => e.type === 'text'))

// Render the FG at native FGW×FGH px and scale the wrapper down (same pattern
// as SlideCard) so the shared transform overlay's fixed-px handles scale with
// the canvas instead of rendering enormous on the 1024px banner.
const fgWrapEl = ref<HTMLElement | null>(null)
const fgScale = ref(0.5)
let fgRo: ResizeObserver | null = null
watch(fgWrapEl, (el) => {
  fgRo?.disconnect()
  if (el) {
    fgRo = new ResizeObserver(([e]) => { if (e) fgScale.value = e.contentRect.width / FGW })
    fgRo.observe(el)
  }
})
onBeforeUnmount(() => fgRo?.disconnect())

function writeFg(next: SlideElement[]) { updateConfig({ fgElements: next }) }
function onFgElementChange(payload: { id: string, patch: Partial<SlideElement> }) {
  writeFg(config.value.fgElements.map(e => e.id === payload.id ? { ...e, ...payload.patch } as SlideElement : e))
}
function onFgElementDelete(id: string) { writeFg(config.value.fgElements.filter(e => e.id !== id)) }
function addFgText() {
  writeFg([...config.value.fgElements, {
    id: uid('text'), type: 'text', text: 'New text',
    x: 50, y: 50, anchor: 'c', sizePct: 2.4, weight: 700, color: 'textLight', zIndex: 7,
  }])
}
// Toggle the single chips group on/off (there's only ever one feature-chip
// block, so the toolbar button flips it instead of stacking duplicates).
function toggleFgChips() {
  if (config.value.fgElements.some(e => e.type === 'chips')) {
    writeFg(config.value.fgElements.filter(e => e.type !== 'chips'))
  } else {
    writeFg([...config.value.fgElements, {
      id: uid('chips'), type: 'chips', x: 60, y: 50, anchor: 'cl', widthPct: 36, zIndex: 7,
    }])
  }
}
function addFgIcon() {
  if (!config.value.appIcon) {
    toast.add({
      title: 'No app icon yet',
      description: 'Upload an app icon in the sidebar (Basics) before adding an icon element.',
      color: 'warning',
      icon: 'i-lucide-image-off',
    })
    return
  }
  writeFg([...config.value.fgElements, {
    id: uid('icon'), type: 'icon', x: 50, y: 50, anchor: 'c', sizePct: 12, zIndex: 7,
  }])
}
function resetFg() { writeFg([...FG_PRESET]) }
function fgTextValue(t: TextElement): string {
  if (t.bind === 'appName') return config.value.appName
  if (t.bind === 'headline') return (config.value.copy[0]?.headline ?? '').replace(/\n/g, ' ')
  return t.text ?? ''
}
function unbindFgText(t: TextElement) {
  onFgElementChange({ id: t.id, patch: { bind: undefined, text: fgTextValue(t) } })
}

// Chips render config.features, so the FG panel edits the feature list directly
// (same data the sidebar's feature editor uses).
const fgHasChips = computed(() => config.value.fgElements.some(e => e.type === 'chips'))
function updateFgFeature(i: number, val: string) {
  const next = [...config.value.features]
  next[i] = val
  updateConfig({ features: next })
}
function removeFgFeature(i: number) {
  updateConfig({ features: config.value.features.filter((_, idx) => idx !== i) })
}
function addFgFeature() {
  updateConfig({ features: [...config.value.features, 'New feature'] })
}

// Layout picker for the focused header — exposes all 10 variants with a
// short description so users can swap layout without leaving the canvas.
const VARIANT_OPTIONS: { value: number, label: string, desc: string }[] = [
  { value: 1,  label: 'V1', desc: 'Centered device, caption top' },
  { value: 2,  label: 'V2', desc: 'Two phones (back tilted left), caption top' },
  { value: 3,  label: 'V3', desc: 'Device top-right, caption bottom-left' },
  { value: 4,  label: 'V4', desc: 'Dark gradient, centered device' },
  { value: 5,  label: 'V5', desc: 'Centered device, accent shadow' },
  { value: 6,  label: 'V6', desc: 'Two phones (back tilted right), caption top' },
  { value: 7,  label: 'V7', desc: 'Centered device (alt screenshot slot)' },
  { value: 8,  label: 'V8', desc: 'Device top-right, caption bottom-left (alt)' },
  { value: 9,  label: 'V9', desc: 'Dark gradient, centered device (alt)' },
  { value: 10, label: 'V10', desc: 'Trust slide — app icon, no device frame' },
]
function pickVariant(slideIdx: number, variant: number) {
  const positional = slideVariants.value[slideIdx] ?? 1
  setVariant(slideIdx, variant, positional)
}


// Hidden file input wired to importProject
const importInputRef = ref<HTMLInputElement | null>(null)
function triggerImport() { importInputRef.value?.click() }
async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await importProject(file)
  input.value = ''
}

// Device frame type mapping
const deviceFrame = computed(() => {
  const d = device.value
  const o = orientation.value
  if (d === 'iphone') return 'iphone' as const
  if (d === 'android') return 'android-phone' as const
  if (d === 'ipad') return 'ipad' as const
  if (d === 'android-7' || d === 'android-10') {
    return o === 'landscape' ? 'android-tablet-l' as const : 'android-tablet-p' as const
  }
  return 'iphone' as const
})

// Slide count based on device
const slideCount = computed(() => {
  if (device.value === 'feature-graphic') return 0
  if (device.value === 'iphone' || device.value === 'ipad') return SLIDE_COUNT_APPLE
  return SLIDE_COUNT_ANDROID
})

// Slide variants (1-based, trust slide is always last = 10)
const slideVariants = computed(() => {
  const count = slideCount.value
  if (count >= 10) return Array.from({ length: 10 }, (_, i) => i + 1)
  // Cap at count, last is always trust (10)
  return [...Array.from({ length: count - 1 }, (_, i) => i + 1), 10]
})

// Export refs
const exportRefs = ref<(HTMLDivElement | null)[]>([])
const fgRef = ref<HTMLDivElement | null>(null)

function setRef(i: number, el: Element | ComponentPublicInstance | null) {
  exportRefs.value[i] = el as HTMLDivElement | null
}

// Export helpers
// Capture an offscreen export node to PNG. Builds on @wolfhongkong's fix
// in #2: clone into a dedicated container so the original DOM isn't mutated,
// wait for fonts, force reflow, then run a warm-up + real toPng pass.
//
// Polish on top of #2:
// - inline font CSS via getFontEmbedCSS to defuse cross-origin font taint
//   (the underlying root cause of blank exports for some users)
// - drop html2canvas-only opts (allowTaint/useCORS) that html-to-image ignores
// - drop forced white backgroundColor so transparent/dark designs survive
// - cacheBust: true so stale cached assets don't re-introduce blank frames
// - pixelRatio: 1 so output matches the exact store pixel dimensions
// - shorter wait (rAF + small timeout) once fonts.ready resolves
// - try/finally guarantees the capture container is removed on error
async function captureElement(el: HTMLElement, tw: number, th: number): Promise<string> {
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
  const opts = { width: tw, height: th, pixelRatio: 1, cacheBust: true, fontEmbedCSS }

  try {
    try { await toPng(clone, opts) } catch (e) { console.warn('First toPng attempt failed:', e) }
    try {
      return await toPng(clone, opts)
    } catch (e) {
      console.error('toPng failed, falling back to container capture:', e)
      return await toPng(container, opts)
    }
  } finally {
    document.body.removeChild(container)
  }
}

function downloadPng(url: string, name: string) {
  const a = document.createElement('a')
  a.download = name
  a.href = url
  a.click()
}

function fname(i: number) {
  const s = sizePick.value
  const ori = isTablet.value ? `-${orientation.value}` : ''
  const lbl = config.value.copy[i]?.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'slide'
  return `${String(i + 1).padStart(2, '0')}-${lbl}-${device.value}${ori}-${s.w}x${s.h}.png`
}

async function exportOne(i: number) {
  const el = exportRefs.value[i]
  if (!el) return
  const s = sizePick.value
  exporting.value = `${i + 1}/${slideVariants.value.length}`
  try { downloadPng(await captureElement(el, s.w, s.h), fname(i)) }
  finally { exporting.value = null }
}

async function exportFG() {
  if (!fgRef.value) return
  exporting.value = 'FG'
  try { downloadPng(await captureElement(fgRef.value, FGW, FGH), `feature-graphic-${FGW}x${FGH}.png`) }
  finally { exporting.value = null }
}

// Bulk export skips slides that have no screenshot uploaded for the current
// device — they would just produce blank templates and waste capture time.
// The trust slide (variant 10) is text-only by design and always exports.
// Single-slide export from the card is unchanged: if a user explicitly
// clicks the per-slide download button, we honor it.
function slideHasContent(i: number, variant: number): boolean {
  if (variant === 10) return true
  return !!slideConfig.value.images?.[i]
}

const toast = useToast()

const slugLabel = (l: string) => l.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

// ─── Configurable export ──────────────────────────────────────────────────
// One export that fans out over languages × devices × sizes the user picks,
// producing a single ZIP nested as <locale>/<device>/<size>/NN-label.png.
type ExportDeviceDef = {
  device: Device
  label: string
  orientation: Orientation
  sizes: readonly { label: string; w: number; h: number }[]
}

const EXPORT_DEVICES: ExportDeviceDef[] = [
  { device: 'iphone', label: 'iPhone', orientation: 'portrait', sizes: IPHONE_SIZES },
  { device: 'ipad', label: 'iPad', orientation: 'portrait', sizes: IPAD_SIZES },
  { device: 'android', label: 'Android Phone', orientation: 'portrait', sizes: ANDROID_SIZES },
  { device: 'android-7', label: 'Android 7" Tablet', orientation: 'portrait', sizes: ANDROID_7P_SIZES },
  { device: 'android-10', label: 'Android 10" Tablet', orientation: 'portrait', sizes: ANDROID_10P_SIZES },
]

const sizeKey = (d: Device, label: string) => `${d}::${label}`

// Checkbox state. exportSizeSel keys are `${device}::${sizeLabel}`.
const exportLocaleSel = ref<Record<string, boolean>>({})
const exportSizeSel = ref<Record<string, boolean>>({})
const exportPopoverOpen = ref(false)

function defaultExportSelection() {
  // Languages: every selected locale on by default.
  const locales = config.value.selectedLocales?.length ? config.value.selectedLocales : [config.value.locale]
  const ls: Record<string, boolean> = {}
  for (const l of locales) ls[l] = true
  exportLocaleSel.value = ls
  // Sizes: every size of the device currently being edited, on by default.
  const ss: Record<string, boolean> = {}
  const cur = EXPORT_DEVICES.find(d => d.device === device.value) ?? EXPORT_DEVICES[0]!
  for (const sz of cur.sizes) ss[sizeKey(cur.device, sz.label)] = true
  exportSizeSel.value = ss
}

function openExport() {
  defaultExportSelection()
  exportPopoverOpen.value = true
}

function toggleLocale(code: string) {
  exportLocaleSel.value = { ...exportLocaleSel.value, [code]: !exportLocaleSel.value[code] }
}
function toggleSize(d: Device, label: string) {
  const k = sizeKey(d, label)
  exportSizeSel.value = { ...exportSizeSel.value, [k]: !exportSizeSel.value[k] }
}

// Quick-fill from a store preset: check exactly that preset's device/size set.
function applyExportPreset(preset: StorePreset) {
  const ss: Record<string, boolean> = {}
  for (const t of preset.targets) {
    for (const sz of t.sizes) ss[sizeKey(t.device, sz.label)] = true
  }
  exportSizeSel.value = ss
}

const exportLocales = computed(() =>
  Object.entries(exportLocaleSel.value).filter(([, v]) => v).map(([k]) => k),
)

// Build {device, orientation, sizes[]} targets from the checked sizes.
const exportTargets = computed(() =>
  EXPORT_DEVICES
    .map(d => ({
      device: d.device,
      orientation: d.orientation,
      sizes: d.sizes.filter(sz => exportSizeSel.value[sizeKey(d.device, sz.label)]),
    }))
    .filter(t => t.sizes.length > 0),
)

// Run async tasks with a concurrency cap. The editor renders one device frame
// at a time, but the slides within a frame are independent DOM nodes, so they
// can be captured concurrently to speed up large multi-target exports. Capped
// low (3) because html-to-image is CPU/memory heavy and the main thread is
// shared — more in flight just thrashes.
const CAPTURE_CONCURRENCY = 3
async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++
      await fn(items[idx]!)
    }
  })
  await Promise.all(workers)
}

async function exportConfigured() {
  const locales = exportLocales.value
  const targets = exportTargets.value
  if (!locales.length) {
    toast.add({ title: 'Pick a language', description: 'Select at least one language to export.', color: 'warning', icon: 'i-lucide-languages' })
    return
  }
  if (!targets.length) {
    toast.add({ title: 'Pick a size', description: 'Select at least one device size to export.', color: 'warning', icon: 'i-lucide-smartphone' })
    return
  }
  exportPopoverOpen.value = false

  const origDevice = device.value
  const origOrientation = orientation.value
  const origSizeIdx = sizeIdx.value
  const origCopy = config.value.copy.map(c => ({ ...c }))

  // Phase 1 — resolve copy for every selected locale (prefer stored/edited,
  // generate the missing ones if an AI key is present).
  const copyMap: Record<string, { label: string; headline: string }[]> = {}
  for (const loc of locales) {
    const existing = config.value.copyByLocale?.[loc]
    if (existing?.length) copyMap[loc] = existing.map(c => ({ ...c }))
  }
  const missing = locales.filter(l => !copyMap[l]?.length)
  if (missing.length && !config.value.ai.apiKey) {
    toast.add({
      title: 'API key missing',
      description: `No copy yet for: ${missing.join(', ')}. Add an AI key to generate them, or deselect those languages.`,
      color: 'warning', icon: 'i-lucide-key', duration: 6000,
    })
    return
  }

  let exported = 0
  let skipped = 0
  try {
    if (missing.length) {
      const images = await getUploadedImages()
      for (const loc of missing) {
        exporting.value = `Generating ${loc}…`
        try {
          const res = await $fetch('/api/generate-copy', {
            method: 'POST',
            body: {
              provider: config.value.ai.provider, apiKey: config.value.ai.apiKey,
              openrouterModel: config.value.ai.openrouterModel, claudeModel: config.value.ai.claudeModel,
              appName: config.value.appName, appDescription: config.value.appDescription,
              features: config.value.features, slideCount: config.value.copy.length,
              locale: loc, mode: 'copy-only', images,
            },
          }) as { slides?: any[] }
          if (res.slides?.length) copyMap[loc] = res.slides.map((s: any) => ({ label: s.label || '', headline: s.headline || '' }))
        }
        catch (e: any) {
          toast.add({ title: `Generation failed for ${loc}`, description: e?.data?.statusMessage || e?.message || 'Unknown error', color: 'error', icon: 'i-lucide-triangle-alert', duration: 5000 })
        }
      }
    }

    const zip = new JSZip()
    const appSlug = slugLabel(config.value.appName || 'app') || 'app'
    const nestLocale = locales.length > 1

    // Phase 2 — capture locale × device × size into nested folders.
    for (const loc of locales) {
      const localeCopy = copyMap[loc]
      if (!localeCopy?.length) continue
      // Swap rendered copy; pass copyByLocale so write-through doesn't pollute.
      updateConfig({ copy: localeCopy, copyByLocale: config.value.copyByLocale })

      for (const target of targets) {
        device.value = target.device
        orientation.value = target.orientation
        sizeIdx.value = 0
        await nextTick()
        await new Promise(r => setTimeout(r, 650))

        const variants = slideVariants.value
        for (const size of target.sizes) {
          const sizeFolder = `${slugLabel(size.label)}-${size.w}x${size.h}`
          const path = [nestLocale ? loc : null, target.device, sizeFolder].filter(Boolean).join('/')
          const folder = zip.folder(path)
          if (!folder) continue

          // Slides in this frame are already rendered as independent nodes, so
          // capture them concurrently (capped). Skips are counted up front.
          const slideIdxs: number[] = []
          for (let i = 0; i < variants.length; i++) {
            if (!exportRefs.value[i] || !slideHasContent(i, variants[i]!)) { skipped++; continue }
            slideIdxs.push(i)
          }
          let done = 0
          await mapLimit(slideIdxs, CAPTURE_CONCURRENCY, async (i) => {
            const el = exportRefs.value[i]!
            const dataUrl = await captureElement(el, size.w, size.h)
            const lbl = slugLabel(config.value.copy[i]?.label || '') || 'slide'
            folder.file(`${String(i + 1).padStart(2, '0')}-${lbl}.png`, dataUrl.split(',')[1] || '', { base64: true })
            exported++
            done++
            exporting.value = `${nestLocale ? loc + ' · ' : ''}${target.device} ${size.label} · ${done}/${slideIdxs.length}`
          })
        }
      }
    }

    if (exported === 0) {
      toast.add({ title: 'Nothing exported', description: 'Upload screenshots to your slides first.', color: 'warning', icon: 'i-lucide-image-off', duration: 5000 })
      return
    }

    exporting.value = 'Zipping…'
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${appSlug}-export.zip`
    a.click()
    URL.revokeObjectURL(url)
    toast.add({
      title: 'Export ready',
      description: `${exported} screenshot${exported === 1 ? '' : 's'} · ${locales.length} lang × ${targets.length} device target${targets.length === 1 ? '' : 's'}`,
      color: 'success', icon: 'i-lucide-download', duration: 5000,
    })
  }
  finally {
    // Persist any generated locales + restore the editing view.
    updateConfig({ copy: origCopy, copyByLocale: { ...config.value.copyByLocale, ...copyMap } })
    device.value = origDevice
    orientation.value = origOrientation
    sizeIdx.value = origSizeIdx
    exporting.value = null
  }
}

const projectMenuItems = computed(() => [
  {
    label: 'Save project to file',
    description: 'Download a .storeshots.json snapshot',
    icon: 'i-lucide-download',
    onSelect: exportProject,
  },
  {
    label: 'Load project from file',
    description: 'Replace current state from a saved .storeshots.json',
    icon: 'i-lucide-upload',
    onSelect: triggerImport,
  },
])

const deviceOptions: { label: string; value: Device }[] = [
  { label: 'iPhone', value: 'iphone' },
  { label: 'Android', value: 'android' },
  { label: 'iPad', value: 'ipad' },
  { label: 'Feature Graphic', value: 'feature-graphic' },
]

const tabletOptions: { label: string; value: Device }[] = [
  { label: 'Android 7"', value: 'android-7' },
  { label: 'Android 10"', value: 'android-10' },
]

onMounted(() => {
  ready.value = true
  // First-run hint: open the template chooser unless the user already
  // started typing or dismissed it before.
  if (isFreshEditor.value && !templatesDismissed.value) {
    setTimeout(() => { templatePickerOpen.value = true }, 350)
  }
})

// Keyboard shortcuts. Skipped while typing in form fields so they don't
// fight with regular text editing.
function isTyping(t: EventTarget | null) {
  const el = t as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

function onKeydown(e: KeyboardEvent) {
  if (isTyping(e.target)) return
  const meta = e.metaKey || e.ctrlKey
  if (meta && e.key.toLowerCase() === 'e') {
    e.preventDefault()
    if (!exporting.value) {
      if (device.value === 'feature-graphic') exportFG()
      else openExport()
    }
    return
  }
  if (meta && e.key.toLowerCase() === 'g') {
    e.preventDefault()
    if (!generating.value && config.value.ai.apiKey) generateCopy()
    return
  }
  if (e.key === 'Escape') {
    if (editingSlide.value !== null) editingSlide.value = null
    else if (focusedSlideIdx.value !== null) exitFocus()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div
    v-if="!ready"
    class="min-h-screen flex items-center justify-center"
  >
    <p class="text-gray-500 text-sm">
      Loading…
    </p>
  </div>

  <div
    v-else
    class="flex h-screen overflow-hidden font-[Inter,sans-serif]"
  >
    <!-- Sidebar -->
    <AppSidebar
      :config="config"
      :generating="generating"
      @change="updateConfig"
      @generate="generateCopy"
      @generate-design="generateFullDesign"
      @extract-colors="extractColorsFromScreenshots"
    />

    <!-- Main area -->
    <div class="flex-1 flex flex-col overflow-hidden relative">
      <!-- Toolbar — two rows: actions on top, device controls below. -->
      <div class="shrink-0 bg-white border-b border-gray-200 z-50">
        <!-- Row 1: identity + project actions. Wraps so every action stays
             visible on narrow widths instead of being clipped off the edge. -->
        <div class="flex flex-wrap items-center justify-between gap-y-2 px-4 py-2 border-b border-gray-100">
          <div class="flex items-center gap-3 min-w-0">
            <NuxtLink
              to="/"
              class="flex items-center gap-2 text-gray-600 hover:text-blue-600 shrink-0"
              aria-label="Back to home"
            >
              <UIcon
                name="i-lucide-arrow-left"
                class="size-4"
              />
              <span class="text-xs font-semibold">Home</span>
            </NuxtLink>
            <span class="text-gray-300">·</span>
            <span class="font-bold text-sm text-gray-900 whitespace-nowrap truncate">
              {{ config.appName || 'My App' }}
            </span>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2 ml-auto">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-sparkles"
              size="sm"
              :disabled="!!exporting"
              @click="templatePickerOpen = true"
            >
              Templates
            </UButton>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-store"
              size="sm"
              :disabled="!!exporting || device === 'feature-graphic'"
              :title="device === 'feature-graphic' ? 'Not applicable to the feature graphic' : `See how the first 3 slides look in the ${storePreviewPlatform}`"
              @click="storePreviewOpen = true"
            >
              Store preview
            </UButton>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-languages"
              size="sm"
              :disabled="!!exporting || device === 'feature-graphic'"
              title="Manage, import, and translate copy for every language"
              @click="translationsOpen = true"
            >
              Translations
            </UButton>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-shuffle"
              size="sm"
              :loading="generating && variantsOpen"
              :disabled="!!exporting || !config.ai.apiKey"
              :title="config.ai.apiKey ? 'Generate 3 alternative copy variants for A/B testing' : 'Add an AI key to generate variants'"
              @click="openVariants"
            >
              Variants
            </UButton>
            <UDropdownMenu
              :items="projectMenuItems"
              :disabled="!!exporting"
            >
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-folder"
                size="sm"
                :disabled="!!exporting"
              >
                Project
              </UButton>
            </UDropdownMenu>
            <input
              ref="importInputRef"
              type="file"
              accept="application/json,.json,.storeshots.json"
              class="hidden"
              @change="onImportFile"
            >
            <UPopover v-model:open="exportPopoverOpen">
              <UButton
                size="sm"
                icon="i-lucide-download"
                :loading="!!exporting"
                :disabled="!!exporting || device === 'feature-graphic'"
                :title="device === 'feature-graphic' ? 'Use the Download button for the feature graphic' : 'Export languages × devices × sizes'"
                @click="openExport"
              >
                {{ exporting ? `Exporting… ${exporting}` : 'Export' }}
              </UButton>
              <template #content>
                <div class="p-3 w-72 space-y-3">
                  <!-- Languages -->
                  <div v-if="Object.keys(exportLocaleSel).length">
                    <p class="text-[11px] font-semibold text-gray-700 mb-1">Languages</p>
                    <div class="flex flex-wrap gap-x-3 gap-y-1">
                      <label
                        v-for="code in Object.keys(exportLocaleSel)"
                        :key="code"
                        class="flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <UCheckbox
                          :model-value="exportLocaleSel[code]"
                          @update:model-value="toggleLocale(code)"
                        />
                        {{ code.toUpperCase() }}
                      </label>
                    </div>
                  </div>
                  <!-- Devices + sizes -->
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <p class="text-[11px] font-semibold text-gray-700">Devices &amp; sizes</p>
                      <div class="flex gap-1.5">
                        <button
                          v-for="p in STORE_PRESETS"
                          :key="p.key"
                          type="button"
                          class="text-[10px] text-blue-600 hover:underline"
                          @click="applyExportPreset(p)"
                        >
                          {{ p.label }}
                        </button>
                      </div>
                    </div>
                    <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                      <div
                        v-for="d in EXPORT_DEVICES"
                        :key="d.device"
                      >
                        <p class="text-[11px] font-medium text-gray-500">{{ d.label }}</p>
                        <div class="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                          <label
                            v-for="sz in d.sizes"
                            :key="sz.label"
                            class="flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            <UCheckbox
                              :model-value="!!exportSizeSel[sizeKey(d.device, sz.label)]"
                              @update:model-value="toggleSize(d.device, sz.label)"
                            />
                            {{ sz.label }}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <UButton
                    block
                    size="sm"
                    icon="i-lucide-download"
                    :disabled="!!exporting"
                    @click="exportConfigured"
                  >
                    Export ZIP
                  </UButton>
                </div>
              </template>
            </UPopover>
          </div>
        </div>

        <!-- Row 2: device + size controls -->
        <div class="flex items-center gap-2.5 px-4 py-2 overflow-x-auto">
          <!-- Device tabs -->
          <div class="flex gap-1 bg-gray-100 rounded-lg p-1 items-center shrink-0">
            <button
              v-for="d in deviceOptions"
              :key="d.value"
              class="px-3.5 py-1 rounded-md border-none cursor-pointer text-xs font-semibold whitespace-nowrap"
              :class="device === d.value ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-500'"
              @click="device = d.value; sizeIdx = 0"
            >
              {{ d.label }}
            </button>
            <select
              :value="isTablet ? device : ''"
              class="text-xs font-semibold border-none rounded-md px-2.5 py-1 cursor-pointer outline-none shrink-0"
              :class="isTablet ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-500'"
              @change="(e: Event) => { const v = (e.target as HTMLSelectElement).value; if (v) { device = v as Device; sizeIdx = 0 } }"
            >
              <option
                value=""
                disabled
              >
                Android Tab.
              </option>
              <option
                v-for="t in tabletOptions"
                :key="t.value"
                :value="t.value"
              >
                {{ t.label }}
              </option>
            </select>
          </div>

          <!-- Orientation -->
          <div
            v-if="isTablet"
            class="flex gap-1 bg-gray-100 rounded-lg p-1 shrink-0"
          >
            <button
              v-for="o in (['portrait', 'landscape'] as Orientation[])"
              :key="o"
              class="px-3.5 py-1 rounded-md border-none cursor-pointer text-xs font-semibold whitespace-nowrap"
              :class="orientation === o ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-500'"
              @click="orientation = o; sizeIdx = 0"
            >
              {{ o === 'portrait' ? 'Portrait ↕' : 'Landscape ↔' }}
            </button>
          </div>

          <!-- Size picker -->
          <select
            v-if="device !== 'feature-graphic'"
            :value="sizeIdx"
            class="text-xs border border-gray-200 rounded-md px-2.5 py-1 bg-white text-gray-700 shrink-0"
            @change="sizeIdx = Number(($event.target as HTMLSelectElement).value)"
          >
            <option
              v-for="(s, i) in canvasDims.sizes"
              :key="i"
              :value="i"
            >
              {{ s.label }} — {{ s.w }}×{{ s.h }}
            </option>
          </select>

          <!-- Language switcher — folded into the device row (right-aligned) so
               multi-locale editing doesn't need its own toolbar row. Only shown
               when more than one language is selected. -->
          <div
            v-if="localeTabs.length > 1"
            class="flex items-center gap-1.5 shrink-0 ml-auto pl-2"
          >
            <UIcon
              name="i-lucide-languages"
              class="size-4 text-gray-400 shrink-0"
              title="Generate in the sidebar · edits saved per language"
            />
            <div class="flex gap-1 bg-gray-100 rounded-lg p-1 items-center shrink-0">
              <button
                v-for="t in localeTabs"
                :key="t.code"
                class="px-3 py-1 rounded-md border-none cursor-pointer text-xs font-semibold whitespace-nowrap flex items-center gap-1"
                :class="config.locale === t.code ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-500'"
                :title="t.hasCopy ? 'Edited / generated' : 'Not generated yet'"
                @click="switchLocale(t.code)"
              >
                {{ t.code.toUpperCase() }}
                <span
                  v-if="t.hasCopy"
                  class="size-1.5 rounded-full bg-emerald-500 shrink-0"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview area -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 relative">
        <!-- Feature graphic -->
        <div
          v-if="device === 'feature-graphic'"
          class="p-6"
        >
          <div class="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <p class="text-xs text-gray-500">
              Google Play Feature Graphic · 1024×500
            </p>
            <div class="flex items-center gap-1.5 flex-wrap">
              <template v-if="fgEditMode">
                <UButton size="xs" color="neutral" variant="soft" icon="i-lucide-type" @click="addFgText">Text</UButton>
                <UButton size="xs" :color="fgHasChips ? 'primary' : 'neutral'" :variant="fgHasChips ? 'solid' : 'soft'" icon="i-lucide-tags" @click="toggleFgChips">Chips</UButton>
                <UButton size="xs" color="neutral" variant="soft" icon="i-lucide-image" @click="addFgIcon">Icon</UButton>
                <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-rotate-ccw" @click="resetFg">Reset</UButton>
              </template>
              <UButton
                size="sm"
                :color="fgEditMode ? 'primary' : 'neutral'"
                :variant="fgEditMode ? 'solid' : 'soft'"
                :icon="fgEditMode ? 'i-lucide-check' : 'i-lucide-pencil'"
                @click="fgEditMode = !fgEditMode"
              >
                {{ fgEditMode ? 'Done' : 'Edit' }}
              </UButton>
              <UButton
                size="sm"
                icon="i-lucide-download"
                :loading="!!exporting"
                :disabled="!!exporting"
                @click="exportFG"
              >
                Download
              </UButton>
            </div>
          </div>
          <div class="flex gap-6 items-start">
          <div
            ref="fgWrapEl"
            class="relative"
            :style="{ flex: '1 1 0%', maxWidth: `${FGW}px`, aspectRatio: `${FGW}/${FGH}` }"
          >
            <div :style="{ width: `${FGW}px`, height: `${FGH}px`, transform: `scale(${fgScale})`, transformOrigin: 'top left' }">
              <div
                class="rounded-xl overflow-hidden shadow-lg"
                :style="{ width: `${FGW}px`, height: `${FGH}px` }"
              >
                <FeatureGraphic :cfg="slideConfig" :elements="config.fgElements" />
              </div>
              <SlideTransformOverlay
                v-if="fgEditMode"
                :elements="config.fgElements"
                :c-w="FGW"
                :c-h="FGH"
                device-frame="iphone"
                :handle-scale="0.24 / fgScale"
                @element-change="onFgElementChange"
                @element-delete="onFgElementDelete"
              />
            </div>
          </div>
          <div
            v-if="fgEditMode"
            class="w-80 shrink-0 space-y-4"
          >
            <!-- Text elements -->
            <div class="space-y-2">
              <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Text content</p>
              <div
                v-for="t in fgTextElements"
                :key="t.id"
                class="flex items-center gap-2"
              >
                <UInput
                  :model-value="fgTextValue(t)"
                  :disabled="!!t.bind"
                  size="xs"
                  class="flex-1"
                  placeholder="Text"
                  @update:model-value="onFgElementChange({ id: t.id, patch: { text: $event as string } })"
                />
                <UButton
                  v-if="t.bind"
                  size="xs"
                  color="neutral"
                  variant="soft"
                  :title="`Synced from ${t.bind === 'appName' ? 'app name' : 'headline'} — unlink to edit freely`"
                  @click="unbindFgText(t)"
                >
                  Unlink
                </UButton>
                <span
                  v-else
                  class="text-[10px] text-gray-400 shrink-0 w-12"
                >custom</span>
              </div>
            </div>

            <!-- Chips = feature list -->
            <div
              v-if="fgHasChips"
              class="space-y-2"
            >
              <div class="flex items-center justify-between">
                <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Chips (features)</p>
                <button
                  type="button"
                  class="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                  @click="addFgFeature"
                >
                  <UIcon
                    name="i-lucide-plus"
                    class="size-3.5"
                  />
                  Add
                </button>
              </div>
              <div
                v-for="(f, i) in config.features"
                :key="i"
                class="flex items-center gap-2"
              >
                <UInput
                  :model-value="f"
                  size="xs"
                  class="flex-1"
                  placeholder="Feature"
                  @update:model-value="updateFgFeature(i, $event as string)"
                />
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-x"
                  title="Remove chip"
                  @click="removeFgFeature(i)"
                />
              </div>
              <p
                v-if="!config.features.length"
                class="text-xs text-gray-400"
              >
                No features yet — add one to show chips.
              </p>
            </div>
          </div>
          </div>
          <div
            ref="fgRef"
            :style="{ position: 'absolute', left: '-9999px', top: 0, width: `${FGW}px`, height: `${FGH}px` }"
          >
            <FeatureGraphic :cfg="slideConfig" :elements="config.fgElements" />
          </div>
        </div>

        <!-- Slide grid -->
        <template v-else>
          <!-- Grid mode (default) -->
          <template v-if="focusedSlideIdx === null">
          <!-- Empty-state hint: shown until the user uploads their first screenshot. -->
          <div
            v-if="!hasAnyImages"
            class="mx-auto max-w-[1100px] mt-6 mx-6 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-5 py-4 flex items-center gap-3"
          >
            <UIcon
              name="i-lucide-image-plus"
              class="size-5 text-blue-600 shrink-0"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-blue-900">
                Add your first screenshot to bring slides to life
              </p>
              <p class="text-xs text-blue-700/80 mt-0.5">
                Slides below are placeholders. Open the
                <span class="font-semibold">Screenshots</span> step in the sidebar to upload.
              </p>
            </div>
          </div>
          <!-- Thumbnails strip — quick visual index of every slide. Click to jump. -->
          <div class="sticky top-0 z-20 bg-gray-100/85 backdrop-blur border-b border-gray-200 px-6 py-2 flex gap-1.5 overflow-x-auto">
            <button
              v-for="(v, i) in slideVariants"
              :key="`thumb-${i}`"
              class="shrink-0 px-2.5 py-1 rounded-md border text-[11px] font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              :class="config.copy[i]?.label ? 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-600' : 'border-gray-200 bg-white/60 text-gray-400 hover:text-gray-600'"
              :title="`Jump to slide ${i + 1}`"
              @click="scrollToSlide(i)"
            >
              <span class="text-gray-400 font-mono">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="truncate max-w-[110px]">{{ config.copy[i]?.label || `Slide ${i + 1}` }}</span>
            </button>
          </div>

          <div class="p-6 grid grid-cols-3 gap-6 max-w-[1100px] mx-auto">
            <div
              v-for="(v, i) in slideVariants"
              :key="`${device}-${orientation}-${i}`"
              :ref="(el: Element | ComponentPublicInstance | null) => setPreviewRef(i, el)"
            >
              <SlideCard
                :index="i"
                :variant="resolveVariant(i)"
                :cfg="slideConfig"
                :c-w="canvasDims.cW"
                :c-h="canvasDims.cH"
                :label="config.copy[i]?.label || `Slide ${i + 1}`"
                :device-frame="deviceFrame"
                @export="exportOne(i)"
                @edit="openEdit(i)"
                @focus="enterFocus(i)"
              />
            </div>
          </div>

          </template>

          <!-- Focused canvas mode — replaces the grid entirely so it owns the
               full canvas area. Inline (not absolute overlay) so scroll
               position and content height don't interact. -->
          <div
            v-else
            class="h-full flex flex-col bg-gray-100"
          >
            <!-- Header: close + title + per-slide actions -->
            <div class="shrink-0 flex items-center justify-between gap-3 px-5 py-3 bg-white border-b border-gray-200">
              <div class="flex items-center gap-3 min-w-0">
                <UButton
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-x"
                  aria-label="Close focused view"
                  title="Exit focused view (Esc)"
                  @click="exitFocus"
                >
                  Close
                </UButton>
                <div class="min-w-0">
                  <div class="text-sm font-semibold text-gray-700 truncate">
                    Slide {{ String(focusedSlideIdx + 1).padStart(2, '0') }}
                    <span class="text-gray-400 font-normal">
                      · {{ config.copy[focusedSlideIdx]?.label || `Slide ${focusedSlideIdx + 1}` }}
                    </span>
                  </div>
                  <div class="text-[11px] text-blue-600 mt-0.5 flex items-center gap-1">
                    <UIcon name="i-lucide-move" class="size-3" />
                    Drag the device frame or caption to reposition
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <!-- Add element — dropdown of element types the user can drop
                     onto the slide. Each lands centered on the canvas with
                     sensible defaults and can be immediately dragged. -->
                <UDropdownMenu
                  :items="[
                    { label: 'Device frame', icon: 'i-lucide-smartphone', onSelect: () => addDevice(focusedSlideIdx!) },
                    { label: 'Caption text', icon: 'i-lucide-type', onSelect: () => addCaption(focusedSlideIdx!) },
                    { label: 'App icon', icon: 'i-lucide-image', onSelect: () => addIcon(focusedSlideIdx!) },
                  ]"
                >
                  <UButton
                    size="sm"
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-plus"
                    trailing-icon="i-lucide-chevron-down"
                  >
                    Add
                  </UButton>
                </UDropdownMenu>

                <!-- Layout menu — groups the variant picker, reset, and the
                     per-language apply action so the header stays uncluttered. -->
                <UPopover>
                  <UButton
                    size="sm"
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-layout-template"
                    trailing-icon="i-lucide-chevron-down"
                  >
                    Layout
                  </UButton>
                  <template #content>
                    <div class="p-3 w-[300px] space-y-3">
                      <div>
                        <label class="block text-[11px] font-semibold text-gray-600 mb-1">Variant</label>
                        <USelect
                          :model-value="resolveVariant(focusedSlideIdx)"
                          :items="VARIANT_OPTIONS.map(o => ({ label: `${o.label} — ${o.desc}`, value: o.value }))"
                          value-key="value"
                          label-key="label"
                          size="sm"
                          class="w-full"
                          @update:model-value="(v: number) => pickVariant(focusedSlideIdx!, v)"
                        />
                      </div>
                      <UButton
                        block
                        size="sm"
                        :color="isOverridden(focusedSlideIdx) ? 'error' : 'neutral'"
                        variant="ghost"
                        icon="i-lucide-rotate-ccw"
                        :disabled="!isOverridden(focusedSlideIdx)"
                        :title="isOverridden(focusedSlideIdx) ? 'Restore default layout for this slide' : 'No custom layout to reset'"
                        @click="resetSlide(focusedSlideIdx)"
                      >
                        Reset layout
                      </UButton>
                      <UButton
                        v-if="localeTabs.length > 1"
                        block
                        size="sm"
                        color="neutral"
                        variant="soft"
                        icon="i-lucide-languages"
                        title="Copy this slide's layout (position, variant) to every language. Text stays per-language."
                        @click="applyLayoutToAllLocales(focusedSlideIdx)"
                      >
                        Apply layout → all languages
                      </UButton>
                    </div>
                  </template>
                </UPopover>
                <UButton
                  size="sm"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-pencil"
                  @click="openEdit(focusedSlideIdx)"
                >
                  Edit copy
                </UButton>
                <UButton
                  size="sm"
                  icon="i-lucide-download"
                  :loading="!!exporting"
                  :disabled="!!exporting"
                  @click="exportOne(focusedSlideIdx)"
                >
                  Download
                </UButton>
              </div>
            </div>

            <!-- Centered large slide preview. Reuses SlideCard for the same
                 hover affordances; the wider container makes its ResizeObserver
                 scale the slide up automatically. -->
            <div class="flex-1 min-h-0 flex items-center justify-center p-6 overflow-hidden">
              <div
                class="h-full"
                :style="{ aspectRatio: `${canvasDims.cW}/${canvasDims.cH}`, maxWidth: '100%' }"
              >
                <SlideCard
                  :index="focusedSlideIdx"
                  :variant="resolveVariant(focusedSlideIdx)"
                  :cfg="slideConfig"
                  :c-w="canvasDims.cW"
                  :c-h="canvasDims.cH"
                  :label="config.copy[focusedSlideIdx]?.label || `Slide ${focusedSlideIdx + 1}`"
                  :device-frame="deviceFrame"
                  :transform-mode="true"
                  @export="exportOne(focusedSlideIdx)"
                  @edit="openEdit(focusedSlideIdx)"
                  @element-change="(p: { id: string, patch: Partial<SlideElement> }) => onElementChange(focusedSlideIdx!, p)"
                  @element-delete="(id: string) => onElementDelete(focusedSlideIdx!, id)"
                />
              </div>
            </div>

            <!-- Per-device screenshot picker — only meaningful when the slide
                 has device frames. Lets each frame (e.g. the two phones in a
                 paired layout) show a different uploaded screenshot. -->
            <div
              v-if="focusedDeviceElements.length"
              class="shrink-0 bg-white border-t border-gray-200 px-5 py-2 flex items-center gap-3 overflow-x-auto"
            >
              <span class="text-[11px] font-semibold text-gray-500 shrink-0 flex items-center gap-1">
                <UIcon name="i-lucide-image" class="size-3.5" />
                Screenshots
              </span>
              <div
                v-for="el in focusedDeviceElements"
                :key="`devimg-${el.id}`"
                class="flex items-center gap-1.5 shrink-0"
              >
                <span class="text-[11px] text-gray-500">{{ deviceElLabel(el) }}</span>
                <UPopover>
                  <button
                    type="button"
                    class="flex items-center gap-1 border border-gray-200 rounded-md pl-1 pr-1.5 py-1 hover:border-blue-300 cursor-pointer"
                    title="Choose which uploaded screenshot this frame shows"
                  >
                    <span class="block w-6 h-6 rounded overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                      <img
                        v-if="slideConfig.images[el.imageIdx]"
                        :src="slideConfig.images[el.imageIdx]!"
                        class="w-full h-full object-cover"
                        alt=""
                      >
                    </span>
                    <span class="text-[11px] font-mono text-gray-600">#{{ el.imageIdx + 1 }}</span>
                    <UIcon name="i-lucide-chevron-down" class="size-3 text-gray-400" />
                  </button>
                  <template #content>
                    <div class="p-2 grid grid-cols-4 gap-1.5 w-[260px]">
                      <button
                        v-for="opt in deviceImageOptions"
                        :key="`opt-${el.id}-${opt.idx}`"
                        type="button"
                        class="relative aspect-[9/16] rounded overflow-hidden border-2 cursor-pointer"
                        :class="opt.idx === el.imageIdx ? 'border-blue-500' : 'border-transparent hover:border-blue-300'"
                        :title="`Screenshot ${opt.idx + 1}`"
                        @click="setDeviceImage(el.id, opt.idx)"
                      >
                        <img
                          v-if="opt.img"
                          :src="opt.img"
                          class="w-full h-full object-cover"
                          alt=""
                        >
                        <div
                          v-else
                          class="w-full h-full bg-gray-100"
                        />
                        <span class="absolute bottom-0 left-0 text-[8px] font-mono bg-black/55 text-white px-1 rounded-tr">{{ opt.idx + 1 }}</span>
                      </button>
                    </div>
                  </template>
                </UPopover>
                <button
                  type="button"
                  class="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  :title="`Remove the ${deviceElLabel(el).toLowerCase()} device frame`"
                  @click="onElementDelete(focusedSlideIdx!, el.id)"
                >
                  <UIcon name="i-lucide-trash-2" class="size-3.5" />
                </button>
              </div>
              <span class="text-[10px] text-gray-400 shrink-0">
                Pick which uploaded screenshot each frame shows.
              </span>
            </div>

            <!-- Slide filmstrip — visual thumbnails of every slide for quick
                 switching. Screenshot preview + index badge + label; the active
                 slide is ringed. -->
            <div class="shrink-0 bg-white border-t border-gray-200 px-4 py-2.5 flex gap-2 overflow-x-auto">
              <button
                v-for="(_, i) in slideVariants"
                :key="`focused-thumb-${i}`"
                type="button"
                class="group/th shrink-0 flex flex-col items-center gap-1 cursor-pointer"
                :title="`Switch to slide ${i + 1}`"
                @click="enterFocus(i)"
              >
                <div
                  class="relative w-12 rounded-lg overflow-hidden border-2 transition-all"
                  :class="i === focusedSlideIdx ? 'border-blue-500 shadow-md' : 'border-gray-200 group-hover/th:border-blue-300'"
                  :style="{ aspectRatio: `${canvasDims.cW}/${canvasDims.cH}` }"
                >
                  <img
                    v-if="slideConfig.images[i]"
                    :src="slideConfig.images[i]!"
                    class="w-full h-full object-cover"
                    alt=""
                  >
                  <div
                    v-else
                    class="w-full h-full bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center"
                  >
                    <UIcon name="i-lucide-sparkles" class="size-3 text-gray-300" />
                  </div>
                  <span class="absolute top-0 left-0 text-[8px] font-mono font-bold bg-black/55 text-white px-1 rounded-br">
                    {{ String(i + 1).padStart(2, '0') }}
                  </span>
                </div>
                <span
                  class="text-[9px] font-semibold max-w-[52px] truncate"
                  :class="i === focusedSlideIdx ? 'text-blue-600' : 'text-gray-500'"
                >
                  {{ config.copy[i]?.label || `Slide ${i + 1}` }}
                </span>
              </button>
            </div>
          </div>

          <!-- Offscreen export targets -->
          <div class="fixed top-0 left-0 pointer-events-none -z-[100] overflow-hidden w-0 h-0">
            <div
              v-for="(v, i) in slideVariants"
              :key="`exp-${device}-${orientation}-${i}`"
              :ref="(el: Element | ComponentPublicInstance | null) => setRef(i, el)"
              :style="{ position: 'absolute', left: '-9999px', top: 0, width: `${canvasDims.cW}px`, height: `${canvasDims.cH}px` }"
            >
              <SlideTemplate
                :variant="v"
                :cfg="slideConfig"
                :c-w="canvasDims.cW"
                :c-h="canvasDims.cH"
                :device-frame="deviceFrame"
              />
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Quick-start template picker -->
    <UModal
      :open="templatePickerOpen"
      title="Start from a template"
      description="Pre-fills tone of voice — colours, headlines, and feature bullets. Your icon and screenshots stay untouched."
      @update:open="(v: boolean) => { templatePickerOpen = v; if (!v) templatesDismissed = true }"
    >
      <template #body>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            v-for="t in START_TEMPLATES"
            :key="t.key"
            type="button"
            class="text-left rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all p-4 cursor-pointer bg-white group"
            @click="applyTemplate(t)"
          >
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-xl leading-none">{{ t.emoji }}</span>
              <span class="text-sm font-bold text-gray-900 group-hover:text-blue-600">{{ t.label }}</span>
            </div>
            <p class="text-xs text-gray-500 leading-relaxed">
              {{ t.description }}
            </p>
            <div class="mt-2.5 flex gap-1">
              <span
                v-for="key in ['primary', 'accent', 'bgFrom', 'bgTo'] as const"
                :key="key"
                class="size-4 rounded-full border border-white shadow-sm"
                :style="{ backgroundColor: t.colors[key] }"
              />
            </div>
          </button>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end w-full">
          <UButton
            color="neutral"
            variant="ghost"
            @click="templatePickerOpen = false; templatesDismissed = true"
          >
            Start blank
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Copy variants — A/B test alternative tones. -->
    <UModal
      v-model:open="variantsOpen"
      title="Pick a copy variant"
      description="Three tone-of-voice variations of your current slides. Choose one to apply, or close to keep the current copy."
      :ui="{ content: 'sm:max-w-3xl' }"
    >
      <template #body>
        <div
          v-if="generating && !copyVariants.length"
          class="flex items-center justify-center py-12 text-sm text-gray-500"
        >
          <UIcon
            name="i-lucide-loader"
            class="size-4 mr-2 animate-spin"
          />
          Generating variants…
        </div>
        <div
          v-else-if="!copyVariants.length"
          class="py-8 text-center text-sm text-gray-500"
        >
          No variants yet.
          <UButton
            size="sm"
            variant="ghost"
            class="ml-2"
            @click="generateCopyVariants"
          >
            Try again
          </UButton>
        </div>
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <div
            v-for="(variant, vi) in copyVariants"
            :key="`variant-${vi}`"
            class="rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all p-3 flex flex-col gap-2 cursor-pointer bg-white"
            @click="chooseVariant(vi)"
          >
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-gray-500 tracking-wider uppercase">
                Variant {{ vi + 1 }}
              </span>
              <span class="text-[10px] text-gray-400">{{ variant.length }} slides</span>
            </div>
            <ul class="space-y-1.5 max-h-[280px] overflow-y-auto">
              <li
                v-for="(slide, si) in variant"
                :key="`v${vi}-s${si}`"
                class="text-xs"
              >
                <span class="font-mono text-gray-400">{{ String(si + 1).padStart(2, '0') }}</span>
                <span class="text-blue-600 font-bold ml-1">{{ slide.label }}</span>
                <p class="text-gray-700 mt-0.5 leading-snug whitespace-pre-line">
                  {{ slide.headline }}
                </p>
              </li>
            </ul>
            <UButton
              size="xs"
              block
              class="mt-auto"
              @click.stop="chooseVariant(vi)"
            >
              Use this variant
            </UButton>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-between w-full">
          <span class="text-[11px] text-gray-400">
            Existing position fine-tunes are preserved when you pick a variant.
          </span>
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            :loading="generating"
            :disabled="generating || !config.ai.apiKey"
            icon="i-lucide-refresh-cw"
            @click="generateCopyVariants"
          >
            Regenerate
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Store preview — what the first 3 slides look like above-the-fold. -->
    <UModal
      v-model:open="storePreviewOpen"
      :title="`${storePreviewPlatform} preview`"
      description="A rough simulation of the listing row most users see first."
      :ui="{ content: 'sm:max-w-2xl' }"
    >
      <template #body>
        <div class="rounded-2xl bg-white p-5">
          <!-- App identity row -->
          <div class="flex items-start gap-3 mb-5">
            <div class="size-16 rounded-2xl overflow-hidden shrink-0 border border-gray-200 bg-gray-50">
              <img
                v-if="config.appIcon"
                :src="config.appIcon"
                alt=""
                class="w-full h-full object-cover"
              >
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-2xl text-gray-300"
              >
                ?
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-base font-bold text-gray-900 leading-tight truncate">
                {{ config.appName || 'Your App' }}
              </div>
              <div class="text-xs text-gray-500 mt-0.5 truncate">
                {{ config.appDescription ? config.appDescription.split(/[.!?]/)[0] : 'Your tagline goes here' }}
              </div>
              <div class="mt-2 inline-flex px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
                Get
              </div>
            </div>
          </div>

          <!-- First 3 slides row, iOS-style -->
          <div class="flex gap-2 overflow-x-auto pb-1">
            <div
              v-for="i in [0, 1, 2]"
              :key="`store-preview-${i}`"
              class="shrink-0 w-[140px] rounded-xl overflow-hidden border border-gray-200"
              :style="{ aspectRatio: `${canvasDims.cW}/${canvasDims.cH}` }"
            >
              <div
                class="origin-top-left"
                :style="{
                  width: `${canvasDims.cW}px`,
                  height: `${canvasDims.cH}px`,
                  transform: `scale(${140 / canvasDims.cW})`,
                }"
              >
                <SlideTemplate
                  :variant="i + 1"
                  :cfg="slideConfig"
                  :c-w="canvasDims.cW"
                  :c-h="canvasDims.cH"
                  :device-frame="deviceFrame"
                />
              </div>
            </div>
          </div>

          <p class="mt-4 text-[11px] text-gray-400 leading-relaxed">
            Users see the first 3 slides without scrolling. Make sure the strongest hook is in slide 1, the most-used feature in slide 2, and a differentiator or social proof in slide 3.
          </p>
        </div>
      </template>
    </UModal>

    <!-- Translations manager — import / translate / edit every language at once. -->
    <UModal
      v-model:open="translationsOpen"
      title="Translations"
      description="Manage copy for every language side by side. Import a file, AI-translate from one language, or edit cells directly."
      :ui="{ content: 'sm:max-w-5xl' }"
    >
      <template #body>
        <TranslationsManager
          :config="config"
          :generating="generating"
          @cell="(p) => setLocaleCell(p.locale, p.idx, p.field, p.value)"
          @import="(p) => setLocaleCopy(p.locale, p.slides)"
          @export="(loc) => exportLocaleCopy(loc)"
          @translate="onTranslate"
          @switch-locale="(loc) => switchLocale(loc)"
        />
      </template>
    </UModal>

    <!-- Inline slide-copy editor -->
    <UModal
      :open="editingSlide !== null"
      :title="`Edit slide ${editingSlide !== null ? editingSlide + 1 : ''}`"
      description="Tweak the label and headline. Use line breaks in the headline to wrap to a second line."
      @update:open="(v: boolean) => { if (!v) editingSlide = null }"
    >
      <template #body>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Label</label>
            <UInput
              v-model="editingDraft.label"
              placeholder="HERO"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Headline</label>
            <UTextarea
              v-model="editingDraft.headline"
              :rows="3"
              placeholder="Line one&#10;Line two"
              class="w-full"
            />
            <p class="mt-1 text-[10px] text-gray-500">
              Up to 5 words per line, 2 lines.
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            color="neutral"
            variant="ghost"
            @click="editingSlide = null"
          >
            Cancel
          </UButton>
          <UButton
            @click="saveEdit"
          >
            Save
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
