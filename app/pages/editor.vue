<script setup lang="ts">
import { toPng } from 'html-to-image'
import JSZip from 'jszip'
import type { Device, Orientation } from '~/utils/types'
import { FGW, FGH, STORE_PRESETS } from '~/utils/canvas'
import type { StorePreset, PresetTarget } from '~/utils/canvas'
import { SLIDE_COUNT_APPLE, SLIDE_COUNT_ANDROID, DEFAULT_CONFIG } from '~/utils/defaults'
import { START_TEMPLATES, type StartTemplate } from '~/utils/templates'

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
  updateConfig, generateCopy, generateFullDesign,
  exportProject, importProject,
  extractColorsFromScreenshots,
  copyVariants, generateCopyVariants, applyVariant,
} = useScreenshots()

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
function setPreviewRef(i: number, el: any) {
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
// iOS App Store listing (above-the-fold).
const storePreviewOpen = ref(false)

function applyTemplate(t: StartTemplate) {
  // Apply tone-of-voice fields only — never overwrite user's icon, screenshots, or AI key.
  updateConfig({
    colors: t.colors,
    copy: t.copy,
    features: t.features,
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

function setSlidePosition(i: number, value: { dx: number, dy: number } | null) {
  const next = [...config.value.copy]
  const current = next[i] || { label: '', headline: '' }
  if (value === null) {
    const { position, ...rest } = current
    next[i] = rest
  }
  else {
    next[i] = { ...current, position: value }
  }
  updateConfig({ copy: next })
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

function setRef(i: number, el: any) {
  exportRefs.value[i] = el as HTMLDivElement | null
}

// Export helpers
async function captureElement(el: HTMLElement, tw: number, th: number): Promise<string> {
  el.style.left = '0px'
  el.style.zIndex = '-1'
  await new Promise(r => setTimeout(r, 380))
  const opts = { width: tw, height: th, pixelRatio: 1, cacheBust: true }
  await toPng(el, opts) // warm-up
  const dataUrl = await toPng(el, opts)
  el.style.left = '-9999px'
  el.style.zIndex = ''
  return dataUrl
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

async function exportAll() {
  if (device.value === 'feature-graphic') { await exportFG(); return }
  const s = sizePick.value
  const variants = slideVariants.value
  for (let i = 0; i < variants.length; i++) {
    const el = exportRefs.value[i]
    if (!el) continue
    exporting.value = `${i + 1}/${variants.length}`
    downloadPng(await captureElement(el, s.w, s.h), fname(i))
    await new Promise(r => setTimeout(r, 420))
  }
  exporting.value = null
}

const slugLabel = (l: string) => l.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

// Bundle export: switches device/orientation through every target in the preset,
// captures every size for every slide, and ZIPs the result. The editor flickers
// between devices during the run — that's expected; the overlay tells the user
// not to close the tab.
async function exportPreset(preset: StorePreset) {
  const origDevice = device.value
  const origOrientation = orientation.value
  const origSizeIdx = sizeIdx.value

  const zip = new JSZip()
  const appSlug = slugLabel(config.value.appName || 'app') || 'app'
  let totalCaptured = 0
  const totalToCapture = preset.targets.reduce((acc: number, t: PresetTarget) => {
    const variantCount = (t.device === 'iphone' || t.device === 'ipad')
      ? SLIDE_COUNT_APPLE
      : SLIDE_COUNT_ANDROID
    return acc + (variantCount * t.sizes.length)
  }, 0)

  try {
    for (const target of preset.targets) {
      device.value = target.device
      orientation.value = target.orientation
      sizeIdx.value = 0
      // Wait for the editor DOM to swap to the new device frame and lay out.
      await nextTick()
      await new Promise(r => setTimeout(r, 700))

      const variants = slideVariants.value
      for (const size of target.sizes) {
        const folderName = `${target.device}-${slugLabel(size.label)}-${size.w}x${size.h}`
        const folder = zip.folder(folderName)
        if (!folder) continue
        for (let i = 0; i < variants.length; i++) {
          const el = exportRefs.value[i]
          if (!el) continue
          totalCaptured++
          exporting.value = `${preset.label} · ${totalCaptured}/${totalToCapture}`
          const dataUrl = await captureElement(el, size.w, size.h)
          const lbl = slugLabel(config.value.copy[i]?.label || '') || 'slide'
          const filename = `${String(i + 1).padStart(2, '0')}-${lbl}.png`
          folder.file(filename, dataUrl.split(',')[1] || '', { base64: true })
        }
      }
    }

    exporting.value = 'Zipping…'
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${appSlug}-${preset.key}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }
  finally {
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

const presetMenuItems = computed(() =>
  STORE_PRESETS.map(preset => ({
    label: preset.label,
    description: preset.description,
    icon: preset.key === 'app-store'
      ? 'i-lucide-apple'
      : preset.key === 'play-store'
        ? 'i-lucide-play'
        : 'i-lucide-package',
    onSelect: () => exportPreset(preset),
  })),
)

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
    if (!exporting.value) exportAll()
    return
  }
  if (meta && e.key.toLowerCase() === 'g') {
    e.preventDefault()
    if (!generating.value && config.value.ai.apiKey) generateCopy()
    return
  }
  if (e.key === 'Escape') {
    if (editingSlide.value !== null) editingSlide.value = null
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
        <!-- Row 1: identity + project actions -->
        <div class="flex items-center justify-between px-4 py-2 border-b border-gray-100">
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
          <div class="flex items-center gap-2 shrink-0">
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
              :disabled="!!exporting || device !== 'iphone'"
              :title="device !== 'iphone' ? 'Switch to iPhone to preview' : 'See how the first 3 slides look in the App Store'"
              @click="storePreviewOpen = true"
            >
              Store preview
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
            <UButton
              size="sm"
              :loading="!!exporting"
              :disabled="!!exporting"
              @click="exportAll"
            >
              {{ exporting ? `Exporting… ${exporting}` : 'Export All' }}
            </UButton>
            <UDropdownMenu
              :items="presetMenuItems"
              :disabled="!!exporting || device === 'feature-graphic'"
            >
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-package"
                :disabled="!!exporting || device === 'feature-graphic'"
              >
                Bundle
              </UButton>
            </UDropdownMenu>
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
        </div>
      </div>

      <!-- Preview area -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100">
        <!-- Feature graphic -->
        <div
          v-if="device === 'feature-graphic'"
          class="p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <p class="text-xs text-gray-500">
              Google Play Feature Graphic · 1024×500
            </p>
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
          <div class="inline-block rounded-xl overflow-hidden shadow-lg">
            <FeatureGraphic :cfg="slideConfig" />
          </div>
          <div
            ref="fgRef"
            :style="{ position: 'absolute', left: '-9999px', top: 0, width: `${FGW}px`, height: `${FGH}px` }"
          >
            <FeatureGraphic :cfg="slideConfig" />
          </div>
        </div>

        <!-- Slide grid -->
        <template v-else>
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
              :ref="(el) => setPreviewRef(i, el)"
            >
              <SlideCard
                :index="i"
                :variant="v"
                :cfg="slideConfig"
                :c-w="canvasDims.cW"
                :c-h="canvasDims.cH"
                :label="config.copy[i]?.label || `Slide ${i + 1}`"
                :device-frame="deviceFrame"
                @export="exportOne(i)"
                @edit="openEdit(i)"
                @position="(v: { dx: number, dy: number } | null) => setSlidePosition(i, v)"
              />
            </div>
          </div>

          <!-- Offscreen export targets -->
          <div class="fixed top-0 left-0 pointer-events-none -z-[100] overflow-hidden w-0 h-0">
            <div
              v-for="(v, i) in slideVariants"
              :key="`exp-${device}-${orientation}-${i}`"
              :ref="(el) => setRef(i, el)"
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

    <!-- App Store preview — what the first 3 slides look like above-the-fold. -->
    <UModal
      v-model:open="storePreviewOpen"
      title="App Store preview"
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
            iOS users see the first 3 slides without scrolling. Make sure the strongest hook is in slide 1, the most-used feature in slide 2, and a differentiator or social proof in slide 3.
          </p>
        </div>
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
