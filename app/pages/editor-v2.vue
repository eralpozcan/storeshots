<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import JSZip from 'jszip'
import type { AppleArtwork, Device, DeviceElement, ImagesKey, SlideConfig, SlideElement, UserConfig } from '~/utils/types'
import { DEFAULT_CONFIG } from '~/utils/defaults'
import { START_TEMPLATES, type StartTemplate } from '~/utils/templates'
import { BUILTIN_FONTS, customFontFaceCss, injectCustomFont, resolveFontStack } from '~/utils/fonts'
import { LOCALE_OPTIONS } from '~/utils/locales'
import { VARIANT_PRESETS } from '~/utils/canvas'
import { captureElement } from '~/utils/capture'
import { placeUploads, exportableSlides, applyLayoutTemplate } from '~/utils/editor-v2'
import { loadV2Draft, saveV2Draft } from '~/utils/v2-draft'
import { APPLE_TARGETS, appleAssetSpec } from '~/utils/apple-assets'
import { loadAiPreferences } from '~/utils/ai-preferences'
import { V2_OUTPUT_TARGETS, prepareSet, bundleJobs, outputsMatch, updateWorkflowImages, reorderSet, captureLayouts, restoreLayouts, outputSizes, sizeKey } from '~/utils/v2-workflow'

definePageMeta({ layout: false })
useSeoMeta({ title: 'Editor V2 Beta — Storeshots', robots: 'noindex, nofollow' })

const toast = useToast()
const saved = ref('Loading your draft…')
let pendingSave = Promise.resolve()
let revision = 0
function persist(value: UserConfig) {
  const snapshot: UserConfig = JSON.parse(JSON.stringify(value))
  const current = ++revision
  saved.value = 'Saving…'
  pendingSave = pendingSave.catch(() => {}).then(() => saveV2Draft(snapshot)).then(() => {
    if (current === revision) saved.value = 'Saved on this device'
  }).catch(() => {
    saved.value = 'Not saved — download a project backup'
    toast.add({ title: 'Could not save this draft', description: 'Browser storage may be full or unavailable. Use Save project to keep a backup.', color: 'error' })
  })
}
const {
  config, device, orientation, sizeIdx, ready, generating, exporting,
  canvasDims, slideConfig, sizePick, isTablet, updateConfig, switchLocale,
  generateCopy, generateFullDesign, generateLocales, extractColorsFromScreenshots,
  importProject, exportProject,
} = useScreenshots({ load: () => JSON.parse(JSON.stringify(DEFAULT_CONFIG)), save: persist })
const { resolveElements, patchElement, removeElement, resetSlide, isOverridden } = useElementOverride(config, updateConfig)

const step = ref(1)
const steps = ['Screenshots', 'Outputs', 'Your set']
const outputIds = ref<string[]>(['iphone'])
const storePreviewOpen = ref(false)
const editing = ref(false)
const useAi = ref(false)
const preparing = ref(false)
const sourceImageKey = ref<ImagesKey>('iphone')
const outputsPending = computed(() => !outputsMatch(outputIds.value, config.value.v2Workflow?.outputs || []))
const sourceReady = computed(() => config.value.images[sourceImageKey.value].some(Boolean))
const artworkUploadKey = ref<ImagesKey>()
const artworkInput = ref<HTMLInputElement>()
function addArtwork(key: ImagesKey) { artworkUploadKey.value = key; artworkInput.value?.click() }
async function onArtworkUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const key = artworkUploadKey.value
  if (key && input.files?.length) await addFiles(Array.from(input.files), 0, key)
  input.value = ''
  artworkUploadKey.value = undefined
}
const outputTargets = computed(() => V2_OUTPUT_TARGETS.filter(target => outputIds.value.includes(target.id)))
const bundleSummary = computed(() => {
  try { return { count: bundleJobs(config.value, outputIds.value).length, error: '' } }
  catch (error) { return { count: 0, error: (error as Error).message } }
})
function toggleOutput(id: string) {
  outputIds.value = outputIds.value.includes(id) ? outputIds.value.filter(value => value !== id) : [...outputIds.value, id]
}
function previewOutput(id: string) {
  const target = V2_OUTPUT_TARGETS.find(output => output.id === id)
  if (target) { device.value = target.device; orientation.value = target.orientation }
}
function reopenProject() {
  layoutUndo.value = undefined
  const workflow = config.value.v2Workflow
  const valid = V2_OUTPUT_TARGETS.filter(target => workflow?.outputs.includes(target.id))
  const source = V2_OUTPUT_TARGETS.find(target => config.value.images[target.imageKey].some(Boolean))
  outputIds.value = valid.length ? valid.map(target => target.id) : [source?.id || 'iphone']
  sourceImageKey.value = workflow?.sourceKey || source?.imageKey || 'iphone'
  previewOutput(workflow?.prepared && valid.length ? valid[0]!.id : source?.id || 'iphone')
  step.value = workflow?.prepared && valid.length ? 3 : source ? 2 : 1
  selected.value = 0
  editing.value = false
  focused.value = false
}
async function createSet() {
  if (busy.value || !config.value.images[sourceImageKey.value].some(Boolean) || !outputIds.value.length) return
  preparing.value = true
  try {
    const firstPreparation = !config.value.v2Workflow?.prepared
    const prepared = prepareSet(config.value, outputIds.value, sourceImageKey.value)
    bundleJobs({ ...prepared, selectedLocales: [prepared.locale] }, outputIds.value)
    updateConfig({ ...prepared, v2Workflow: { ...prepared.v2Workflow!, prepared: false } })
    if (firstPreparation && useAi.value && aiReady.value && !await generateFullDesign(config.value.images[sourceImageKey.value])) return
    updateConfig({ v2Workflow: { ...config.value.v2Workflow!, outputs: [...outputIds.value], prepared: true } })
    previewOutput(outputIds.value[0]!)
    editing.value = false
    setStep(3)
  } catch (error) {
    toast.add({ title: 'Your set needs one more thing', description: (error as Error).message, color: 'warning' })
  } finally { preparing.value = false }
}
const selected = ref(0)
const focused = ref(false)
const placementMode = ref(false)
const panel = ref('Templates')
const uploading = ref(false)
const uploadInput = ref<HTMLInputElement>()
const iconInput = ref<HTMLInputElement>()
const projectInput = ref<HTMLInputElement>()
const replaceIndex = ref<number | null>(null)
const headlineInput = ref<HTMLTextAreaElement>()
const chosenTheme = ref('')
const chosenLayout = ref('balanced')
const downloadDone = ref(false)
const aiSettingsOpen = ref(false)
const aiReady = computed(() => !!config.value.ai.apiKey.trim() && !!(config.value.ai.provider === 'claude' ? config.value.ai.claudeModel : config.value.ai.openrouterModel).trim())
function saveAiSettings(ai: UserConfig['ai']) { updateConfig({ ai }) }
function connectOrGenerate(action: () => unknown) {
  if (!aiReady.value) { aiSettingsOpen.value = true; return }
  action()
}
const busy = computed(() => preparing.value || uploading.value || generating.value || !!exporting.value)
const assetSpec = computed(() => appleAssetSpec(device.value, orientation.value))
const assetKind = computed(() => assetSpec.value?.kind ?? (device.value === 'feature-graphic' ? 'feature-graphic' : undefined))
const singleAsset = computed(() => assetKind.value === 'creative' || assetKind.value === 'feature-graphic')
const hasOrientation = computed(() => isTablet.value || assetKind.value === 'duo')
const designPanels = computed(() => assetSpec.value ? ['Artwork', 'Languages'] : assetKind.value ? ['Artwork', 'Background', 'Brand', 'Languages'] : focused.value
  ? ['Text', 'Layout']
  : ['Templates', 'Background'])
const advancedPanels = ['Brand', 'AI', 'Languages']
function toggleAdvanced(event: Event) {
  if (!(event.target as HTMLDetailsElement).open && advancedPanels.includes(panel.value)) panel.value = 'Templates'
}
const targets: { label: string; value: Device }[] = [
  ...APPLE_TARGETS,
  { label: 'iPhone', value: 'iphone' }, { label: 'Android phone', value: 'android' },
  { label: 'iPad', value: 'ipad' }, { label: 'Android 7" tablet', value: 'android-7' },
  { label: 'Android 10" tablet', value: 'android-10' },
  { label: 'Google Play · Feature Graphic', value: 'feature-graphic' },
]
const layouts = ['Centered', 'Two devices', 'Offset', 'Dark', 'Accent', 'Layered', 'Minimal', 'Editorial', 'Night', 'App spotlight']
const layoutTemplates = [
  { key: 'balanced', label: 'Balanced', description: 'Clear headlines with a calm, consistent device rhythm.', sequence: [1, 1, 1, 1, 1, 1, 1, 1, 1, 10] },
  { key: 'editorial', label: 'Editorial', description: 'Alternating alignments guide the eye through the story.', sequence: [1, 3, 1, 3, 1, 3, 1, 3, 1, 10] },
  { key: 'showcase', label: 'Showcase', description: 'Varied scale and paired devices for a stronger reveal.', sequence: [2, 3, 4, 5, 6, 7, 8, 9, 1, 10] },
] as const
const imageKey = computed<ImagesKey>(() => {
  if (assetSpec.value) return assetSpec.value.imageKey
  if (device.value === 'feature-graphic') return 'iphone'
  if (device.value === 'iphone') return 'iphone'
  if (device.value === 'android') return 'androidPhone'
  if (device.value === 'ipad') return orientation.value === 'landscape' ? 'ipadLandscape' : 'ipad'
  if (device.value === 'android-7') return orientation.value === 'landscape' ? 'androidTablet7L' : 'androidTablet7P'
  return orientation.value === 'landscape' ? 'androidTablet10L' : 'androidTablet10P'
})
const images = computed(() => config.value.images[imageKey.value])
const uploaded = computed(() => images.value.filter(Boolean).length)
const artwork = computed<AppleArtwork>(() => config.value.appleArtwork?.[imageKey.value] ?? {
  fit: 'contain', x: 50, y: 50, background: config.value.colors.bgFrom,
})
function changeArtwork(patch: Partial<AppleArtwork>) {
  updateConfig({ appleArtwork: { ...config.value.appleArtwork, [imageKey.value]: { ...artwork.value, ...patch } } })
  downloadDone.value = false
}
function resetArtwork() {
  const next = { ...config.value.appleArtwork }
  delete next[imageKey.value]
  updateConfig({ appleArtwork: next })
  downloadDone.value = false
}
const variants = computed(() => Array.from({ length: singleAsset.value ? 1 : 10 }, (_, i) => config.value.copy[i]?.variant ?? i + 1))
const exportIndices = computed(() => assetKind.value === 'feature-graphic' ? [0] : assetSpec.value
  ? variants.value.flatMap((_, i) => images.value[i] ? [i] : [])
  : exportableSlides(images.value, variants.value, config.value.v2Workflow?.includeClosing !== false))
