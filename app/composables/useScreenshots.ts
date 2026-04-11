import type { UserConfig, Device, Orientation, SlideConfig } from '~/utils/types'
import { loadConfig, saveConfig } from '~/utils/defaults'
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

  async function generateCopy() {
    if (!config.value.ai.apiKey) return
    generating.value = true
    try {
      const images = getUploadedImages()
      const res = await $fetch('/api/generate-copy', {
        method: 'POST',
        body: {
          provider: config.value.ai.provider,
          apiKey: config.value.ai.apiKey,
          openrouterModel: config.value.ai.openrouterModel,
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
      console.error('AI copy generation failed:', e)
    } finally {
      generating.value = false
    }
  }

  async function generateFullDesign() {
    if (!config.value.ai.apiKey) return
    generating.value = true
    try {
      const images = getUploadedImages()
      const res = await $fetch('/api/generate-copy', {
        method: 'POST',
        body: {
          provider: config.value.ai.provider,
          apiKey: config.value.ai.apiKey,
          openrouterModel: config.value.ai.openrouterModel,
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
      console.error('AI design generation failed:', e)
    } finally {
      generating.value = false
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
  }
}
