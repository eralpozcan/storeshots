<script setup lang="ts">
import { toPng } from 'html-to-image'
import JSZip from 'jszip'
import type { Device, Orientation } from '~/utils/types'
import { FGW, FGH, STORE_PRESETS } from '~/utils/canvas'
import type { StorePreset, PresetTarget } from '~/utils/canvas'
import { SLIDE_COUNT_APPLE, SLIDE_COUNT_ANDROID } from '~/utils/defaults'

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
} = useScreenshots()

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

onMounted(() => { ready.value = true })
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
    />

    <!-- Main area -->
    <div class="flex-1 flex flex-col overflow-hidden relative">
      <!-- Toolbar -->
      <div class="shrink-0 bg-white border-b border-gray-200 flex items-center z-50">
        <div class="flex-1 flex items-center gap-2.5 px-4 py-2.5 overflow-x-auto min-w-0">
          <NuxtLink
            to="/"
            class="flex items-center gap-2 pr-3 mr-1 border-r border-gray-200 text-gray-600 hover:text-blue-600 shrink-0"
            aria-label="Back to home"
          >
            <UIcon
              name="i-lucide-arrow-left"
              class="size-4"
            />
            <span class="text-xs font-semibold">Home</span>
          </NuxtLink>

          <span class="font-bold text-sm text-gray-900 whitespace-nowrap">
            {{ config.appName || 'My App' }} · Screenshots
          </span>

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

        <!-- Export buttons -->
        <div class="shrink-0 flex items-stretch border-l border-gray-200 bg-white">
          <div class="px-4 py-2.5 flex items-center gap-2">
            <UButton
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
      </div>

      <!-- Preview area -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100">
        <!-- Feature graphic -->
        <div
          v-if="device === 'feature-graphic'"
          class="p-6"
        >
          <p class="text-xs text-gray-500 mb-4">
            Google Play Feature Graphic · 1024×500 · Click to export
          </p>
          <div
            class="inline-block cursor-pointer rounded-xl overflow-hidden shadow-lg"
            @click="exportFG"
          >
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
          <div class="p-6 grid grid-cols-3 gap-6 max-w-[1100px] mx-auto">
            <SlideCard
              v-for="(v, i) in slideVariants"
              :key="`${device}-${orientation}-${i}`"
              :index="i"
              :variant="v"
              :cfg="slideConfig"
              :c-w="canvasDims.cW"
              :c-h="canvasDims.cH"
              :label="config.copy[i]?.label || `Slide ${i + 1}`"
              :device-frame="deviceFrame"
              @export="exportOne(i)"
            />
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
  </div>
</template>