const deviceFrame = computed(() => {
  if (device.value === 'iphone') return 'iphone' as const
  if (device.value === 'android') return 'android-phone' as const
  if (device.value === 'ipad') return orientation.value === 'landscape' ? 'ipad-l' as const : 'ipad' as const
  return orientation.value === 'landscape' ? 'android-tablet-l' as const : 'android-tablet-p' as const
})
// SlideTemplate addresses copy by layout number. Bind the selected slide's
// content into that slot so changing layouts never changes its text or image.
function viewFor(i: number): SlideConfig {
  const copy = [...slideConfig.value.copy]
  copy[variants.value[i]! - 1] = copy[i] || { label: '', headline: '' }
  return { ...slideConfig.value, copy }
}
const storePreviewIndices = computed(() => exportIndices.value.slice(0, 3))
const storeName = computed(() => device.value.startsWith('android') ? 'Google Play' : 'App Store')
const hasClosingCard = computed(() => outputTargets.value.some(target => !appleAssetSpec(target.device, target.orientation) && target.device !== 'feature-graphic' && config.value.copy.some((slide, i) => (slide.variant ?? i + 1) === 10 && !config.value.images[target.imageKey][i])))
function setIncludeClosing(includeClosing: boolean) {
  if (!config.value.v2Workflow) return
  updateConfig({ v2Workflow: { ...config.value.v2Workflow, includeClosing } })
  downloadDone.value = false
}
function chosenSizes(target: typeof V2_OUTPUT_TARGETS[number]) {
  try { return outputSizes(config.value, target).map(sizeKey) } catch { return [] }
}
function toggleSize(target: typeof V2_OUTPUT_TARGETS[number], key: string) {
  const current = chosenSizes(target)
  if (busy.value || !config.value.v2Workflow || (current.includes(key) && current.length === 1)) return
  const sizes = current.includes(key) ? current.filter(value => value !== key) : [...current, key]
  updateConfig({ v2Workflow: { ...config.value.v2Workflow, exportSizes: { ...config.value.v2Workflow.exportSizes, [target.id]: sizes } } })
  downloadDone.value = false
}
function resetDownloadSizes() {
  if (!config.value.v2Workflow || busy.value) return
  updateConfig({ v2Workflow: { ...config.value.v2Workflow, exportSizes: {} } })
  downloadDone.value = false
}
function editFromStorePreview(index: number) { storePreviewOpen.value = false; focusSlide(index) }
const selectedView = computed(() => viewFor(selected.value))
const selectedVariant = computed(() => variants.value[selected.value]!)
const selectedDevices = computed(() => resolveElements(selected.value, selectedVariant.value).filter((el): el is DeviceElement => el.type === 'device'))
const layoutUndo = shallowRef<{ locale: string; layouts: ReturnType<typeof captureLayouts>; chosen: string }>()
function rememberLayout() {
  layoutUndo.value = { locale: config.value.locale, layouts: captureLayouts(config.value.copy), chosen: chosenLayout.value }
}
function undoLayout() {
  const previous = layoutUndo.value
  if (!previous || previous.locale !== config.value.locale || busy.value) return
  updateConfig({ copy: restoreLayouts(config.value.copy, previous.layouts) })
  chosenLayout.value = previous.chosen
  layoutUndo.value = undefined
  placementMode.value = false
}
watch(() => config.value.locale, () => { layoutUndo.value = undefined })
function moveSlide(index: number, direction: -1 | 1) {
  const visible = assetKind.value ? [] : exportIndices.value
  const destination = visible[visible.indexOf(index) + direction]
  if (destination === undefined || busy.value) return
  updateConfig(reorderSet(config.value, index, destination))
  selected.value = destination
  layoutUndo.value = undefined
  downloadDone.value = false
  toast.add({ title: `Slide moved to position ${destination + 1}`, description: 'Order updated across screenshot outputs and languages.' })
}
function setFrameImage(id: string, index: number) {
  if (!images.value[index] || busy.value) return
  patchElement(selected.value, selectedVariant.value, id, { imageIdx: index })
}
function resetSelectedLayout() {
  rememberLayout()
  resetSlide(selected.value)
  placementMode.value = false
}

const colorFields = [
  { key: 'primary', label: 'Primary' }, { key: 'accent', label: 'Accent' },
  { key: 'textDark', label: 'Dark text' }, { key: 'textLight', label: 'Light text' },
  { key: 'bgFrom', label: 'Background start' }, { key: 'bgTo', label: 'Background end' },
] as const

watch([device, orientation], () => { sizeIdx.value = 0; downloadDone.value = false })
watch([device, orientation], () => {
  selected.value = 0
  placementMode.value = false
  focused.value = false
  panel.value = assetKind.value ? 'Artwork' : 'Templates'
})
watch(() => config.value.customFont, cf => injectCustomFont(cf ? customFontFaceCss(cf.dataUrl, cf.format) : null), { immediate: true })

onMounted(async () => {
  try {
    const draft = await loadV2Draft()
    if (draft) {
      config.value = draft
      reopenProject()
    }
    saved.value = draft ? 'Saved on this device' : 'Your V2 draft is separate from the classic editor'
  } catch {
    saved.value = 'Storage unavailable — save a project backup before leaving'
  } finally {
    try {
      const preferences = loadAiPreferences(localStorage)
      if (preferences) config.value = { ...config.value, ai: { ...config.value.ai, ...preferences, apiKey: preferences.provider === config.value.ai.provider ? config.value.ai.apiKey : '' } }
    } catch { /* Storage can be blocked; the project settings still work. */ }
    ready.value = true
  }
})

