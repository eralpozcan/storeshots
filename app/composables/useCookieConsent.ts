// Cookie / storage consent state.
// Storeshots is mostly client-side: the only "cookie-like" storage we use today is sessionStorage for API keys
// and localStorage for editor preferences — both are strictly necessary. This composable is designed so analytics,
// marketing, or third-party embeds can be gated behind granular consent *before* they ever load.
//
// Consent is persisted in localStorage under a versioned key so a change to the policy invalidates old consent.

export type CookieCategory = 'necessary' | 'functional' | 'analytics' | 'marketing'

export interface CookieConsentState {
  version: number
  timestamp: number
  categories: Record<CookieCategory, boolean>
}

// Bump this version when the cookie policy changes materially.
// Existing consent will be invalidated and users will be re-asked.
export const COOKIE_CONSENT_VERSION = 1
const STORAGE_KEY = 'storeshots:cookie-consent'

const defaultState = (): CookieConsentState => ({
  version: COOKIE_CONSENT_VERSION,
  timestamp: 0,
  categories: {
    necessary: true, // cannot be disabled
    functional: false,
    analytics: false,
    marketing: false,
  },
})

const state = ref<CookieConsentState>(defaultState())
const loaded = ref(false)
const bannerVisible = ref(false)

// Push Google Consent Mode v2 update via dataLayer.
// The default state is set to `denied` by an inline script in nuxt.config head,
// so GTM/GA load (auto-triggered by @nuxt/scripts) but stay dormant until we
// flip categories to `granted` here.
function syncGoogleConsent() {
  if (import.meta.server) return
  const cats = state.value.categories
  const w = window as unknown as { dataLayer?: unknown[], gtag?: (...args: unknown[]) => void }
  w.dataLayer = w.dataLayer || []
  // Use the same arguments-array pattern gtag.js uses, so it works both before
  // and after the GTM/GA script defines `gtag` globally.
  w.dataLayer.push({
    event: 'consent_update',
    consent: {
      analytics_storage: cats.analytics ? 'granted' : 'denied',
      ad_storage: cats.marketing ? 'granted' : 'denied',
      ad_user_data: cats.marketing ? 'granted' : 'denied',
      ad_personalization: cats.marketing ? 'granted' : 'denied',
      functionality_storage: cats.functional ? 'granted' : 'denied',
      personalization_storage: cats.functional ? 'granted' : 'denied',
      security_storage: 'granted',
    },
  })
  if (typeof w.gtag === 'function') {
    w.gtag('consent', 'update', {
      analytics_storage: cats.analytics ? 'granted' : 'denied',
      ad_storage: cats.marketing ? 'granted' : 'denied',
      ad_user_data: cats.marketing ? 'granted' : 'denied',
      ad_personalization: cats.marketing ? 'granted' : 'denied',
      functionality_storage: cats.functional ? 'granted' : 'denied',
      personalization_storage: cats.functional ? 'granted' : 'denied',
      security_storage: 'granted',
    })
  }
}

function readStored(): CookieConsentState | null {
  if (import.meta.server) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CookieConsentState
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null
    return parsed
  }
  catch {
    return null
  }
}

function writeStored(next: CookieConsentState) {
  if (import.meta.server) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }
  catch {
    // storage may be full or blocked — silently fail, consent just won't persist
  }
}

function respectsDoNotTrack(): boolean {
  if (import.meta.server) return false
  const dnt = navigator.doNotTrack === '1'
    || (navigator as unknown as { msDoNotTrack?: string }).msDoNotTrack === '1'
    || (window as unknown as { doNotTrack?: string }).doNotTrack === '1'
  return Boolean(dnt)
}

export function useCookieConsent() {
  // Lazy hydration on client mount
  if (import.meta.client && !loaded.value) {
    const stored = readStored()
    if (stored) {
      state.value = stored
      syncGoogleConsent()
      bannerVisible.value = false
    }
    else {
      // No prior consent — show banner. Respect DNT by pre-flagging analytics/marketing as rejected.
      if (respectsDoNotTrack()) {
        state.value.categories.analytics = false
        state.value.categories.marketing = false
      }
      bannerVisible.value = true
    }
    loaded.value = true
  }

  const hasConsented = computed(() => state.value.timestamp > 0)
  const categories = computed(() => state.value.categories)

  function acceptAll() {
    state.value = {
      version: COOKIE_CONSENT_VERSION,
      timestamp: Date.now(),
      categories: { necessary: true, functional: true, analytics: true, marketing: true },
    }
    writeStored(state.value)
    syncGoogleConsent()
    bannerVisible.value = false
  }

  function rejectAll() {
    state.value = {
      version: COOKIE_CONSENT_VERSION,
      timestamp: Date.now(),
      categories: { necessary: true, functional: false, analytics: false, marketing: false },
    }
    writeStored(state.value)
    syncGoogleConsent()
    bannerVisible.value = false
  }

  function savePreferences(next: Partial<Record<CookieCategory, boolean>>) {
    state.value = {
      version: COOKIE_CONSENT_VERSION,
      timestamp: Date.now(),
      categories: {
        necessary: true,
        functional: next.functional ?? state.value.categories.functional,
        analytics: next.analytics ?? state.value.categories.analytics,
        marketing: next.marketing ?? state.value.categories.marketing,
      },
    }
    writeStored(state.value)
    syncGoogleConsent()
    bannerVisible.value = false
  }

  function revoke() {
    if (import.meta.client) {
      try { localStorage.removeItem(STORAGE_KEY) }
      catch { /* noop */ }
    }
    state.value = defaultState()
    syncGoogleConsent()
    bannerVisible.value = true
  }

  function openSettings() {
    bannerVisible.value = true
  }

  function allows(category: CookieCategory): boolean {
    return state.value.categories[category] === true
  }

  return {
    state: readonly(state),
    loaded: readonly(loaded),
    bannerVisible,
    hasConsented,
    categories,
    allows,
    acceptAll,
    rejectAll,
    savePreferences,
    revoke,
    openSettings,
  }
}
