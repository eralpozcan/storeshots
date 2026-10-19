import type { UserConfig } from './types'
import { DEFAULT_FONT_FAMILY } from './fonts'
import { FG_PRESET } from './canvas'
import { APPLE_IMAGE_KEYS } from './apple-assets'

export const SLIDE_COUNT = 10
export const SLIDE_COUNT_APPLE = 10
export const SLIDE_COUNT_ANDROID = 10

export const EMPTY_IMAGES = Array(SLIDE_COUNT).fill(null)

export const PLACEHOLDER_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BHgAIggN/PzmliQAAAABJRU5ErkJggg=='

export const DEFAULT_CONFIG: UserConfig = {
  appName: 'My App',
  appDescription: '',
  aiBrief: '',
  features: [],
  appIcon: null,
  colors: {
    primary: '#165dfb',
    accent: '#fb923c',
    textDark: '#0d1b3e',
    textLight: '#ffffff',
    bgFrom: '#0d1b3e',
    bgTo: '#1a3a7c',
  },
  fontFamily: DEFAULT_FONT_FAMILY,
  customFont: null,
  fgElements: FG_PRESET,
  copy: Array.from({ length: SLIDE_COUNT }, (_, i) => ({
    label: i === SLIDE_COUNT - 1 ? 'TRUST' : `FEATURE ${i + 1}`,
    headline: i === SLIDE_COUNT - 1 ? 'Built for\nyou.' : 'Your headline\nhere.',
  })),
  copyByLocale: {},
  images: {
    iphone: [...EMPTY_IMAGES],
    ipad: [...EMPTY_IMAGES],
    ipadLandscape: [...EMPTY_IMAGES],
    androidPhone: [...EMPTY_IMAGES],
    androidTablet7P: [...EMPTY_IMAGES],
    androidTablet7L: [...EMPTY_IMAGES],
    androidTablet10P: [...EMPTY_IMAGES],
    androidTablet10L: [...EMPTY_IMAGES],
    duoOuter: [...EMPTY_IMAGES],
    duoOuterLandscape: [...EMPTY_IMAGES],
    duoInner: [...EMPTY_IMAGES],
    duoInnerLandscape: [...EMPTY_IMAGES],
    appleHeader: [null],
    appleSearch: [null],
  },
  locale: 'en',
  selectedLocales: ['en'],
  batchLocaleGenerate: false,
  ai: {
    provider: 'claude',
    apiKey: '',
    openrouterModel: 'anthropic/claude-sonnet-5',
    claudeModel: 'claude-sonnet-5',
  },
}

export const STORAGE_KEY = 'screenshot-generator-config'

const AI_KEY_STORAGE = 'screenshot-generator-ai-key'