function setStep(value: number) {
  if (value === 3 && (!config.value.v2Workflow?.prepared || outputsPending.value)) return
  if (step.value === 1 && value === 2 && !config.value.v2Workflow?.prepared && uploaded.value && (assetSpec.value?.kind !== 'creative' || !config.value.images[sourceImageKey.value].some(Boolean))) sourceImageKey.value = imageKey.value
  step.value = value
  if (value === 3) { focused.value = false; editing.value = false; placementMode.value = false }
  if (value === 2) { focused.value = false; panel.value = assetKind.value ? 'Artwork' : 'Templates' }
  nextTick(() => document.getElementById('v2-step-title')?.focus())
}
function upload(replace: number | null = null) {
  replaceIndex.value = replace
  uploadInput.value?.click()
}
async function readImage(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose PNG, JPG or WebP images.')
  if (file.size > 15 * 1024 * 1024) throw new Error(`${file.name} is over 15 MB. Choose a smaller image.`)
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(`Could not read ${file.name}. Try again.`))
    reader.readAsDataURL(file)
  })
  const image = new Image()
  image.src = data
  try { await image.decode() } catch { throw new Error(`${file.name} could not be opened as an image.`) }
  return data
}
async function addFiles(files: File[], replace: number | null = null, targetKey?: ImagesKey) {
  if (!files.length || busy.value) return
  const key = targetKey || imageKey.value
  uploading.value = true
  try {
    if (replace !== null && files.length !== 1) throw new Error('Choose one image to replace this screenshot.')
    // Check capacity before reading large files. Commit only if every file succeeds.
    if (replace === null) placeUploads(config.value.images[key], files.map(() => 'pending'))
    const incoming = await Promise.all(files.map(readImage))
    const next = [...config.value.images[key]]
    const firstEmpty = next.findIndex(image => !image)
    if (replace !== null) next[replace] = incoming[0]!
    updateConfig(updateWorkflowImages(config.value, key, replace !== null ? next : placeUploads(next, incoming)))
    selected.value = replace ?? Math.max(0, firstEmpty)
    downloadDone.value = false
  } catch (error) {
    toast.add({ title: 'Screenshots not added', description: (error as Error).message, color: 'error' })
  } finally { uploading.value = false }
}
async function onUpload(event: Event) {
  const input = event.target as HTMLInputElement
  await addFiles(Array.from(input.files || []), replaceIndex.value)
  input.value = ''
  replaceIndex.value = null
}
async function onIconUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try { updateConfig({ appIcon: await readImage(file) }) }
  catch (error) { toast.add({ title: 'Icon not added', description: (error as Error).message, color: 'error' }) }
  input.value = ''
}
function removeImage(i: number) {
  const next = [...images.value]
  next[i] = null
  updateConfig(updateWorkflowImages(config.value, imageKey.value, next))
}
function changeCopy(field: 'headline' | 'label', value: string) {
  const copy = [...config.value.copy]
  copy[selected.value] = { ...copy[selected.value], label: '', headline: '', ...copy[selected.value], [field]: value }
  updateConfig({ copy })
}
function applyTheme(template: StartTemplate) {
  updateConfig({ colors: { ...template.colors } })
  chosenTheme.value = template.key
}
function useTemplateText() {
  const template = START_TEMPLATES.find(t => t.key === chosenTheme.value)
  if (!template) return
  const copy = config.value.copy.map((slide, i) => ({ ...slide, ...template.copy[i] }))
  updateConfig({ copy, features: [...template.features], aiBrief: template.aiBrief })
  if (focused.value) panel.value = 'Text'
}
function applyDeckLayout(template: typeof layoutTemplates[number]) {
  rememberLayout()
  const sequence: number[] = [...template.sequence]
  if (outputTargets.value.some(target => config.value.images[target.imageKey][9])) sequence[9] = 1
  updateConfig({ copy: applyLayoutTemplate(config.value.copy, sequence, VARIANT_PRESETS) })
  chosenLayout.value = template.key
}
function focusSlide(i: number) {
  selected.value = i
  focused.value = true
  placementMode.value = false
  panel.value = 'Text'
  if (assetKind.value) panel.value = 'Artwork'
  nextTick(() => {
    if (window.matchMedia('(max-width: 800px)').matches) document.querySelector('.v2-design')?.scrollIntoView({ block: 'start' })
    document.getElementById('v2-step-title')?.focus({ preventScroll: true })
  })
}
function showAllSlides() {
  focused.value = false
  placementMode.value = false
  panel.value = assetKind.value ? 'Artwork' : 'Templates'
  nextTick(() => document.getElementById('v2-step-title')?.focus())
}
function selectSlide(i: number) {
  selected.value = i
  placementMode.value = false
}
function toggleLocale(code: string) {
  const current = config.value.selectedLocales
  if (current.includes(code) && current.length === 1) return
  const next = current.includes(code) ? current.filter(item => item !== code) : [...current, code]
  updateConfig({ selectedLocales: next })
  if (!next.includes(config.value.locale)) switchLocale(next[0]!)
}
function changeLayout(value: number) {
  rememberLayout()
  const copy = [...config.value.copy]
  const { position, ...slide } = copy[selected.value] || { label: '', headline: '' }
  copy[selected.value] = { ...slide, variant: value, elements: (VARIANT_PRESETS[value] || []).map(el => el.type === 'device' ? { ...el, imageIdx: selected.value } : { ...el }) }
  updateConfig({ copy })
}
async function openProject(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    if (await importProject(input.files[0])) reopenProject()
  }
  input.value = ''
}
function changeElement(payload: { id: string; patch: Partial<SlideElement> }) {
  patchElement(selected.value, selectedVariant.value, payload.id, payload.patch)
}
const exportNodes = ref<(HTMLElement | null)[]>([])
const bundleNode = ref<HTMLElement>()
type BundleJob = ReturnType<typeof bundleJobs>[number]
const activeJob = shallowRef<BundleJob>()
const bundleConfig = shallowRef<UserConfig>()
const jobView = computed<SlideConfig | undefined>(() => {
  const job = activeJob.value, cfg = bundleConfig.value
  if (!job || !cfg) return
  const copy = [...job.copy]
  copy[job.variant - 1] = job.copy[job.index]!
  return { images: cfg.images[job.output.imageKey], copy, artwork: cfg.appleArtwork?.[job.output.imageKey],
    colors: cfg.colors, appIcon: cfg.appIcon, appName: cfg.appName, features: cfg.features,
    fgElements: cfg.fgElements, fontFamily: resolveFontStack(cfg.fontFamily, !!cfg.customFont) }
})
const jobAsset = computed(() => activeJob.value && appleAssetSpec(activeJob.value.output.device, activeJob.value.output.orientation))
const jobFrame = computed(() => {
  const target = activeJob.value?.output
  if (target?.device === 'iphone') return 'iphone'
  if (target?.device === 'android') return 'android-phone'
  if (target?.device === 'ipad') return target.orientation === 'landscape' ? 'ipad-l' : 'ipad'
  return target?.orientation === 'landscape' ? 'android-tablet-l' : 'android-tablet-p'
})
async function downloadBundle() {
  if (busy.value) return
  exporting.value = 'Preparing package…'
  downloadDone.value = false
  try {
    const snapshot: UserConfig = JSON.parse(JSON.stringify(config.value))
    const jobs = bundleJobs(snapshot, outputIds.value)
    bundleConfig.value = snapshot
    const zip = new JSZip()
    for (const [i, job] of jobs.entries()) {
      exporting.value = `${i + 1} of ${jobs.length}`
      activeJob.value = job
      await nextTick()
      if (!bundleNode.value) throw new Error('Preview is not ready. Try again.')
      const data = await captureElement(bundleNode.value, job.size.w, job.size.h, job.format)
      zip.file(job.path, data.split(',')[1]!, { base64: true })
    }
    const name = snapshot.appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app'
    downloadBlob(await zip.generateAsync({ type: 'blob' }), `${name}-store-package.zip`)
    downloadDone.value = true
  } catch (error) {
    toast.add({ title: 'Package could not be downloaded', description: (error as Error).message, color: 'error' })
  } finally { activeJob.value = undefined; bundleConfig.value = undefined; exporting.value = null }
}
function setExportNode(i: number, node: Element | ComponentPublicInstance | null) { exportNodes.value[i] = node as HTMLElement | null }
function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
async function download(single = false) {
  if (busy.value) return
  const indices = single ? [selected.value] : exportIndices.value
  if (!indices.length || (assetSpec.value && indices.some(i => !images.value[i]))) return
  const size = { ...sizePick.value }
  const name = config.value.appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app'
  const zip = new JSZip()
  exporting.value = 'Preparing…'
  downloadDone.value = false
  try {
    await nextTick()
    for (const [n, i] of indices.entries()) {
      exporting.value = `${n + 1} of ${indices.length}`
      const node = exportNodes.value[i]
      if (!node) throw new Error('Preview is not ready. Try downloading again.')
      const format = assetSpec.value ? 'jpeg' : 'png'
      const data = await captureElement(node, size.w, size.h, format)
      const filename = `${String(i + 1).padStart(2, '0')}-${device.value}-${size.w > size.h ? 'landscape' : 'portrait'}-${size.w}x${size.h}.${format === 'jpeg' ? 'jpg' : 'png'}`
      zip.file(filename, data.split(',')[1]!, { base64: true })
      if (single) {
        // Avoid fetching data URLs: the site's connect-src policy excludes them.
        downloadBlob(await zip.file(filename)!.async('blob'), filename)
      }
    }
    if (!single) downloadBlob(await zip.generateAsync({ type: 'blob' }), `${name}-${config.value.locale}-screenshots.zip`)
    downloadDone.value = true
  } catch (error) {
    console.error('Screenshot export failed:', error)
    toast.add({ title: 'Download failed', description: (error as Error).message, color: 'error' })
  } finally { exporting.value = null }
}
</script>

