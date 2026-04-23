<script setup lang="ts">
import type { CookieCategory } from '~/composables/useCookieConsent'

const {
  bannerVisible,
  categories,
  acceptAll,
  rejectAll,
  savePreferences,
} = useCookieConsent()

const showDetails = ref(false)

// Local editable copy — committed on Save
const draft = ref<Record<CookieCategory, boolean>>({
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
})

watch(bannerVisible, (v) => {
  if (v) {
    draft.value = { ...categories.value }
    showDetails.value = false
  }
}, { immediate: true })

function save() {
  savePreferences({
    functional: draft.value.functional,
    analytics: draft.value.analytics,
    marketing: draft.value.marketing,
  })
}

const categoryList: {
  key: CookieCategory
  title: string
  required: boolean
  desc: string
}[] = [
  {
    key: 'necessary',
    title: 'Strictly necessary',
    required: true,
    desc: 'Required for the site to function: remembering your editor settings, API keys held in sessionStorage for the current tab, and CSRF/security tokens. No opt-out — without these, Storeshots cannot work.',
  },
  {
    key: 'functional',
    title: 'Functional',
    required: false,
    desc: 'Remember non-essential preferences across visits: theme, last-selected device type, UI language. Disabling this will not break the editor.',
  },
  {
    key: 'analytics',
    title: 'Analytics',
    required: false,
    desc: 'Anonymous, aggregated usage analytics (page views, feature usage) so we can improve the product. No personal profiles, no cross-site tracking.',
  },
  {
    key: 'marketing',
    title: 'Marketing',
    required: false,
    desc: 'None at the moment. Reserved for future use: referral attribution, conversion measurement for Pro announcements. We will never share data with ad networks.',
  },
]
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="bannerVisible"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      aria-modal="false"
      class="fixed bottom-0 inset-x-0 z-[100] p-3 sm:p-5 pointer-events-none"
    >
      <div class="pointer-events-auto max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-xl shadow-2xl shadow-gray-900/10 overflow-hidden">
        <!-- Compact banner -->
        <div
          v-if="!showDetails"
          class="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <div class="flex-1 min-w-0">
            <h2
              id="cookie-banner-title"
              class="text-sm font-semibold text-gray-900 flex items-center gap-2"
            >
              <UIcon
                name="i-lucide-cookie"
                class="size-4 text-blue-600 shrink-0"
              />
              We use minimal, first-party storage.
            </h2>
            <p
              id="cookie-banner-desc"
              class="mt-1.5 text-xs sm:text-sm text-gray-600 leading-relaxed"
            >
              Storeshots runs in your browser and stores API keys only for the current tab (sessionStorage). We don't set advertising cookies or share data with third parties. See our
              <NuxtLink
                to="/cookies"
                class="text-blue-600 hover:underline font-medium"
              >
                cookie policy
              </NuxtLink>
              for the full list.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              @click="showDetails = true"
            >
              Customize
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              @click="rejectAll"
            >
              Reject all
            </UButton>
            <UButton
              size="sm"
              @click="acceptAll"
            >
              Accept all
            </UButton>
          </div>
        </div>

        <!-- Detailed preferences -->
        <div
          v-else
          class="max-h-[80vh] overflow-y-auto"
        >
          <div class="p-5 sm:p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-gray-900">
                Cookie preferences
              </h2>
              <p class="text-xs text-gray-500 mt-0.5">
                Choose which categories you allow. You can change this any time from the footer.
              </p>
            </div>
            <button
              type="button"
              class="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              aria-label="Close"
              @click="showDetails = false"
            >
              <UIcon
                name="i-lucide-x"
                class="size-5"
              />
            </button>
          </div>

          <div class="p-5 sm:p-6 space-y-4">
            <div
              v-for="cat in categoryList"
              :key="cat.key"
              class="rounded-xl border border-gray-200 p-4"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-semibold text-gray-900">
                      {{ cat.title }}
                    </h3>
                    <span
                      v-if="cat.required"
                      class="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
                    >
                      Always on
                    </span>
                  </div>
                  <p class="mt-1.5 text-xs text-gray-600 leading-relaxed">
                    {{ cat.desc }}
                  </p>
                </div>
                <USwitch
                  :model-value="cat.required ? true : draft[cat.key]"
                  :disabled="cat.required"
                  size="md"
                  class="shrink-0 mt-1"
                  @update:model-value="(v: boolean) => { if (!cat.required) draft[cat.key] = v }"
                />
              </div>
            </div>
          </div>

          <div class="p-5 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center bg-gray-50">
            <NuxtLink
              to="/cookies"
              class="text-xs text-gray-600 hover:text-gray-900 hover:underline"
              @click="bannerVisible = false"
            >
              Read the full cookie policy →
            </NuxtLink>
            <div class="flex flex-wrap items-center gap-2">
              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                @click="rejectAll"
              >
                Reject all
              </UButton>
              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                @click="acceptAll"
              >
                Accept all
              </UButton>
              <UButton
                size="sm"
                @click="save"
              >
                Save preferences
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