export function restoreConfig(value: unknown, apiKey = ''): UserConfig {
  const defaults: UserConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG))
  const parsed = value && typeof value === 'object' ? value as Partial<UserConfig> : {}
  const images = defaults.images
  const appleArtwork: NonNullable<UserConfig['appleArtwork']> = {}
  for (const key of APPLE_IMAGE_KEYS) {
    const artwork = parsed.appleArtwork?.[key]
    if (!artwork || typeof artwork !== 'object') continue
    appleArtwork[key] = {
      fit: artwork.fit === 'cover' ? 'cover' : 'contain',
      x: typeof artwork.x === 'number' && Number.isFinite(artwork.x) ? Math.max(0, Math.min(100, artwork.x)) : 50,
      y: typeof artwork.y === 'number' && Number.isFinite(artwork.y) ? Math.max(0, Math.min(100, artwork.y)) : 50,
      background: typeof artwork.background === 'string' && /^#[0-9a-f]{6}$/i.test(artwork.background) ? artwork.background : defaults.colors.bgFrom,
    }
  }
  for (const key of Object.keys(images) as (keyof typeof images)[]) {
    const incoming = parsed.images?.[key]
    images[key] = images[key].map((_, i) => typeof incoming?.[i] === 'string' ? incoming[i]! : null)
  }
  return {
    ...defaults, ...parsed,
    v2Workflow: parsed.v2Workflow && Array.isArray(parsed.v2Workflow.outputs)
      ? { outputs: parsed.v2Workflow.outputs.filter(id => typeof id === 'string'), prepared: parsed.v2Workflow.prepared === true,
          includeClosing: parsed.v2Workflow.includeClosing !== false,
          exportSizes: Object.fromEntries(Object.entries(parsed.v2Workflow.exportSizes || {}).filter(([, sizes]) => Array.isArray(sizes)).map(([id, sizes]) => [id, (sizes as unknown[]).filter((size): size is string => typeof size === 'string' && /^\d+x\d+$/.test(size))])),
          sourceKey: parsed.v2Workflow.sourceKey && Object.hasOwn(images, parsed.v2Workflow.sourceKey) ? parsed.v2Workflow.sourceKey : undefined,
          linkedSlots: Object.fromEntries(Object.entries(parsed.v2Workflow.linkedSlots || {}).filter(([key, slots]) => Object.hasOwn(images, key) && Array.isArray(slots)).map(([key, slots]) => [key, (slots as number[]).filter(i => Number.isInteger(i) && i >= 0 && i < images[key as keyof typeof images].length)])),
        }
      : undefined,
    appName: typeof parsed.appName === 'string' ? parsed.appName : defaults.appName,
    colors: { ...defaults.colors, ...parsed.colors },
    images,
    appleArtwork,
    ai: {
      provider: parsed.ai?.provider === 'openrouter' ? 'openrouter' : 'claude',
      claudeModel: typeof parsed.ai?.claudeModel === 'string' && parsed.ai.claudeModel.trim() ? parsed.ai.claudeModel : defaults.ai.claudeModel,
      openrouterModel: typeof parsed.ai?.openrouterModel === 'string' && parsed.ai.openrouterModel.trim() ? parsed.ai.openrouterModel : defaults.ai.openrouterModel,
      apiKey,
    },
    copy: Array.from({ length: SLIDE_COUNT }, (_, i) => {
      const slide = parsed.copy?.[i]
      return slide && typeof slide.headline === 'string' && typeof slide.label === 'string' ? slide : defaults.copy[i]!
    }),
    copyByLocale: parsed.copyByLocale && typeof parsed.copyByLocale === 'object' ? parsed.copyByLocale : {},
    features: Array.isArray(parsed.features) ? parsed.features.filter(f => typeof f === 'string') : [],
    locale: typeof parsed.locale === 'string' ? parsed.locale : defaults.locale,
    selectedLocales: Array.isArray(parsed.selectedLocales) && parsed.selectedLocales.some(l => typeof l === 'string' && l)
      ? parsed.selectedLocales.filter(l => typeof l === 'string' && l)
      : [typeof parsed.locale === 'string' ? parsed.locale : defaults.locale],
    fgElements: Array.isArray(parsed.fgElements) && parsed.fgElements.length ? parsed.fgElements : defaults.fgElements,
  }
}

export function loadConfig(): UserConfig {
  if (import.meta.server) return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) as Partial<UserConfig> : {}

    // API key lives in sessionStorage (cleared on tab close)
    const sessionKey = sessionStorage.getItem(AI_KEY_STORAGE) || ''

    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      colors: { ...DEFAULT_CONFIG.colors, ...parsed.colors },
      images: { ...DEFAULT_CONFIG.images, ...parsed.images },
      ai: { ...DEFAULT_CONFIG.ai, ...parsed.ai, apiKey: sessionKey },
      copy: parsed.copy?.length ? parsed.copy : DEFAULT_CONFIG.copy,
      copyByLocale: (parsed.copyByLocale && typeof parsed.copyByLocale === 'object')
        ? parsed.copyByLocale
        : {},
      features: parsed.features ?? DEFAULT_CONFIG.features,
      locale: parsed.locale ?? DEFAULT_CONFIG.locale,
      selectedLocales: Array.isArray(parsed.selectedLocales) && parsed.selectedLocales.length
        ? parsed.selectedLocales
        : [parsed.locale ?? DEFAULT_CONFIG.locale],
      batchLocaleGenerate: parsed.batchLocaleGenerate ?? DEFAULT_CONFIG.batchLocaleGenerate,
      fgElements: Array.isArray(parsed.fgElements) && parsed.fgElements.length
        ? parsed.fgElements
        : DEFAULT_CONFIG.fgElements,
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveConfig(config: UserConfig): void {
  if (import.meta.server) return

  // API key → sessionStorage (ephemeral, cleared on tab close)
  if (config.ai?.apiKey) {
    sessionStorage.setItem(AI_KEY_STORAGE, config.ai.apiKey)
  } else {
    sessionStorage.removeItem(AI_KEY_STORAGE)
  }

  // Everything else → localStorage (persistent, no sensitive data)
  const toSave: Partial<UserConfig> = { ...config }
  delete (toSave as any).images
  if (toSave.ai) {
    toSave.ai = { ...toSave.ai, apiKey: '' }
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // Quota exceeded — most likely a large custom font data-URL. Drop it from
    // persistence (the font stays live in memory + rides project export) so the
    // rest of the config still saves.
    try {
      const { customFont, ...rest } = toSave as UserConfig
      void customFont
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
    } catch { /* give up silently */ }
  }
}