<template>
  <main class="v2">
    <div v-if="!ready" class="v2-loading" role="status">Opening your workspace…</div>
    <template v-else>
      <header class="v2-header">
        <NuxtLink to="/" class="v2-brand"><img src="/logo.png" alt="" width="28" height="28">Storeshots <span>V2 Beta</span></NuxtLink>
        <nav class="v2-steps" aria-label="Screenshot design steps">
          <button v-for="(label, i) in steps" :key="label" :aria-current="step === i + 1 ? 'step' : undefined" :disabled="busy || (i === 1 && !sourceReady && !uploaded) || (i === 2 && (!config.v2Workflow?.prepared || outputsPending))" @click="setStep(i + 1)">
            <span class="v2-step-number">{{ i + 1 }}</span>{{ label }}
          </button>
        </nav>
        <NuxtLink to="/editor" class="v2-classic">Classic editor <UIcon name="i-lucide-arrow-up-right" /></NuxtLink>
      </header>
      <p class="v2-transition">V1 and V2 are available side by side during the transition. Drafts are separate. Save a project in one editor and open a copy in the other.</p>

      <div class="v2-projectbar">
        <div class="min-w-0"><strong class="block truncate">{{ config.appName || 'Untitled app' }}</strong><span role="status">{{ saved }}</span></div>
        <div class="flex gap-2 shrink-0">
          <UButton color="neutral" variant="ghost" icon="i-lucide-settings-2" :disabled="busy" aria-label="AI settings" @click="aiSettingsOpen = true"><span class="hidden sm:inline">AI settings</span></UButton>
          <UButton color="neutral" variant="ghost" icon="i-lucide-folder-open" aria-label="Open project" :disabled="busy" @click="projectInput?.click()"><span class="hidden sm:inline">Open project</span></UButton>
          <UButton color="neutral" variant="outline" icon="i-lucide-save" :disabled="busy" @click="exportProject">Save project</UButton>
        </div>
      </div>

      <input ref="uploadInput" type="file" accept="image/png,image/jpeg,image/webp" :multiple="replaceIndex === null" class="hidden" aria-label="Upload screenshots" @change="onUpload">
      <input ref="artworkInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" aria-label="Upload output artwork" @change="onArtworkUpload">
      <input ref="iconInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" aria-label="Upload app icon" @change="onIconUpload">
      <input ref="projectInput" type="file" accept=".json,.storeshots.json" class="hidden" aria-label="Open project file" @change="openProject">

      <section v-if="step === 1" class="v2-upload-page">
        <div class="v2-intro">
          <h1 id="v2-step-title" tabindex="-1">Start with your screenshots.</h1>
          <p>Upload once. Get your complete store package.<br>You can refine any image after your set is ready.</p>
        </div>
        <div class="v2-upload-layout">
          <div class="v2-setup">
            <label for="v2-app-name">App name</label>
            <input id="v2-app-name" :value="config.appName" placeholder="Your app name" :disabled="busy" @input="updateConfig({ appName: ($event.target as HTMLInputElement).value })">
            <label>App icon <span class="v2-optional">Optional</span></label>
            <button class="v2-icon-upload" :disabled="busy" @click="iconInput?.click()"><img v-if="config.appIcon" :src="config.appIcon" alt="Current app icon"><UIcon v-else name="i-lucide-image-plus" /><span>{{ config.appIcon ? 'Replace app icon' : 'Add app icon' }}</span></button>
            <label for="v2-description">What does your app do? <span class="v2-optional">Optional</span></label>
            <textarea id="v2-description" :value="config.appDescription" rows="3" placeholder="A short description for AI copy." @input="updateConfig({ appDescription: ($event.target as HTMLTextAreaElement).value })" />
            <label for="v2-device">Screenshot source</label>
            <select id="v2-device" v-model="device" :disabled="busy"><option v-for="target in targets" :key="target.value" :value="target.value">{{ target.label }}</option></select>
            <label v-if="hasOrientation" for="v2-orientation">Orientation</label>
            <select v-if="hasOrientation" id="v2-orientation" v-model="orientation" :disabled="busy"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select>
            <p v-if="assetSpec" class="v2-help">{{ assetSpec.label }} · {{ assetSpec.w }} × {{ assetSpec.h }} px. {{ singleAsset ? 'One artwork per placement.' : 'Inner and outer displays keep separate screenshots in each orientation.' }}</p>
            <p class="v2-help">You can add other devices later. Automatically adapted screenshots follow your source. Replacing an image for another output makes that image independent.</p>
          </div>
          <div>
            <button class="v2-dropzone" :disabled="busy" @click="upload()" @dragover.prevent @drop.prevent="addFiles(Array.from($event.dataTransfer?.files || []))">
              <span class="v2-upload-icon"><UIcon name="i-lucide-images" /></span>
              <strong>{{ uploading ? 'Adding your screenshots…' : 'Drop screenshots here' }}</strong>
              <span>or click to choose files</span>
              <small>PNG, JPG or WebP · Up to {{ images.length }} {{ images.length === 1 ? 'image' : 'images' }} · 15 MB each</small>
            </button>
            <div v-if="uploaded" class="v2-uploads" aria-label="Uploaded screenshots">
              <div v-for="(image, i) in images" :key="i">
                <template v-if="image"><button class="v2-upload-thumb" :aria-label="`Replace screenshot ${i + 1}`" :disabled="busy" @click="upload(i)"><img :src="image" :alt="`Screenshot ${i + 1}`"><span>{{ i + 1 }}</span></button><button class="v2-remove" :disabled="busy" :aria-label="`Remove screenshot ${i + 1}`" @click="removeImage(i)"><UIcon name="i-lucide-x" /></button></template>
              </div>
            </div>
            <div class="v2-upload-footer"><span>{{ uploaded ? `${uploaded} of ${images.length} images added` : 'No API key needed. Start with your own words.' }}</span><UButton size="lg" trailing-icon="i-lucide-arrow-right" :disabled="busy || (!uploaded && !sourceReady)" @click="setStep(2)">Choose outputs</UButton></div>
          </div>
        </div>
        <p class="v2-import-hint">Coming from the classic editor? Save your project there, then <button :disabled="busy" @click="projectInput?.click()">open a copy here</button>.</p>
      </section>

      <section v-else-if="step === 2" class="v2-upload-page">
        <div class="v2-intro"><h1 id="v2-step-title" tabindex="-1">Where will your app appear?</h1><p>Select your outputs. All sizes are selected by default. You can refine downloads from your set.<br>We adapt your screenshots and arrange the set for you.</p></div>
        <div class="v2-output-options">
          <label v-for="target in V2_OUTPUT_TARGETS.slice(0, 2)" :key="target.id" class="v2-output-choice"><input type="checkbox" :checked="outputIds.includes(target.id)" :disabled="busy" @change="toggleOutput(target.id)"><span>{{ target.label }}<small>{{ target.sizes.map(size => `${size.w} × ${size.h}`).join(' · ') }}</small></span></label>
          <details class="v2-details"><summary>More outputs <span>Tablets, Duo &amp; store artwork</span></summary>
            <label v-for="target in V2_OUTPUT_TARGETS.slice(2)" :key="target.id" class="v2-output-choice"><input type="checkbox" :checked="outputIds.includes(target.id)" :disabled="busy" @change="toggleOutput(target.id)"><span>{{ target.label }}<small>{{ target.sizes.map(size => `${size.w} × ${size.h}`).join(' · ') }}</small></span><button v-if="target.device === 'apple-header' || target.device === 'apple-search'" class="v2-text-button" :disabled="busy" @click.prevent="addArtwork(target.imageKey)">{{ config.images[target.imageKey].some(Boolean) ? 'Replace artwork' : 'Add artwork' }}</button></label>
          </details>
          <p v-if="outputsPending && config.v2Workflow?.prepared" class="v2-help mt-4" role="status">Your output selection has changed. Apply outputs to update and save your set.</p>
          <p class="v2-help mt-4">Existing device-specific screenshots stay in place. Automatically adapted images follow source changes; custom uploads stay independent. Header and Search require their own artwork.</p>
          <label v-if="aiReady && !config.v2Workflow?.prepared" class="v2-output-choice"><input v-model="useAi" type="checkbox" :disabled="busy"><span>Use AI for headlines and colors<small>Uses your saved provider and model. Provider charges may apply.</small></span></label>
          <p v-else class="v2-help mt-4">Your set uses your description and existing words. AI is optional and can be connected in settings.</p>
          <div class="v2-upload-footer"><button class="v2-text-button" :disabled="busy" @click="setStep(1)">Back to screenshots</button><UButton size="lg" icon="i-lucide-sparkles" :loading="preparing" :disabled="busy || !sourceReady || !outputIds.length" @click="createSet">{{ config.v2Workflow?.prepared ? 'Apply outputs' : 'Create my complete set' }}</UButton></div>
        </div>
      </section>

      <section v-else-if="step === 3" class="v2-design" :class="{ 'v2-result': !editing && !focused, 'v2-focused': focused, 'v2-placement': placementMode }">
        <aside v-if="editing || focused" class="v2-inspector">
          <div class="v2-inspector-title">
            <button class="v2-back-set" @click="showAllSlides(); editing = false"><UIcon name="i-lucide-arrow-left" />Back to your set</button>
            <h1 id="v2-step-title" tabindex="-1">{{ focused ? `Slide ${selected + 1}` : 'Design your set.' }}</h1>
            <p>{{ focused ? 'Edit this slide without losing the full template.' : 'Start broad. Open a slide only when it needs attention.' }}</p>
          </div>
          <div class="v2-panel-tabs" role="group" aria-label="Design controls"><button v-for="name in designPanels" :key="name" :aria-pressed="panel === name" :disabled="busy" @click="panel = name">{{ name === 'Background' ? 'Colors' : name }}</button></div>
          <details v-if="!focused && !assetKind" class="v2-more-tools" :open="advancedPanels.includes(panel)" @toggle="toggleAdvanced">
            <summary>More tools <span>Brand, AI &amp; languages</span></summary>
            <div class="v2-panel-tabs" role="group" aria-label="Additional design tools"><button v-for="name in advancedPanels" :key="name" :aria-pressed="panel === name" :disabled="busy" @click="panel = name">{{ name }}</button></div>
          </details>
          <div class="v2-panel-body">
            <UButton v-if="layoutUndo" block class="mb-4" color="neutral" variant="outline" icon="i-lucide-undo-2" :disabled="busy" @click="undoLayout">Undo layout change</UButton>
            <UButton v-if="focused" class="mb-4" block color="neutral" variant="outline" :disabled="busy || !exportIndices.includes(selected)" @click="download(true)">Download this image</UButton>
            <template v-if="panel === 'Artwork'">
              <p class="v2-help">{{ assetKind === 'feature-graphic' ? 'Your app name, first headline, icon and features form this Google Play banner. Edit them in the classic editor for full placement controls.' : 'Fit keeps the complete image. Fill covers the canvas and may crop the edges. Changes apply only to this target and orientation.' }}</p>
              <p class="v2-help mt-4">{{ canvasDims.cW }} × {{ canvasDims.cH }} px</p>
              <UButton v-if="assetKind !== 'feature-graphic'" class="mt-4" block color="neutral" variant="outline" icon="i-lucide-image-plus" :disabled="busy" @click="upload(singleAsset ? 0 : selected)">{{ images[selected] ? 'Replace image' : 'Add image' }}</UButton>
              <button v-if="assetSpec && images[selected]" class="v2-text-button mt-4" :disabled="busy" @click="removeImage(selected)">Remove image</button>
              <template v-if="assetSpec">
                <label for="v2-artwork-fit">Image placement</label>
                <select id="v2-artwork-fit" :value="artwork.fit" :disabled="busy" @change="changeArtwork({ fit: ($event.target as HTMLSelectElement).value as AppleArtwork['fit'] })"><option value="contain">Fit · Keep the whole image</option><option value="cover">Fill · Crop to the canvas</option></select>
                <label for="v2-artwork-x">Horizontal focus <span class="v2-optional">{{ artwork.x }}%</span></label>
                <input id="v2-artwork-x" type="range" min="0" max="100" :value="artwork.x" :disabled="busy || !images[selected]" @input="changeArtwork({ x: Number(($event.target as HTMLInputElement).value) })">
                <label for="v2-artwork-y">Vertical focus <span class="v2-optional">{{ artwork.y }}%</span></label>
                <input id="v2-artwork-y" type="range" min="0" max="100" :value="artwork.y" :disabled="busy || !images[selected]" @input="changeArtwork({ y: Number(($event.target as HTMLInputElement).value) })">
                <p class="v2-help">Focus moves the image only where it extends beyond or leaves space inside the canvas.</p>
                <label for="v2-artwork-background">Canvas background</label>
                <input id="v2-artwork-background" type="color" :value="artwork.background" :disabled="busy" @input="changeArtwork({ background: ($event.target as HTMLInputElement).value })">
                <button class="v2-text-button mt-4" :disabled="busy || !config.appleArtwork?.[imageKey]" @click="resetArtwork">Reset placement and background</button>
              </template>
              <p v-if="assetKind === 'creative'" class="v2-help mt-4">Keep key artwork near the center. Use Apple's App Store Connect preview to check placement across devices.</p>
              <a v-if="assetSpec" href="https://developer.apple.com/app-store/asset-best-practices/" target="_blank" rel="noopener noreferrer" class="v2-text-button mt-4">Apple artwork guidance ↗</a>
            </template>
            <template v-else-if="panel === 'Text'">
              <label for="v2-headline">Headline</label><textarea id="v2-headline" ref="headlineInput" :value="config.copy[selected]?.headline" rows="4" :disabled="busy" @input="changeCopy('headline', ($event.target as HTMLTextAreaElement).value)" />
              <p class="v2-help">Keep it short. Press Enter to choose where the next line starts.</p>
              <p v-if="(config.copy[selected]?.headline || '').split('\n').length > 2 || (config.copy[selected]?.headline || '').split('\n').some(line => line.trim().split(/\s+/).filter(Boolean).length > 5)" class="v2-copy-warning" role="status">Aim for up to 2 lines and 5 words per line so your headline stays easy to scan.</p>
              <details class="v2-more-control"><summary>More text</summary><label for="v2-label">Short label</label><input id="v2-label" :value="config.copy[selected]?.label" :disabled="busy" @input="changeCopy('label', ($event.target as HTMLInputElement).value)"></details>
              <div class="v2-divider" />
              <label>Screenshot</label>
              <button class="v2-replace-image" :disabled="busy" @click="upload(selected)"><img v-if="images[selected]" :src="images[selected]!" alt="Current screenshot"><UIcon v-else name="i-lucide-image-plus" /><span>{{ images[selected] ? 'Replace screenshot' : 'Add a screenshot' }}</span><UIcon name="i-lucide-upload" /></button>
              <button v-if="images[selected]" class="v2-text-button" :disabled="busy" @click="removeImage(selected)">Remove screenshot</button>
            </template>
            <template v-else-if="panel === 'Layout'">
              <p class="v2-help mb-4">Choose a composition for this slide.</p>
              <div class="v2-slide-layouts">
                <button v-for="(name, i) in layouts.slice(0, 4)" :key="name" :aria-pressed="selectedVariant === i + 1" :disabled="busy" @click="changeLayout(i + 1)"><span :class="`v2-layout-glyph variant-${i + 1}`"><i /></span><strong>{{ name }}</strong></button>
              </div>
              <details class="v2-more-control"><summary>More layouts</summary><select id="v2-layout" :value="selectedVariant" :disabled="busy" aria-label="More slide layouts" @change="changeLayout(Number(($event.target as HTMLSelectElement).value))"><option v-for="(name, i) in layouts" :key="name" :value="i + 1">{{ name }}</option></select></details>
              <div v-if="selectedDevices.length > 1" class="v2-frame-pickers">
                <p class="v2-help">Choose a screenshot for each device. This layout and its image choices apply across screenshot outputs.</p>
                <div v-for="(element, frameIndex) in selectedDevices" :key="element.id">
                  <label :for="`v2-frame-${element.id}`">{{ element.id.includes('bg') ? 'Back device' : element.id.includes('fg') ? 'Front device' : `Device ${frameIndex + 1}` }}</label>
                  <select :id="`v2-frame-${element.id}`" :value="element.imageIdx" :disabled="busy" @change="setFrameImage(element.id, Number(($event.target as HTMLSelectElement).value))"><option v-for="(_, imageIndex) in images" :key="imageIndex" :value="imageIndex" :disabled="!images[imageIndex]">Screenshot {{ imageIndex + 1 }}{{ images[imageIndex] ? '' : ' · Empty' }}</option></select>
                  <img v-if="images[element.imageIdx]" :src="images[element.imageIdx]!" :alt="`Selected screenshot for device ${frameIndex + 1}`">
                </div>
              </div>
              <div class="v2-divider" />
              <UButton block color="neutral" :variant="placementMode ? 'solid' : 'outline'" icon="i-lucide-move" :disabled="busy" @click="placementMode = !placementMode">{{ placementMode ? 'Finish adjusting' : 'Adjust placement' }}</UButton>
              <button v-if="isOverridden(selected)" class="v2-text-button mt-4" :disabled="busy" @click="resetSelectedLayout">Reset slide layout</button>
            </template>
            <template v-else-if="panel === 'Templates'">
              <p class="v2-help mb-4">Choose the visual rhythm for the whole set. Your words, screenshots and colors stay in place.</p>
              <div class="v2-layout-templates">
                <button v-for="template in layoutTemplates" :key="template.key" :aria-pressed="chosenLayout === template.key" :disabled="busy" @click="applyDeckLayout(template)">
                  <span class="v2-layout-preview" aria-hidden="true"><i v-for="n in 5" :key="n" :class="`variant-${template.sequence[n - 1]}`"><b /></i></span>
                  <span class="v2-layout-copy"><strong>{{ template.label }}</strong><small>{{ template.description }}</small></span>
                  <UIcon v-if="chosenLayout === template.key" name="i-lucide-check" />
                </button>
              </div>
              <p class="v2-template-note">Need a special slide? Open it from the canvas and adjust only that slide.</p>
            </template>
            <template v-else-if="panel === 'Background'">
              <p class="v2-help mb-4">Choose a background family, then tune its colors if needed.</p>
              <div class="v2-theme-list"><button v-for="template in START_TEMPLATES" :key="template.key" :aria-pressed="chosenTheme === template.key" :disabled="busy" @click="applyTheme(template)"><span class="v2-palette"><i v-for="key in ['primary', 'accent', 'bgFrom', 'bgTo'] as const" :key="key" :style="{ background: template.colors[key] }" /></span><span>{{ template.label }}</span><UIcon v-if="chosenTheme === template.key" name="i-lucide-check" /></button></div>
              <p class="v2-help my-4">Background colors apply to the whole set.</p>
              <div class="v2-colors"><label v-for="field in colorFields" :key="field.key"><span>{{ field.label }}</span><input type="color" :aria-label="field.label" :value="config.colors[field.key]" :disabled="busy" @input="updateConfig({ colors: { ...config.colors, [field.key]: ($event.target as HTMLInputElement).value } })"></label></div>
              <UButton class="mt-4" color="neutral" variant="outline" icon="i-lucide-pipette" :disabled="!uploaded || busy" @click="extractColorsFromScreenshots">Use screenshot colors</UButton>
            </template>
            <template v-else-if="panel === 'Brand'">
              <label for="v2-font">Typeface</label><select id="v2-font" :value="config.fontFamily" :disabled="busy" @change="updateConfig({ fontFamily: ($event.target as HTMLSelectElement).value })"><option v-for="font in BUILTIN_FONTS" :key="font.family" :value="font.family">{{ font.label }}</option><option v-if="config.customFont" value="custom">{{ config.customFont.name }}</option></select>
              <div class="v2-brand-summary"><img v-if="config.appIcon" :src="config.appIcon" alt=""><UIcon v-else name="i-lucide-app-window" /><div><strong>{{ config.appName || 'Untitled app' }}</strong><p>{{ config.appDescription || 'No app description yet.' }}</p></div></div>
              <UButton color="neutral" variant="outline" icon="i-lucide-pencil" @click="setStep(1)">Edit app basics</UButton>
            </template>
            <template v-else-if="panel === 'AI'">
              <p class="v2-help mb-4">{{ aiReady ? 'AI is configured. Choose what you want to create.' : 'Connect your AI provider once to use these optional tools.' }}</p>
              <UButton v-if="!aiReady" class="mb-4" color="neutral" variant="outline" :disabled="busy" @click="aiSettingsOpen = true">Connect AI</UButton>
              <label for="v2-ai-brief">Creative direction</label><textarea id="v2-ai-brief" :value="config.aiBrief" rows="4" placeholder="Audience, tone and key benefits" @input="updateConfig({ aiBrief: ($event.target as HTMLTextAreaElement).value })" />
              <div class="v2-ai-actions"><UButton block :loading="generating" :disabled="busy" icon="i-lucide-wand-sparkles" @click="connectOrGenerate(() => generateFullDesign(config.images[imageKey]))">Generate design</UButton><UButton block color="neutral" variant="outline" :loading="generating" :disabled="busy" @click="connectOrGenerate(() => generateCopy(config.images[imageKey]))">Write headlines only</UButton></div>
            </template>
            <template v-else-if="panel === 'Languages'">
              <p class="v2-help mb-4">Select languages for your package. Use the language selector above the preview to review or edit each one. You can write translations yourself without AI.</p>
              <div class="v2-language-list"><label v-for="locale in LOCALE_OPTIONS" :key="locale.value"><input type="checkbox" :checked="config.selectedLocales.includes(locale.value)" :disabled="busy || (config.selectedLocales.length === 1 && config.selectedLocales[0] === locale.value)" @change="toggleLocale(locale.value)"><span>{{ locale.label }}</span></label></div>
              <UButton block class="mt-4" icon="i-lucide-languages" :loading="generating" :disabled="config.selectedLocales.length < 2 || busy" @click="connectOrGenerate(() => generateLocales({ onlyMissing: true, source: config.images[imageKey] }))">Generate missing languages</UButton>
            </template>
          </div>
        </aside>
        <div class="v2-stage">
          <div class="v2-result-heading"><div><h1 v-if="!editing && !focused" id="v2-step-title" tabindex="-1">Your complete set.</h1><p>{{ bundleSummary.count }} files · {{ outputTargets.length }} {{ outputTargets.length === 1 ? 'output' : 'outputs' }} · {{ config.selectedLocales.length }} {{ config.selectedLocales.length === 1 ? 'language' : 'languages' }}</p><p v-if="bundleSummary.error" role="status">{{ bundleSummary.error }}</p></div><UButton size="lg" icon="i-lucide-download" :loading="!!exporting" :disabled="busy || !!bundleSummary.error" @click="downloadBundle">{{ exporting ? `Exporting ${exporting}` : 'Download all (.ZIP)' }}</UButton><p v-if="downloadDone" role="status">Your package is ready.</p></div>
          <div class="v2-canvas-toolbar"><div class="flex items-center gap-2"><select :value="config.locale" aria-label="Preview and edit language" :disabled="busy" @change="switchLocale(($event.target as HTMLSelectElement).value)"><option v-for="code in config.selectedLocales" :key="code" :value="code">{{ code.toUpperCase() }}{{ code === config.locale || config.copyByLocale[code]?.length ? '' : ' · Needs text' }}</option></select><select :value="outputTargets.find(target => target.device === device && target.orientation === orientation)?.id" aria-label="Preview output" :disabled="busy" @change="previewOutput(($event.target as HTMLSelectElement).value)"><option v-for="target in outputTargets" :key="target.id" :value="target.id">{{ target.label }}</option></select></div><div class="flex gap-4"><button v-if="!singleAsset" class="v2-text-button" :disabled="busy || !exportIndices.length" @click="storePreviewOpen = true">Store preview</button><button class="v2-text-button" :disabled="busy" @click="setStep(2)">Change outputs</button><button class="v2-text-button" :disabled="busy" @click="editing = !editing; focused = false">{{ editing ? 'Finish customizing' : 'Customize set' }}</button></div></div>
          <details v-if="!focused" class="v2-download-options">
            <summary>Download options <span>Sizes &amp; closing card</span></summary>
            <p class="v2-help">Choose the sizes for your ZIP. At least one size stays selected per output. Changing downloads keeps your artwork and layout.</p>
            <label v-if="hasClosingCard" class="v2-download-check"><input type="checkbox" :checked="config.v2Workflow?.includeClosing !== false" :disabled="busy" @change="setIncludeClosing(($event.target as HTMLInputElement).checked)"><span>Include closing card<small>Optional app spotlight without a screenshot. Applies to screenshot outputs.</small></span></label>
            <fieldset v-for="target in outputTargets" :key="target.id">
              <legend>{{ target.label }}</legend>
              <label v-for="size in target.sizes" :key="sizeKey(size)" class="v2-download-check"><input type="checkbox" :checked="chosenSizes(target).includes(sizeKey(size))" :disabled="busy || (chosenSizes(target).length === 1 && chosenSizes(target).includes(sizeKey(size)))" @change="toggleSize(target, sizeKey(size))"><span>{{ size.w }} × {{ size.h }}</span></label>
            </fieldset>
            <button class="v2-text-button" :disabled="busy" @click="resetDownloadSizes">Select all sizes</button>
          </details>
          <div v-if="!focused" class="v2-set-canvas">
            <div class="v2-set-heading"><div><strong>{{ assetSpec?.label || (singleAsset ? 'Feature Graphic' : 'Your screenshot set') }}</strong><span>Open an image to refine it. Order changes apply across screenshot outputs and languages.</span></div><span>{{ exportIndices.length }} images</span></div>
            <div class="v2-slide-grid" :class="{ 'v2-single-asset': singleAsset }">
              <div v-for="(i, position) in exportIndices" :key="`${device}-${orientation}-${i}`" class="v2-slide-tile">
              <button type="button" class="v2-grid-slide" :aria-label="`Open ${singleAsset ? 'artwork' : `slide ${i + 1}`}`" :disabled="busy" @click="focusSlide(i)">
                <SlideCard :index="i" :variant="variants[i]!" :cfg="viewFor(i)" :c-w="canvasDims.cW" :c-h="canvasDims.cH" :label="assetSpec?.label || config.copy[i]?.label || `Slide ${i + 1}`" :device-frame="deviceFrame" :asset-kind="assetKind" hide-actions />
              </button>
              <div v-if="!assetKind" class="v2-order-controls" :aria-label="`Order slide ${i + 1}`"><button :disabled="busy || position === 0" :aria-label="`Move slide ${i + 1} earlier`" @click="moveSlide(i, -1)"><UIcon name="i-lucide-arrow-left" />Earlier</button><button :disabled="busy || position === exportIndices.length - 1" :aria-label="`Move slide ${i + 1} later`" @click="moveSlide(i, 1)">Later<UIcon name="i-lucide-arrow-right" /></button></div>
              </div>
            </div>
          </div>
          <template v-else>
          <div class="v2-canvas">
            <div class="v2-slide-preview" :style="{ width: `min(100%, ${450 * canvasDims.cW / canvasDims.cH}px)`, '--v2-ratio': canvasDims.cW / canvasDims.cH }">
              <SlideCard :key="`${device}-${orientation}-${selected}`" :index="selected" :variant="selectedVariant" :cfg="selectedView" :c-w="canvasDims.cW" :c-h="canvasDims.cH" :label="assetSpec?.label || config.copy[selected]?.label || 'Slide'" :device-frame="deviceFrame" :asset-kind="assetKind" :transform-mode="placementMode" hide-actions @element-change="changeElement" @element-delete="removeElement(selected, selectedVariant, $event)" />
            </div>
            <button v-if="placementMode" class="v2-placement-done" @click="placementMode = false">Finish adjusting</button>
            <p v-if="placementMode" class="v2-canvas-hint"><UIcon name="i-lucide-move" />Drag the device or text to adjust its position</p>
          </div>
          <div class="v2-filmstrip" aria-label="Choose a slide"><button v-for="i in exportIndices" :key="i" :aria-label="`Edit slide ${i + 1}`" :aria-pressed="selected === i" :disabled="busy" @click="selectSlide(i)"><span class="v2-film-image"><img v-if="images[i]" :src="images[i]!" alt=""><UIcon v-else :name="variants[i] === 10 ? 'i-lucide-badge-check' : 'i-lucide-image'" /></span><span>{{ String(i + 1).padStart(2, '0') }}</span></button><button class="v2-add-slide" aria-label="Add screenshots" :disabled="busy" @click="setStep(1)"><UIcon name="i-lucide-plus" /><span>Add</span></button></div>
          </template>
        </div>
      </section>


      <div class="v2-export-nodes" aria-hidden="true" inert>
        <div v-if="activeJob && jobView" :key="activeJob.path" ref="bundleNode" :style="{ width: `${activeJob.size.w}px`, height: `${activeJob.size.h}px` }"><AppleAsset v-if="jobAsset" :cfg="jobView" :index="activeJob.index" :c-w="activeJob.size.w" :c-h="activeJob.size.h" :kind="jobAsset.kind" /><FeatureGraphic v-else-if="activeJob.output.device === 'feature-graphic'" :cfg="jobView" :elements="bundleConfig?.fgElements" /><SlideTemplate v-else :variant="activeJob.variant" :cfg="jobView" :c-w="activeJob.size.w" :c-h="activeJob.size.h" :device-frame="jobFrame" /></div>
        <div v-for="(variant, i) in variants" :key="i" :ref="(node: Element | ComponentPublicInstance | null) => setExportNode(i, node)" :style="{ width: `${sizePick.w}px`, height: `${sizePick.h}px` }"><AppleAsset v-if="assetSpec" :cfg="viewFor(i)" :index="i" :c-w="sizePick.w" :c-h="sizePick.h" :kind="assetSpec.kind" /><FeatureGraphic v-else-if="device === 'feature-graphic'" :cfg="slideConfig" :elements="config.fgElements" /><SlideTemplate v-else :variant="variant" :cfg="viewFor(i)" :c-w="sizePick.w" :c-h="sizePick.h" :device-frame="deviceFrame" /></div>
      </div>
      <UModal v-model:open="storePreviewOpen" :title="`${storeName} preview`" description="A rough listing preview for the active output and language. Final placement varies by store and device." :ui="{ content: 'sm:max-w-2xl' }">
        <template #body>
          <div class="v2-store-preview">
            <div class="v2-store-identity"><img v-if="config.appIcon" :src="config.appIcon" alt=""><div><strong>{{ config.appName || 'Your app' }}</strong><p>{{ storeName }} · {{ config.locale.toUpperCase() }}</p></div></div>
            <p class="v2-help">Review your leading images in order. Open a card to edit it.</p>
            <div class="v2-store-row" aria-label="Leading store screenshots">
              <button v-for="(i, position) in storePreviewIndices" :key="i" :aria-label="`Edit preview slide ${i + 1}`" @click="editFromStorePreview(i)"><SlideCard :index="i" :variant="variants[i]!" :cfg="viewFor(i)" :c-w="canvasDims.cW" :c-h="canvasDims.cH" :device-frame="deviceFrame" :asset-kind="assetKind" :label="`Position ${position + 1}`" hide-actions /></button>
            </div>
            <p class="v2-help">Lead with your strongest benefit, then show a key feature and a reason to choose your app.</p>
          </div>
        </template>
      </UModal>
      <AiSettings v-model:open="aiSettingsOpen" :ai="config.ai" @save="saveAiSettings" />
    </template>
  </main>
