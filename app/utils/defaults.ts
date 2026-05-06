import type { UserConfig } from './types'

export const SLIDE_COUNT = 10
export const SLIDE_COUNT_APPLE = 10
export const SLIDE_COUNT_ANDROID = 8

export const EMPTY_IMAGES = Array(SLIDE_COUNT).fill(null)

export const PLACEHOLDER_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BHgAIggN/PzmliQAAAABJRU5ErkJggg=='

export const DEFAULT_CONFIG: UserConfig = {
  appName: 'My App',
  appDescription: '',
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
  copy: Array.from({ length: SLIDE_COUNT }, (_, i) => ({
    label: i === SLIDE_COUNT - 1 ? 'TRUST' : `FEATURE ${i + 1}`,
    headline: i === SLIDE_COUNT - 1 ? 'Built for\nyou.' : 'Your headline\nhere.',
  })),
  images: {
    iphone: [...EMPTY_IMAGES],
    ipad: [...EMPTY_IMAGES],
    androidPhone: [...EMPTY_IMAGES],
    androidTablet7P: [...EMPTY_IMAGES],
    androidTablet7L: [...EMPTY_IMAGES],
    androidTablet10P: [...EMPTY_IMAGES],
    androidTablet10L: [...EMPTY_IMAGES],
  },
  locale: 'en',
  ai: {
    provider: 'claude',
    apiKey: '',
    openrouterModel: 'anthropic/claude-3-5-sonnet',
    claudeModel: 'claude-sonnet-4-6',
  },
}

export const STORAGE_KEY = 'screenshot-generator-config'

const AI_KEY_STORAGE = 'screenshot-generator-ai-key'

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
      features: parsed.features ?? DEFAULT_CONFIG.features,
      locale: parsed.locale ?? DEFAULT_CONFIG.locale,
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
}
