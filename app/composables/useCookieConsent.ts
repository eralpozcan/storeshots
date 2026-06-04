// Cookie / storage consent state.
// Storeshots is mostly client-side: the only "cookie-like" storage we use today is sessionStorage for API keys
// and localStorage for editor preferences — both are strictly necessary. This composable is designed so analytics,
// marketing, or third-party embeds can be gated behind granular consent *before* they ever load.
//
// Consent is persisted in a small first-party cookie under a versioned key so a change to the policy invalidates old consent.

export type CookieCategory = 'necessary' | 'functional' | 'analytics' | 'marketing'

export interface CookieConsentState {
  version: number
  timestamp: number
  categories: Record<CookieCategory, boolean>
}

// Bump this version when the cookie policy changes materially.
// Existing consent will be invalidated and users will be re-asked.
export const COOKIE_CONSENT_VERSION = 1
// Consent itself lives in a small first-party cookie (~120 bytes) so it travels
// with the request (usable during SSR) and stays standard. The legacy key is
// the old localStorage slot, kept only to migrate existing visitors once.
const CONSENT_COOKIE = 'storeshots_consent'
const LEGACY_STORAGE_KEY = 'storeshots:cookie-consent'
// ~180 days — long enough to avoid re-prompting, short enough to be re-asked.
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180

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

function syncAnalyticsConsent(granted: boolean) {
  if (import.meta.server) return
  if (granted) scriptsConsent.accept()
  else scriptsConsent.revoke()
}

function isValidState(s: unknown): s is CookieConsentState {
  return !!s && typeof s === 'object'
    && (s as CookieConsentState).version === COOKIE_CONSENT_VERSION
    && typeof (s as CookieConsentState).categories === 'object'
}

// One-time migration: pull consent out of the old localStorage slot (if any)
// so existing visitors aren't re-prompted, then clear it.
function readLegacyLocalStorage(): CookieConsentState | null {
  if (import.meta.server) return null
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidState(parsed) ? parsed : null
  }
  catch {
    return null
  }
}

function clearLegacyLocalStorage() {
  if (import.meta.server) return
  try { localStorage.removeItem(LEGACY_STORAGE_KEY) }
  catch { /* noop */ }
}

function respectsDoNotTrack(): boolean {
  if (import.meta.server) return false
  const dnt = navigator.doNotTrack === '1'
    || (navigator as unknown as { msDoNotTrack?: string }).msDoNotTrack === '1'
    || (window as unknown as { doNotTrack?: string }).doNotTrack === '1'
  return Boolean(dnt)
}

export function useCookieConsent() {
  // Consent persists in a small first-party cookie. useCookie JSON-encodes the
  // value and dedupes by key across calls, so every useCookieConsent() shares
  // the same cookie ref.
  const consentCookie = useCookie<CookieConsentState | null>(CONSENT_COOKIE, {
    maxAge: CONSENT_MAX_AGE,
    sameSite: 'lax',
    path: '/',
    secure: !import.meta.dev,
  })
  function persist(next: CookieConsentState) {
    consentCookie.value = next
  }

  // Lazy hydration on client mount
  if (import.meta.client && !loaded.value) {
    let stored = isValidState(consentCookie.value) ? consentCookie.value : null
    // Migrate a returning visitor's old localStorage consent into the cookie.
    if (!stored) {
      const legacy = readLegacyLocalStorage()
      if (legacy) {
        stored = legacy
        persist(legacy)
        clearLegacyLocalStorage()
      }
    }
    if (stored) {
      state.value = stored
      syncAnalyticsConsent(stored.categories.analytics)
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
    persist(state.value)
    syncAnalyticsConsent(true)
    bannerVisible.value = false
  }

  function rejectAll() {
    state.value = {
      version: COOKIE_CONSENT_VERSION,
      timestamp: Date.now(),
      categories: { necessary: true, functional: false, analytics: false, marketing: false },
    }
    persist(state.value)
    syncAnalyticsConsent(false)
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
    persist(state.value)
    syncAnalyticsConsent(state.value.categories.analytics)
    bannerVisible.value = false
  }

  function revoke() {
    consentCookie.value = null
    clearLegacyLocalStorage()
    state.value = defaultState()
    syncAnalyticsConsent(false)
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
