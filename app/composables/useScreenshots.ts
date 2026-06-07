import type { UserConfig, Device, Orientation, SlideConfig } from '~/utils/types'
import { loadConfig, saveConfig, DEFAULT_CONFIG } from '~/utils/defaults'
import { extractPalette } from '~/utils/color-extract'
import { resolveFontStack } from '~/utils/fonts'
import {
  W, H, AW, AH, AT7P_W, AT7P_H, AT7L_W, AT7L_H,
  AT10P_W, AT10P_H, AT10L_W, AT10L_H, IPAD_W, IPAD_H, FGW, FGH,
  IPHONE_SIZES, ANDROID_SIZES, ANDROID_7P_SIZES, ANDROID_7L_SIZES,
  ANDROID_10P_SIZES, ANDROID_10L_SIZES, IPAD_SIZES, FG_SIZES,
} from '~/utils/canvas'

// Downscale a base64 data URL to a small JPEG for AI vision analysis.
// Full-res screenshots (up to ~1.5MB each) blow past the hosting proxy's body
// size limit and trigger a 413 before the request reaches our handler. The
// vision model only needs ~1024px to read a screenshot, so shrink + re-encode
// as JPEG to cut the payload ~10-20x. Falls back to the original on any failure.
async function downscaleDataUrl(dataUrl: string, maxDim = 1024, quality = 0.72): Promise<string> {
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('image decode failed'))
      img.src = dataUrl
    })
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return dataUrl
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    return dataUrl
  }
}

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
    // Densify any incoming copy: layout/variant edits can index past the
    // current array length (e.g. after switching to a shorter-locale copy),
    // which leaves sparse holes. Array.from walks holes as undefined → blank
    // slide, guaranteeing config.copy never contains an undefined entry that
    // would crash the copy-list render.
    const denseCopy = patch.copy
      ? Array.from(patch.copy as any[], (c: any) => c ?? { label: '', headline: '' })
      : undefined
    const next: UserConfig = {
      ...prev,
      ...patch,
      colors: patch.colors ? { ...prev.colors, ...patch.colors } : prev.colors,
      images: patch.images ? { ...prev.images, ...patch.images } : prev.images,
      ai: patch.ai ? { ...prev.ai, ...patch.ai } : prev.ai,
      copy: denseCopy ?? prev.copy,
      copyByLocale: patch.copyByLocale ?? prev.copyByLocale,
      features: patch.features ?? prev.features,
    }
    // Write-through: any edit to the live `copy` mirrors into the active
    // locale's slot so switching languages never loses unsaved edits. Skip when
    // the caller already manages copyByLocale (e.g. switchLocale, generateLocales).
    if (denseCopy && !patch.copyByLocale) {
      next.copyByLocale = { ...next.copyByLocale, [next.locale]: denseCopy }
    }
    config.value = next
    saveConfig(config.value)
  }

  // Switch the editor to a different language. Persists the current live copy
  // into the active locale's slot, then loads the target locale's stored copy
  // (or seeds it from the current copy if that language hasn't been generated
  // yet, so the user can translate manually).
  function switchLocale(locale: string) {
    if (locale === config.value.locale) return
    const map = { ...config.value.copyByLocale, [config.value.locale]: config.value.copy }
    const target = map[locale]
    const nextCopy = target?.length ? target : config.value.copy.map(c => ({ ...c }))
    updateConfig({ locale, copy: nextCopy, copyByLocale: { ...map, [locale]: nextCopy } })
  }

  // Copy one slide's layout (elements / variant / legacy position) from the
  // active locale into every other stored locale, keeping each locale's text.
  // Layout is intentionally per-language (long translations may need their own
  // placement), so this is an opt-in "apply to all" rather than auto-sync.
  function applyLayoutToAllLocales(slideIdx: number) {
    const c = config.value
    const src = c.copy[slideIdx]
    if (!src) return
    const map: Record<string, SlideCopy[]> = { ...c.copyByLocale, [c.locale]: c.copy }
    for (const loc of Object.keys(map)) {
      if (loc === c.locale) continue
      const arr = [...(map[loc] ?? [])]
      const cur = arr[slideIdx] ?? { label: '', headline: '' }
      // Drop the target's own layout, then graft the source layout on top of
      // its text. Omit fields the source doesn't have so we don't write undefined.
      const { elements, variant, position, ...text } = cur
      const next: SlideCopy = { ...text }
      if (src.elements) next.elements = src.elements.map(e => ({ ...e }))
      if (src.variant != null) next.variant = src.variant
      if (src.position) next.position = { ...src.position }
      arr[slideIdx] = next
      map[loc] = arr
    }
    // copy (active locale) is unchanged; only the other locales' stores update.
    updateConfig({ copyByLocale: map })
    toast.add({
      title: 'Layout applied',
      description: `Slide ${slideIdx + 1} layout copied to all languages.`,
      color: 'success',
      icon: 'i-lucide-layout-template',
    })
  }

  // Replace a locale's stored copy wholesale (used by file import). Mirrors into
  // the live `copy` when the imported locale is the one being edited.
  function setLocaleCopy(locale: string, slides: SlideCopy[]) {
    const map = { ...config.value.copyByLocale, [locale]: slides }
    const patch: Partial<UserConfig> = { copyByLocale: map }
    if (locale === config.value.locale) patch.copy = slides
    updateConfig(patch)
  }

  // Edit a single field of a single slide for any locale (translations table).
  function setLocaleCell(locale: string, slideIdx: number, field: 'label' | 'headline', value: string) {
    const existing = config.value.copyByLocale[locale] ?? (locale === config.value.locale ? config.value.copy : [])
    const arr = [...existing]
    arr[slideIdx] = { ...(arr[slideIdx] ?? { label: '', headline: '' }), [field]: value }
    setLocaleCopy(locale, arr)
  }

  // Download a locale's copy as a JSON file for external translation.
  function exportLocaleCopy(locale: string) {
    if (import.meta.server) return
    const slides = (config.value.copyByLocale[locale] ?? (locale === config.value.locale ? config.value.copy : []))
      .map(s => ({ label: s.label ?? '', headline: s.headline ?? '' }))
    const blob = new Blob([JSON.stringify(slides, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const slug = (config.value.appName || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app'
    a.download = `${slug}-${locale}.json`
    a.href = url
    a.click()
    URL.revokeObjectURL(url)
  }

  // AI-translate the source locale's existing copy into the target locales,
  // preserving slide structure. Unlike generateLocales (which re-derives from
  // screenshots), this translates the text the user already has.
  async function translateLocales(sourceLocale: string, targetLocales: string[]) {
    if (!config.value.ai.apiKey) {
      toast.add({
        title: 'API key missing',
        description: 'Add an OpenRouter or Anthropic API key before translating.',
        color: 'warning',
        icon: 'i-lucide-key',
      })
      return
    }
    const source = config.value.copyByLocale[sourceLocale]
      ?? (sourceLocale === config.value.locale ? config.value.copy : [])
    const slides = source.map(s => ({ label: s.label ?? '', headline: s.headline ?? '' }))
    const targets = targetLocales.filter(l => l !== sourceLocale)
    if (!slides.length || !targets.length) return
    generating.value = true
    try {
      const res = await $fetch('/api/translate', {
        method: 'POST',
        body: {
          provider: config.value.ai.provider,
          apiKey: config.value.ai.apiKey,
          openrouterModel: config.value.ai.openrouterModel,
          claudeModel: config.value.ai.claudeModel,
          sourceLocale,
          targetLocales: targets,
          slides,
        },
      }) as { locales?: Record<string, any[]> }
      const map = { ...config.value.copyByLocale }
      let count = 0
      for (const loc of targets) {
        const out = res.locales?.[loc]
        if (out?.length) {
          map[loc] = out.map((s: any) => ({ label: s.label || '', headline: s.headline || '' }))
          count++
        }
      }
      const active = config.value.locale
      updateConfig({
        copyByLocale: map,
        copy: map[active]?.length ? map[active]! : config.value.copy,
      })
      toast.add({
        title: 'Translation ready',
        description: `${count} language${count === 1 ? '' : 's'} translated from ${sourceLocale.toUpperCase()}.`,
        color: 'success',
        icon: 'i-lucide-languages',
      })
    }
    catch (e: any) {
      showAIError('Translation failed', e)
    }
    finally {
      generating.value = false
    }
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
      fontFamily: resolveFontStack(c.fontFamily, !!c.customFont),
    }
  })

  const sizePick = computed(() => {
    const sizes = canvasDims.value.sizes
    return sizes[Math.min(sizeIdx.value, sizes.length - 1)]!
  })

  // Collect uploaded images as base64 for AI vision analysis, downscaled to
  // keep the request body under the hosting proxy's size limit (avoids 413).
  async function getUploadedImages(): Promise<string[]> {
    const full = config.value.images.iphone.filter((img): img is string => !!img)
    return Promise.all(full.map(img => downscaleDataUrl(img)))
  }

  // Reorder images to match the AI's suggested slide order via imageIndex.
  // LOSSLESS: an uploaded screenshot must never be dropped just because the AI
  // returned a partial, duplicate, or out-of-range imageIndex set. After
  // placing images by imageIndex, any uploaded image that wasn't placed is
  // appended into the remaining empty slots in original order.
  function reorderImages(slides: any[], originalImages: (string | null)[]): (string | null)[] {
    const n = originalImages.length
    const reordered: (string | null)[] = Array(n).fill(null)
    const used = new Set<number>()

    for (let i = 0; i < slides.length && i < n; i++) {
      const idx = slides[i]?.imageIndex
      if (idx !== null && idx !== undefined && idx >= 0 && idx < n
        && originalImages[idx] != null && !used.has(idx)) {
        reordered[i] = originalImages[idx]
        used.add(idx)
      }
    }

    // Safety net: re-home any uploaded image the AI's imageIndex didn't place,
    // so a bad/incomplete suggestion can never delete a screenshot.
    let cursor = 0
    for (let idx = 0; idx < n; idx++) {
      if (originalImages[idx] == null || used.has(idx)) continue
      while (cursor < n && reordered[cursor] != null) cursor++
      if (cursor >= n) break
      reordered[cursor] = originalImages[idx]
      used.add(idx)
    }

    return reordered
  }

  function applyAIResult(res: { slides?: any[]; colors?: any; features?: any[] }) {
    const patch: Partial<UserConfig> = {}

    // AI-suggested feature chips (full-design mode). Sanitize + cap; the user
    // can revise them in the sidebar / feature-graphic editor afterwards.
    if (Array.isArray(res.features) && res.features.length) {
      const clean = res.features
        .filter((f: any) => typeof f === 'string' && f.trim())
        .map((f: string) => f.trim())
        .slice(0, 12)
      if (clean.length) patch.features = clean
    }

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
    // Multi-language: generate copy for every selected language at once so each
    // one is editable via the editor's language tabs. Single language falls
    // through to the regular active-locale generation below.
    if ((config.value.selectedLocales?.length ?? 1) > 1) {
      await generateLocales()
      return
    }
    generating.value = true
    try {
      const images = await getUploadedImages()
      const res = await $fetch('/api/generate-copy', {
        method: 'POST',
        body: {
          provider: config.value.ai.provider,
          apiKey: config.value.ai.apiKey,
          openrouterModel: config.value.ai.openrouterModel,
          claudeModel: config.value.ai.claudeModel,
          appName: config.value.appName,
          appDescription: config.value.appDescription,
          aiBrief: config.value.aiBrief,
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
      const images = await getUploadedImages()
      const res = await $fetch('/api/generate-copy', {
        method: 'POST',
        body: {
          provider: config.value.ai.provider,
          apiKey: config.value.ai.apiKey,
          openrouterModel: config.value.ai.openrouterModel,
          claudeModel: config.value.ai.claudeModel,
          appName: config.value.appName,
          appDescription: config.value.appDescription,
          aiBrief: config.value.aiBrief,
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
    // Full design derives colors + active-language copy from the screenshots.
    // When multiple languages are selected, translate the remaining ones too
    // (copy only — colors are language-independent), filling the editor tabs.
    if ((config.value.selectedLocales?.length ?? 1) > 1) {
      await generateLocales({ onlyMissing: true })
    }
  }

  // Generate copy for every selected language and persist each into
  // copyByLocale so the editor language tabs can review/edit them. Unlike the
  // export-time generation, this keeps the results in state rather than
  // discarding them after a one-shot ZIP.
  async function generateLocales(opts?: { onlyMissing?: boolean }) {
    if (!config.value.ai.apiKey) {
      toast.add({
        title: 'API key missing',
        description: 'Add an OpenRouter or Anthropic API key before generating languages.',
        color: 'warning',
        icon: 'i-lucide-key',
      })
      return
    }
    const selected = config.value.selectedLocales?.length
      ? config.value.selectedLocales
      : [config.value.locale]
    const map: Record<string, SlideCopy[]> = { ...config.value.copyByLocale }
    // onlyMissing keeps languages already generated/edited (e.g. the active one
    // a full-design pass just produced); otherwise regenerate every selection.
    const locales = opts?.onlyMissing ? selected.filter(l => !map[l]?.length) : selected
    if (!locales.length) return
    generating.value = true
    try {
      const images = await getUploadedImages()
      const baseBody = {
        provider: config.value.ai.provider,
        apiKey: config.value.ai.apiKey,
        openrouterModel: config.value.ai.openrouterModel,
        claudeModel: config.value.ai.claudeModel,
        appName: config.value.appName,
        appDescription: config.value.appDescription,
        aiBrief: config.value.aiBrief,
        features: config.value.features,
        slideCount: config.value.copy.length,
        mode: 'copy-only' as const,
        images,
      }
      if (locales.length > 1 && config.value.batchLocaleGenerate) {
        const res = await $fetch('/api/generate-copy', {
          method: 'POST',
          body: { ...baseBody, locales },
        }) as { locales?: Record<string, any[]> }
        for (const loc of locales) {
          const slides = res.locales?.[loc]
          if (slides?.length) map[loc] = slides.map((s: any) => ({ label: s.label || '', headline: s.headline || '' }))
        }
      }
      else {
        for (const loc of locales) {
          const res = await $fetch('/api/generate-copy', {
            method: 'POST',
            body: { ...baseBody, locale: loc },
          }) as { slides?: any[] }
          if (res.slides?.length) map[loc] = res.slides.map((s: any) => ({ label: s.label || '', headline: s.headline || '' }))
        }
      }
      const active = config.value.locale
      updateConfig({
        copyByLocale: map,
        copy: map[active]?.length ? map[active]! : config.value.copy,
      })
      toast.add({
        title: 'Languages generated',
        description: `${Object.keys(map).length} language${Object.keys(map).length > 1 ? 's' : ''} ready — use the language tabs to review and edit.`,
        color: 'success',
        icon: 'i-lucide-languages',
      })
    }
    catch (e: any) {
      showAIError('Language generation failed', e)
    }
    finally {
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
  // Screenshots of the device currently being edited. Used so "Auto" colour
  // extraction works on whatever device the user is looking at (iPad, Android,
  // …) instead of always reading the iPhone slots.
  function currentDeviceImages(): string[] {
    const c = config.value
    const o = orientation.value
    const map: Record<string, (string | null)[]> = {
      iphone: c.images.iphone,
      android: c.images.androidPhone,
      'android-7': o === 'landscape' ? c.images.androidTablet7L : c.images.androidTablet7P,
      'android-10': o === 'landscape' ? c.images.androidTablet10L : c.images.androidTablet10P,
      ipad: c.images.ipad,
      'feature-graphic': c.images.iphone,
    }
    return (map[device.value] ?? c.images.iphone).filter((s): s is string => !!s)
  }

  async function extractColorsFromScreenshots() {
    if (import.meta.server) return
    // Prefer the active device's screenshots; if that device has none uploaded
    // (e.g. iPad selected but only iPhone shots exist), fall back to any
    // uploaded screenshot so Auto still produces a palette.
    let sources = currentDeviceImages()
    if (!sources.length) {
      sources = Object.values(config.value.images)
        .flat()
        .filter((s): s is string => !!s)
    }
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
        copyByLocale: (incoming.copyByLocale && typeof incoming.copyByLocale === 'object') ? incoming.copyByLocale : {},
        features: Array.isArray(incoming.features) ? incoming.features : DEFAULT_CONFIG.features,
        locale: typeof incoming.locale === 'string' ? incoming.locale : DEFAULT_CONFIG.locale,
        fgElements: Array.isArray(incoming.fgElements) && incoming.fgElements.length
          ? incoming.fgElements
          : DEFAULT_CONFIG.fgElements,
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
    switchLocale,
    applyLayoutToAllLocales,
    setLocaleCopy,
    setLocaleCell,
    exportLocaleCopy,
    translateLocales,
    generateLocales,
    generateCopy,
    generateFullDesign,
    exportProject,
    importProject,
    extractColorsFromScreenshots,
    copyVariants,
    generateCopyVariants,
    applyVariant,
    getUploadedImages,
  }
}