</template>

<style scoped>
.v2-download-options { margin: 0 24px 20px; padding: 16px; background: white; border: 1px solid #e5e7eb; border-radius: 10px; }
.v2-download-options summary { min-height: 44px; font-weight: 600; cursor: pointer; }
.v2-download-options summary span { display: block; margin-top: 4px; color: #6b7280; font-size: 12px; font-weight: 400; }
.v2-download-options fieldset { margin: 16px 0; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
.v2-download-options legend { padding: 0 6px; font-size: 13px; font-weight: 600; }
.v2 .v2-download-check { display: flex; align-items: center; gap: 10px; min-height: 44px; margin: 6px 0; font-weight: 400; }
.v2 .v2-download-check input[type=checkbox] { width: 20px; min-width: 20px; height: 20px; accent-color: #2563eb; }
.v2-download-check small { display: block; color: #6b7280; font-size: 12px; margin-top: 4px; }
.v2-store-identity { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.v2-store-identity img { width: 48px; height: 48px; border-radius: 12px; }
.v2-store-identity strong { font-size: 18px; }
.v2-store-identity p { font-size: 12px; color: #6b7280; }
.v2-store-row { display: flex; gap: 12px; overflow-x: auto; padding: 16px 0; }
.v2-store-row button { width: 140px; min-width: 140px; text-align: left; border-radius: 8px; cursor: pointer; }
.v2-store-preview :is(button, a):focus-visible { outline: 3px solid #2563eb; outline-offset: 3px; }
.v2-store-preview .v2-help { color: #6b7280; font-size: 12px; line-height: 1.7; }

.v2-slide-tile { min-width: 0; }
.v2-placement-done { display: none; }
.v2-order-controls { display: flex; justify-content: space-between; gap: 8px; margin-top: 8px; }
.v2-order-controls button { display: flex; align-items: center; justify-content: center; gap: 4px; min-height: 44px; padding: 8px; font-size: 12px; color: #2563eb; border-radius: 6px; }
.v2-frame-pickers { margin-top: 20px; }
.v2-frame-pickers > div { margin-top: 16px; }
.v2-frame-pickers img { max-height: 90px; max-width: 100%; margin-top: 8px; border: 1px solid #e5e7eb; border-radius: 6px; }
.v2-copy-warning { margin-top: 8px; color: #92400e; font-size: 12px; line-height: 1.6; }

.v2-design.v2-result { grid-template-columns: minmax(0, 1fr); }
.v2-output-options { max-width: 760px; margin: 32px auto; padding: 24px; background: white; border: 1px solid #e5e7eb; border-radius: 16px; }
.v2 .v2-output-choice { display: flex; align-items: center; gap: 14px; min-height: 68px; margin: 8px 0; padding: 14px; border: 1px solid #d1d5db; border-radius: 10px; }
.v2 .v2-output-choice:has(input:checked) { background: #eff6ff; border-color: #93c5fd; }
.v2 .v2-output-choice input[type=checkbox] { width: 20px; height: 20px; min-width: 20px; accent-color: #2563eb; }
.v2-output-choice span { flex: 1; }
.v2-output-choice small { display: block; font-weight: 400; color: #6b7280; margin-top: 5px; line-height: 1.6; }
.v2-result-heading { padding: 28px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; background: white; border-bottom: 1px solid #e5e7eb; }
.v2-result-heading h1 { font-size: 28px; font-weight: 600; letter-spacing: -.8px; }
.v2-result-heading p { color: #4b5563; margin-top: 6px; font-size: 13px; }
.v2-transition { margin: 0; padding: 12px 24px; background: #eff6ff; color: #1e40af; font-size: 13px; line-height: 1.6; }
.v2-more-tools { padding: 12px 20px; border-bottom: 1px solid #e5e7eb; }
.v2-more-tools summary { min-height: 44px; display: flex; flex-direction: column; justify-content: center; gap: 4px; font-size: 13px; font-weight: 600; }
.v2-more-tools summary span { color: #6b7280; font-size: 12px; font-weight: 400; }
.v2-more-tools .v2-panel-tabs { padding: 8px 0 0; }
.v2-grid-slide { width: 100%; text-align: inherit; border-radius: 12px; }
.v2-panel-body input[type=range] { width: 100%; min-height: 44px; padding: 0; border: 0; accent-color: #2563eb; }
.v2-slide-grid.v2-single-asset { grid-template-columns: minmax(0, 1fr); max-width: 760px; margin: 0 auto; }
.v2 { min-height: 100dvh; background: #f9fafb; color: #111827; font-family: Inter, sans-serif; font-size: 14px; }
.v2 button, .v2 a, .v2 summary { -webkit-tap-highlight-color: transparent; }
.v2 button:not(:disabled), .v2 summary { cursor: pointer; }
.v2 :is(button, a, input, textarea, select, summary):focus-visible { outline: 3px solid #2563eb; outline-offset: 3px; }
.v2 button:disabled { cursor: not-allowed; opacity: .55; }
.v2-header { min-height: 76px; padding: 16px 32px; display: flex; gap: 24px; align-items: center; justify-content: space-between; background: white; border-bottom: 1px solid #e5e7eb; }
.v2-brand { display: flex; align-items: center; gap: 9px; font-size: 18px; font-weight: 700; letter-spacing: -.6px; }
.v2-brand img { border-radius: 6px; }
.v2-brand span { margin-left: 3px; font-size: 11px; letter-spacing: 0; padding: 3px 6px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 5px; }
.v2-steps { display: flex; gap: 8px; }
.v2-steps button { display: flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 8px; color: #4b5563; font-weight: 600; }
.v2-steps button[aria-current] { color: #1d4ed8; background: #eff6ff; }
.v2-step-number { width: 24px; height: 24px; display: grid; place-items: center; border: 1px solid #d1d5db; border-radius: 50%; font-size: 12px; }
[aria-current] .v2-step-number { background: #2563eb; border-color: #2563eb; color: white; }
.v2-classic { display: flex; align-items: center; gap: 5px; font-size: 13px; color: #4b5563; }
.v2-projectbar { display: flex; justify-content: space-between; gap: 12px; padding: 16px 32px; border-bottom: 1px solid #e5e7eb; background: white; }
.v2-projectbar strong { font-size: 14px; font-weight: 600; }
.v2-projectbar span[role] { display: block; margin-top: 3px; color: #6b7280; font-size: 11px; }
.v2-loading { min-height: 100dvh; display: grid; place-items: center; }
.v2-intro h1 { font-size: clamp(27px, 3.2vw, 38px); letter-spacing: -1.2px; line-height: 1.2; font-weight: 600; outline: none; }
.v2-intro p { margin-top: 14px; color: #4b5563; font-size: 15px; line-height: 1.7; }
.v2-upload-page, .v2-download-page { max-width: 1100px; margin: auto; padding: 48px 32px 32px; }
.v2-upload-layout { margin-top: 36px; display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 52px; align-items: start; }
.v2 label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.v2-optional { color: #6b7280; font-size: 11px; font-weight: 400; margin-left: 5px; }
.v2 :is(input:not([type=color]):not([type=file]), textarea, select) { width: 100%; min-width: 0; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 7px; background: white; color: #111827; font: inherit; }
.v2 textarea { resize: vertical; line-height: 1.6; }
.v2 :is(input, textarea, select) + label { margin-top: 22px; }
.v2-help { font-size: 12px; line-height: 1.7; color: #6b7280; }
.v2-setup > .v2-help { margin-top: 12px; }
.v2-icon-upload { width: 100%; display: flex; align-items: center; gap: 10px; padding: 9px; border: 1px solid #d1d5db; border-radius: 7px; color: #4b5563; font-size: 12px; }
.v2-icon-upload img, .v2-icon-upload > span:first-child { width: 34px; height: 34px; border-radius: 8px; object-fit: cover; }
.v2-details { border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 18px; }
.v2-details summary { font-size: 13px; font-weight: 600; }
.v2-details summary span { font-size: 11px; color: #6b7280; font-weight: 400; margin-left: 8px; }
.v2-details label { margin-top: 16px; }
.v2-dropzone { width: 100%; min-height: 264px; border: 1.5px dashed #93a8c4; border-radius: 12px; background: #fff; display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 24px; transition: border-color .15s, background .15s; }
.v2-dropzone:hover { border-color: #2563eb; background: #eff6ff; }
.v2-upload-icon { display: grid; place-items: center; background: #eff6ff; color: #2563eb; border-radius: 12px; width: 52px; height: 52px; font-size: 26px; margin-bottom: 20px; }
.v2-dropzone strong { font-size: 17px; font-weight: 600; }
.v2-dropzone > span:not(.v2-upload-icon) { color: #4b5563; margin-top: 6px; }
.v2-dropzone small { color: #6b7280; font-size: 11px; margin-top: 24px; }
.v2-upload-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 20px; }
.v2-upload-footer > span { color: #6b7280; font-size: 12px; max-width: 190px; }
.v2-uploads { display: flex; gap: 12px; flex-wrap: wrap; padding-top: 20px; }
.v2-uploads > div { position: relative; }
.v2-uploads > div:empty { display: none; }
.v2-upload-thumb { width: 64px; height: 100px; border: 1px solid #e5e7eb; border-radius: 7px; overflow: hidden; display: block; }
.v2-upload-thumb img { width: 100%; height: 100%; object-fit: cover; }
.v2-upload-thumb span { position: absolute; bottom: 4px; left: 4px; background: white; border-radius: 3px; padding: 0 4px; font-size: 10px; }
.v2-remove { position: absolute; top: -7px; right: -7px; width: 32px; height: 32px; border: 1px solid #e5e7eb; border-radius: 50%; background: white; display: grid; place-items: center; }
.v2-import-hint { margin-top: 44px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
.v2-import-hint button, .v2-text-button { color: #2563eb; font-size: 12px; font-weight: 600; }
.v2-design { display: grid; grid-template-columns: 316px minmax(0, 1fr); min-height: calc(100dvh - 150px); }
.v2-inspector { display: flex; flex-direction: column; background: white; border-right: 1px solid #e5e7eb; }
.v2-inspector-title { padding: 24px 24px 18px; }
.v2-inspector-title h1 { font-size: 22px; font-weight: 600; letter-spacing: -.7px; outline: none; }
.v2-inspector-title p { font-size: 12px; color: #6b7280; margin-top: 5px; }
.v2-back-set { display: flex; align-items: center; gap: 6px; margin-bottom: 14px; color: #2563eb; font-size: 12px; font-weight: 600; }
.v2-panel-tabs { display: grid; grid-template-columns: repeat(2, 1fr); padding: 0 20px 18px; border-bottom: 1px solid #e5e7eb; gap: 6px; }
.v2-panel-tabs button { padding: 8px 9px; color: #4b5563; font-size: 12px; text-align: left; border: 1px solid transparent; border-radius: 6px; }
.v2-panel-tabs [aria-pressed=true] { color: #1d4ed8; border-color: #bfdbfe; background: #eff6ff; font-weight: 600; }
.v2-panel-body { padding: 24px; flex: 1; }
.v2-panel-body > .v2-help { margin-top: 10px; }
.v2-divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
.v2-more-control { margin-top: 18px; }
.v2-more-control summary { cursor: pointer; color: #4b5563; font-size: 12px; font-weight: 600; }
.v2-more-control[open] summary { margin-bottom: 12px; }
.v2-replace-image { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 7px; font-size: 12px; color: #4b5563; margin-bottom: 22px; }
.v2-replace-image img { width: 28px; height: 42px; object-fit: cover; border-radius: 3px; }
.v2-replace-image span:nth-last-child(2) { flex: 1; text-align: left; }
.v2-layout-templates { display: grid; gap: 12px; }
.v2-layout-templates > button { position: relative; display: grid; grid-template-columns: 1fr auto; gap: 11px; padding: 10px; text-align: left; border: 1px solid #e5e7eb; border-radius: 9px; background: white; }
.v2-layout-templates > button[aria-pressed=true] { border-color: #2563eb; box-shadow: 0 0 0 1px #2563eb; }
.v2-layout-preview { grid-column: 1 / -1; height: 74px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
.v2-layout-preview i { position: relative; overflow: hidden; border-radius: 4px; background: #eef4ff; }
.v2-layout-preview i::before { content: ''; position: absolute; width: 54%; height: 68%; left: 23%; bottom: -5%; border: 2px solid #1f2937; border-radius: 5px 5px 0 0; background: white; }
.v2-layout-preview i::after { content: ''; position: absolute; width: 60%; height: 3px; left: 20%; top: 10px; border-radius: 2px; background: #334155; }
.v2-layout-preview .variant-2::before { width: 46%; height: 68%; left: 35%; transform: rotate(-8deg); }
.v2-layout-preview .variant-2 b { position: absolute; width: 43%; height: 58%; left: 9%; bottom: -4%; border: 2px solid #64748b; border-radius: 5px 5px 0 0; background: white; transform: rotate(7deg); }
.v2-layout-preview .variant-3::before, .v2-layout-preview .variant-8::before { left: 42%; bottom: -12%; }
.v2-layout-preview .variant-4, .v2-layout-preview .variant-9 { background: #172554; }
.v2-layout-preview .variant-4::after, .v2-layout-preview .variant-9::after { background: white; }
.v2-layout-preview .variant-5::before, .v2-layout-preview .variant-7::before { width: 62%; left: 19%; }
.v2-layout-copy strong { display: block; font-size: 13px; font-weight: 600; }
.v2-layout-copy small { display: block; max-width: 220px; margin-top: 4px; color: #6b7280; font-size: 11px; font-weight: 400; line-height: 1.45; }
.v2-slide-layouts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 9px; }
.v2-slide-layouts button { padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: left; }
.v2-slide-layouts button[aria-pressed=true] { border-color: #2563eb; box-shadow: 0 0 0 1px #2563eb; color: #1d4ed8; }
.v2-slide-layouts strong { display: block; margin-top: 7px; font-size: 11px; font-weight: 600; }
.v2-layout-glyph { position: relative; display: block; height: 66px; overflow: hidden; border-radius: 5px; background: #eef4ff; }
.v2-layout-glyph::before { content: ''; position: absolute; width: 38%; height: 74%; left: 31%; bottom: -8%; border: 2px solid #334155; border-radius: 6px 6px 0 0; background: white; }
.v2-layout-glyph::after { content: ''; position: absolute; width: 44%; height: 4px; left: 28%; top: 10px; border-radius: 2px; background: #334155; }
.v2-layout-glyph.variant-2::before { left: 43%; transform: rotate(-7deg); }
.v2-layout-glyph.variant-2 i { position: absolute; width: 36%; height: 62%; left: 17%; bottom: -8%; border: 2px solid #64748b; border-radius: 6px 6px 0 0; background: white; transform: rotate(7deg); }
.v2-layout-glyph.variant-3::before { left: 52%; bottom: -16%; }
.v2-layout-glyph.variant-3::after { left: 10%; top: 22px; width: 34%; }
.v2-layout-glyph.variant-4 { background: #172554; }
.v2-layout-glyph.variant-4::after { background: white; }
.v2-template-note { margin-top: 16px; color: #6b7280; font-size: 11px; line-height: 1.5; }
.v2-theme-list { display: grid; gap: 8px; }
.v2-theme-list button { display: grid; grid-template-columns: 56px 1fr auto; align-items: center; text-align: left; gap: 10px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; font-size: 11px; font-weight: 600; }
.v2-theme-list [aria-pressed=true] { border-color: #2563eb; background: #eff6ff; }
.v2-palette { width: 56px; height: 24px; display: flex; border-radius: 4px; overflow: hidden; }
.v2-palette i { flex: 1; }
.v2-colors label { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; padding: 6px 0; font-weight: 400; }
.v2-colors input { width: 34px; height: 30px; border: 1px solid #d1d5db; border-radius: 5px; padding: 3px; cursor: pointer; }
.v2-brand-summary { display: flex; align-items: flex-start; gap: 12px; padding: 18px 0; margin: 18px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; }
.v2-brand-summary > img, .v2-brand-summary > span { width: 42px; height: 42px; border-radius: 9px; object-fit: cover; color: #64748b; flex-shrink: 0; }
.v2-brand-summary strong { font-size: 13px; font-weight: 600; }
.v2-brand-summary p { margin-top: 4px; color: #6b7280; font-size: 11px; line-height: 1.45; }
.v2-ai-actions { display: grid; gap: 8px; margin-top: 20px; }
.v2-language-list { max-height: 360px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; }
.v2-language-list label { display: flex; align-items: center; gap: 9px; padding: 9px 10px; margin: 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; font-weight: 400; }
.v2-language-list label:last-child { border-bottom: 0; }
.v2-language-list input { accent-color: #2563eb; }
.v2-stage { min-width: 0; display: flex; flex-direction: column; }
.v2-canvas-toolbar { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 16px 24px; }
.v2-canvas-toolbar select { font-size: 12px; width: auto; max-width: 170px; padding: 8px 10px; }
.v2-canvas { flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 12px 24px 24px; background-image: radial-gradient(#d5dbe5 .65px, transparent .65px); background-size: 16px 16px; }
.v2-set-canvas { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 24px 32px; }
.v2-set-heading { display: flex; justify-content: space-between; align-items: end; gap: 16px; padding: 8px 0 18px; }
.v2-set-heading strong { display: block; font-size: 15px; font-weight: 600; }
.v2-set-heading span { display: block; color: #6b7280; font-size: 11px; margin-top: 4px; }
.v2-slide-grid { display: grid; grid-template-columns: repeat(5, minmax(110px, 1fr)); gap: 18px 14px; align-items: start; }
.v2-grid-slide { min-width: 0; cursor: pointer; }
.v2-grid-slide :deep(.group) { box-shadow: 0 8px 20px rgba(15, 23, 42, .1); }
.v2-slide-preview { max-width: 100%; }
.v2-canvas-hint { margin-top: 18px; display: flex; align-items: center; gap: 6px; font-size: 11px; color: #6b7280; }
.v2-filmstrip { display: flex; gap: 12px; overflow-x: auto; padding: 16px 24px; background: white; border-top: 1px solid #e5e7eb; }
.v2-filmstrip button { display: flex; align-items: center; flex-direction: column; flex-shrink: 0; gap: 5px; font-size: 10px; color: #6b7280; }
.v2-film-image { width: 44px; height: 66px; border: 2px solid #e5e7eb; border-radius: 5px; background: #f9fafb; overflow: hidden; display: grid; place-items: center; }
.v2-film-image img { width: 100%; height: 100%; object-fit: cover; }
.v2-filmstrip [aria-pressed=true] { color: #2563eb; font-weight: 600; }
.v2-filmstrip [aria-pressed=true] .v2-film-image { border-color: #2563eb; box-shadow: 0 0 0 2px #dbeafe; }
.v2-add-slide { width: 44px; justify-content: center; border: 1px dashed #d1d5db; border-radius: 5px; align-self: flex-start; height: 66px; }
.v2-download-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 380px); gap: 64px; margin-top: 36px; }
.v2-export-preview { display: flex; align-items: center; justify-content: center; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f0f3f8; }
.v2-export-options { padding: 8px 0; }
.v2-export-summary { display: flex; gap: 12px; border-top: 1px solid #e5e7eb; margin-top: 24px; padding: 22px 0; }
.v2-export-summary > span { font-size: 22px; color: #2563eb; }
.v2-export-summary strong { font-size: 13px; font-weight: 600; }
.v2-export-summary p { font-size: 12px; color: #6b7280; margin-top: 5px; }
.v2-single-download { width: 100%; margin-top: 14px; font-size: 12px; color: #4b5563; }
.v2-download-success { margin-top: 16px; display: flex; gap: 6px; align-items: center; font-size: 13px; color: #047857; }
.v2-export-nodes { position: fixed; left: -100000px; top: 0; pointer-events: none; }
@media (min-width: 1200px) { .v2-stage { padding-left: 20px; padding-right: 20px; } }
@media (max-width: 800px) {
  .v2-header { flex-wrap: wrap; padding: 16px 20px; gap: 16px; }
  .v2-steps { order: 3; width: 100%; justify-content: center; }
  .v2-steps button { padding: 7px 8px; font-size: 12px; gap: 6px; }
  .v2-projectbar { padding: 12px 20px; }
  .v2-upload-page, .v2-download-page { padding: 32px 20px; }
  .v2-upload-layout { grid-template-columns: 1fr; gap: 24px; margin-top: 28px; }
  .v2-upload-footer { align-items: flex-start; flex-direction: column; }
  .v2-upload-footer > span { max-width: none; }
  .v2-upload-footer > a, .v2-upload-footer > button { width: 100%; justify-content: center; }
  .v2-design { grid-template-columns: 1fr; }
  .v2-stage { grid-row: 1; }
  .v2-inspector { border-right: 0; border-top: 1px solid #e5e7eb; }
  .v2-canvas-toolbar { padding: 14px 16px; }
  .v2-canvas-toolbar > div { flex-wrap: wrap; }
  .v2-canvas-toolbar select { max-width: 130px; }
  .v2-slide-preview { max-width: 200px; }
  .v2-set-canvas { padding: 8px 16px 24px; }
  .v2-slide-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 10px; }
  .v2-canvas { padding: 8px 20px 20px; }
  .v2-download-layout { grid-template-columns: 1fr; gap: 24px; }
  .v2-export-preview { padding: 24px; }
}
@media (max-width: 800px) {
  .v2-focused { height: 100dvh; min-height: 0; grid-template-rows: auto minmax(0, 1fr); overflow: hidden; }
  .v2-focused .v2-stage { position: static; min-height: 0; background: #f9fafb; border-bottom: 1px solid #d1d5db; }
  .v2-focused .v2-inspector { grid-row: 2; min-height: 0; overflow-y: auto; }
  .v2-focused .v2-result-heading { display: none; }
  .v2-focused .v2-canvas-toolbar { padding: 8px 12px; flex-wrap: wrap; }
  .v2-focused .v2-canvas-toolbar > div { gap: 8px; }
  .v2-focused .v2-canvas-toolbar > div:first-child { width: 100%; flex-wrap: nowrap; }
  .v2-focused .v2-canvas-toolbar select { width: 0; flex: 1; max-width: none; }
  .v2-focused .v2-inspector-title { padding: 12px 20px 8px; }
  .v2-focused .v2-inspector-title p { display: none; }
  .v2-focused .v2-panel-tabs { padding-bottom: 8px; }
  .v2-focused .v2-canvas { padding: 6px 12px; }
  .v2-focused .v2-slide-preview { width: min(100%, 220px, calc(26dvh * var(--v2-ratio))) !important; max-height: none; }
  .v2-focused .v2-filmstrip { padding: 6px 12px; gap: 8px; }
  .v2-focused .v2-film-image { width: 24px; height: 32px; }
  .v2-placement { height: auto; overflow: visible; grid-template-rows: auto auto; }
  .v2-placement .v2-stage { position: static; }
  .v2-placement .v2-inspector { overflow: visible; }
  .v2-placement-done { display: block; position: fixed; bottom: 16px; right: 16px; z-index: 30; min-height: 44px; padding: 12px 18px; background: #2563eb; color: white; border-radius: 8px; box-shadow: 0 4px 16px #0003; }
  .v2-placement .v2-slide-preview { width: min(100%, 320px) !important; max-height: none; overflow: visible; }
  .v2-focused .v2-inspector { position: relative; }
}
@media (prefers-reduced-motion: reduce) { .v2 *, .v2 :deep(*) { transition: none !important; animation: none !important; } }
</style>
