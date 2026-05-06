import type { UserConfig, Device, Orientation, SlideConfig } from '~/utils/types'
import { loadConfig, saveConfig, DEFAULT_CONFIG } from '~/utils/defaults'
import { extractPalette } from '~/utils/color-extract'
import {
  W, H, AW, AH, AT7P_W, AT7P_H, AT7L_W, AT7L_H,
  AT10P_W, AT10P_H, AT10L_W, AT10L_H, IPAD_W, IPAD_H, FGW, FGH,
  IPHONE_SIZES, ANDROID_SIZES, ANDROID_7P_SIZES, ANDROID_7L_SIZES,
  ANDROID_10P_SIZES, ANDROID_10L_SIZES, IPAD_SIZES, FG_SIZES,
} from '~/utils/canvas'

export function useScreenshots() {
  const config = ref<UserConfig>(loadConfig())
  const device = ref<Device>('iphone')
  const orientation = ref<Orientation>('portrait')
  const sizeIdx = ref(0)
  const exporting = ref<string | null>(null)
  const generating = ref(false)
  const ready = ref(false)

  const isTablet = computed(() => device.value === 'android-7' || device.value === 'android-10')

  function updateConfig(patch: Partial<UserConfig>) {
    const prev = config.value
    config.value = {
      ...prev,
      ...patch,
      colors: patch.colors ? { ...prev.colors, ...patch.colors } : prev.colors,
      images: patch.images ? { ...prev.images, ...patch.images } : prev.images,
      ai: patch.ai ? { ...prev.ai, ...patch.ai } : prev.ai,
      copy: patch.copy ?? prev.copy,
      features: patch.features ?? prev.features,
    }
    saveConfig(config.value)
  }

  const canvasDims = computed(() => {
    const d = device.value
    const o = orientation.value
    if (d === 'feature-graphic') return { cW: FGW, cH: FGH, sizes: FG_SIZES as readonly { label: string; w: number; h: number }[] }
    if (d === 'iphone')   return { cW: W, cH: H, sizes: IPHONE_SIZES as readonly { label: string; w: number; h: number }[] }
    if (d === 'android')  return { cW: AW, cH: AH, sizes: ANDROID_SIZES as readonly { label: string; w: number; h: number }[] }
    if (d === 'ipad')     return { cW: IPAD_W, cH: IPAD_H, sizes: IPAD_SIZES as readonly { label: string; w: number; h: number }[] }
    if (d === 'android-7') return o === 'landscape'
      ? { cW: AT7L_W, cH: AT7L_H, sizes: ANDROID_7L_SIZES as readonly { label: string; w: number; h: number }[] }
      : { cW: AT7P_W, cH: AT7P_H, sizes: ANDROID_7P_SIZES as readonly { label: string; w: number; h: number }[] }
    return o === 'landscape'
      ? { cW: AT10L_W, cH: AT10L_H, sizes: ANDROID_10L_SIZES as readonly { label: string; w: number; h: number }[] }
      : { cW: AT10P_W, cH: AT10P_H, sizes: ANDROID_10P_SIZES as readonly { label: string; w: number; h: number }[] }
  })

  const slideConfig = computed<SlideConfig>(() => {
    const c = config.value
    const d = device.value
    const o = orientation.value
    const imageMap: Record<string, (string | null)[]> = {
      iphone: c.images.iphone,
      android: c.images.androidPhone,
      'android-7': o === 'landscape' ? c.images.androidTablet7L : c.images.androidTablet7P,
      'android-10': o === 'landscape' ? c.images.androidTablet10L : c.images.androidTablet10P,
      ipad: c.images.ipad,
      'feature-graphic': c.images.iphone,
    }
    return {
      images: imageMap[d] ?? c.images.iphone,
      copy: c.copy,
      colors: c.colors,
      appIcon: c.appIcon,
      appName: c.appName,
      features: c.features,
    }
  })

  const sizePick = computed(() => {
    const sizes = canvasDims.value.sizes
    return sizes[Math.min(sizeIdx.value, sizes.length - 1)]
  })

  // Collect uploaded images as base64 for AI vision analysis
  function getUploadedImages(): string[] {
    return config.value.images.iphone.filter((img): img is string => !!img)
  }

  // Reorder images based on AI's imageIndex suggestions
  function reorderImages(slides: any[], originalImages: (string | null)[]): (string | null)[] {
    const reordered: (string | null)[] = Array(originalImages.length).fill(null)
    for (let i = 0; i < slides.length && i < reordered.length; i++) {
      const idx = slides[i]?.imageIndex
      if (idx !== null && idx !== undefined && idx >= 0 && idx < originalImages.length) {
        reordered[i] = originalImages[idx]
      }
    }
    return reordered
  }

  function applyAIResult(res: { slides?: any[]; colors?: any }) {
    const patch: Partial<UserConfig> = {}

    if (res.slides) {
      // Extract copy (without imageIndex)
      patch.copy = res.slides.map((s: any) => ({ label: s.label || '', headline: s.headline || '' }))

      // Reorder images if AI provided imageIndex
      const hasReorder = res.slides.some((s: any) => s.imageIndex !== undefined && s.imageIndex !== null)
      if (hasReorder) {
        const currentImages = { ...config.value.images }
        const originalIphone = [...currentImages.iphone]
        currentImages.iphone = reorderImages(res.slides, originalIphone)

        // Also reorder other devices that have images
        for (const key of ['androidPhone', 'ipad'] as const) {
          const orig = [...currentImages[key]]
          if (orig.some(Boolean)) {
            currentImages[key] = reorderImages(res.slides, orig)
          }
        }
        patch.images = currentImages
      }
    }

    if (res.colors) patch.colors = res.colors
    if (Object.keys(patch).length) updateConfig(patch)
  }

  const toast = useToast()

  // FetchError carries the server's validation reason on `data.statusMessage`;
  // surface it to the user rather than only logging to the console.
  function showAIError(prefix: string, e: any) {
    const detail = e?.data?.statusMessage || e?.statusMessage || e?.message || 'Unknown error'
    toast.add({
      title: prefix,
      description: detail,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
      duration: 6000,
    })
    console.error(prefix, e)
  }

  async function generateCopy() {
    if (!config.value.ai.apiKey) {
      toast.add({
        title: 'API key missing',
        description: 'Add an OpenRouter or Anthropic API key in AI settings before generating copy.',
        color: 'warning',
        icon: 'i-lucide-key',
      })
      return
    }
    generating.value = true
    try {
      const images = getUploadedImages()
      const res = await $fetch('/api/generate-copy', {
        method: 'POST',
        body: {
          provider: config.value.ai.provider,
          apiKey: config.value.ai.apiKey,
          openrouterModel: config.value.ai.openrouterModel,
          claudeModel: config.value.ai.claudeModel,
          appName: config.value.appName,
          appDescription: config.value.appDescription,
          features: config.value.features,
          slideCount: 10,
          locale: config.value.locale || 'en',
          mode: 'copy-only',
          images,
        },
      }) as { slides?: any[]; error?: string }
      applyAIResult(res)
    } catch (e: any) {
      showAIError('AI copy generation failed', e)
    } finally {
      generating.value = false
    }
  }

  async function generateFullDesign() {
    if (!config.value.ai.apiKey) {
      toast.add({
        title: 'API key missing',
        description: 'Add an OpenRouter or Anthropic API key in AI settings before generating a design.',
        color: 'warning',
        icon: 'i-lucide-key',
      })
      return
    }
    generating.value = true
    try {
      const images = getUploadedImages()
      const res = await $fetch('/api/generate-copy', {
        method: 'POST',
        body: {
          provider: config.value.ai.provider,
          apiKey: config.value.ai.apiKey,
          openrouterModel: config.value.ai.openrouterModel,
          claudeModel: config.value.ai.claudeModel,
          appName: config.value.appName,
          appDescription: config.value.appDescription,
          features: config.value.features,
          slideCount: 10,
          locale: config.value.locale || 'en',
          mode: 'full-design',
          images,
        },
      }) as { slides?: any[]; colors?: any; error?: string }
      applyAIResult(res)
    } catch (e: any) {
      showAIError('AI design generation failed', e)
    } finally {
      generating.value = false
    }
  }

  // Cached variants from the most recent /api/copy-variants call. Lives only
  // for the editor session; not persisted to localStorage.
  const copyVariants = ref<{ label: string, headline: string }[][]>([])

  async function generateCopyVariants() {
    if (!config.value.ai.apiKey) {
      toast.add({
        title: 'API key missing',
        description: 'Add an OpenRouter or Anthropic API key before generating variants.',
        color: 'warning',
        icon: 'i-lucide-key',
      })
      return
    }
    generating.value = true
    try {
      const res = await $fetch<{ variants: { label: string, headline: string }[][] }>(
        '/api/copy-variants',
        {
          method: 'POST',
          body: {
            provider: config.value.ai.provider,
            apiKey: config.value.ai.apiKey,
            openrouterModel: config.value.ai.openrouterModel,
          claudeModel: config.value.ai.claudeModel,
            locale: config.value.locale || 'en',
            baseCopy: config.value.copy,
            count: 3,
          },
        },
      )
      copyVariants.value = res.variants || []
      toast.add({
        title: 'Variants ready',
        description: `${copyVariants.value.length} alternative copy sets generated.`,
        color: 'success',
        icon: 'i-lucide-shuffle',
      })
    }
    catch (e: any) {
      showAIError('Variant generation failed', e)
    }
    finally {
      generating.value = false
    }
  }

  function applyVariant(variantIdx: number) {
    const v = copyVariants.value[variantIdx]
    if (!v) return
    // Preserve any per-slide position fine-tunes from the current copy.
    const merged = v.map((slide, i) => ({
      ...slide,
      position: config.value.copy[i]?.position,
    }))
    updateConfig({ copy: merged })
  }

  // Pull dominant brand colours from the uploaded screenshots and apply them
  // as the slide palette. Pure client-side (canvas + colour quantisation), so
  // it works without an AI key. Falls back gracefully if the screenshots are
  // too uniform to extract anything useful.
  async function extractColorsFromScreenshots() {
    if (import.meta.server) return
    const sources = config.value.images.iphone.filter((s): s is string => !!s)
    if (!sources.length) {
      toast.add({
        title: 'No screenshots yet',
        description: 'Upload at least one screenshot before extracting colours.',
        color: 'warning',
        icon: 'i-lucide-image-plus',
      })
      return
    }
    try {
      const palette = await extractPalette(sources)
      if (!palette) {
        toast.add({
          title: 'Could not derive a palette',
          description: 'Screenshots looked too uniform — try editing colours manually.',
          color: 'warning',
          icon: 'i-lucide-palette',
        })
        return
      }
      updateConfig({ colors: palette })
      toast.add({
        title: 'Palette extracted',
        description: 'Brand colours pulled from your screenshots.',
        color: 'success',
        icon: 'i-lucide-palette',
      })
    }
    catch (e: any) {
      toast.add({
        title: 'Colour extraction failed',
        description: e?.message || 'Unknown error',
        color: 'error',
        icon: 'i-lucide-triangle-alert',
      })
    }
  }

  // Versioned project file format. Bump when the schema changes incompatibly.
  const PROJECT_FILE_VERSION = 1

  function exportProject() {
    if (import.meta.server) return
    // Strip the API key so a shared file never leaks credentials.
    const { ai, ...rest } = config.value
    const payload = {
      __storeshots: PROJECT_FILE_VERSION,
      exportedAt: new Date().toISOString(),
      config: {
        ...rest,
        ai: { provider: ai.provider, openrouterModel: ai.openrouterModel, claudeModel: ai.claudeModel, apiKey: '' },
      },
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const slug = (config.value.appName || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project'
    a.download = `${slug}.storeshots.json`
    a.href = url
    a.click()
    URL.revokeObjectURL(url)
    toast.add({
      title: 'Project exported',
      description: `${a.download} downloaded.`,
      color: 'success',
      icon: 'i-lucide-download',
    })
  }

  async function importProject(file: File) {
    if (import.meta.server) return
    if (file.size > 50 * 1024 * 1024) {
      toast.add({
        title: 'File too large',
        description: 'Project files must be under 50MB.',
        color: 'error',
        icon: 'i-lucide-triangle-alert',
      })
      return
    }
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!parsed || typeof parsed !== 'object' || typeof parsed.__storeshots !== 'number') {
        throw new Error('Not a Storeshots project file')
      }
      if (parsed.__storeshots > PROJECT_FILE_VERSION) {
        throw new Error('Project was saved by a newer Storeshots version. Please update.')
      }
      const incoming = parsed.config || {}
      // Merge over defaults so missing fields fall back rather than blowing up.
      // Preserve the in-memory API key — imported files don't carry credentials.
      const currentKey = config.value.ai.apiKey
      config.value = {
        ...DEFAULT_CONFIG,
        ...incoming,
        colors: { ...DEFAULT_CONFIG.colors, ...(incoming.colors || {}) },
        images: { ...DEFAULT_CONFIG.images, ...(incoming.images || {}) },
        ai: { ...DEFAULT_CONFIG.ai, ...(incoming.ai || {}), apiKey: currentKey },
        copy: Array.isArray(incoming.copy) && incoming.copy.length ? incoming.copy : DEFAULT_CONFIG.copy,
        features: Array.isArray(incoming.features) ? incoming.features : DEFAULT_CONFIG.features,
        locale: typeof incoming.locale === 'string' ? incoming.locale : DEFAULT_CONFIG.locale,
      }
      saveConfig(config.value)
      toast.add({
        title: 'Project imported',
        description: `${file.name} loaded successfully.`,
        color: 'success',
        icon: 'i-lucide-upload',
      })
    }
    catch (e: any) {
      toast.add({
        title: 'Import failed',
        description: e?.message || 'Could not parse project file.',
        color: 'error',
        icon: 'i-lucide-triangle-alert',
        duration: 6000,
      })
    }
  }

  return {
    config,
    device,
    orientation,
    sizeIdx,
    exporting,
    generating,
    ready,
    isTablet,
    canvasDims,
    slideConfig,
    sizePick,
    updateConfig,
    generateCopy,
    generateFullDesign,
    exportProject,
    importProject,
    extractColorsFromScreenshots,
    copyVariants,
    generateCopyVariants,
    applyVariant,
  }
}
