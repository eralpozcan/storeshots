<script setup lang="ts">
const GH_URL = 'https://github.com/eralpozcan/storeshots'
const { openSettings } = useCookieConsent()
</script>

<template>
  <div class="min-h-screen bg-white text-gray-900 font-[Inter,sans-serif] antialiased">
    <!-- Nav -->
    <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
      <nav class="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <NuxtLink
          to="/"
          class="flex items-center gap-2.5"
        >
          <img
            src="/logo.png"
            alt="Storeshots"
            class="h-8 w-8 rounded-md"
            width="32"
            height="32"
          >
          <span class="font-bold text-lg tracking-tight">Storeshots</span>
          <span class="hidden sm:inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 ml-1">
            BETA
          </span>
        </NuxtLink>

        <div class="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
          <a
            href="/#features"
            class="hover:text-gray-900 transition-colors"
          >Features</a>
          <a
            href="/#how"
            class="hover:text-gray-900 transition-colors"
          >How it works</a>
          <a
            href="/#platforms"
            class="hover:text-gray-900 transition-colors"
          >Platforms</a>
          <a
            href="/#ai"
            class="hover:text-gray-900 transition-colors"
          >AI</a>
          <a
            href="/#faq"
            class="hover:text-gray-900 transition-colors"
          >FAQ</a>
          <NuxtLink
            to="/gallery"
            class="hover:text-gray-900 transition-colors"
          >
            Gallery
          </NuxtLink>
          <NuxtLink
            to="/changelog"
            class="hover:text-gray-900 transition-colors"
          >
            Changelog
          </NuxtLink>
        </div>

        <div class="flex items-center gap-2">
          <UButton to="/editor-v2" variant="soft">V2 Beta</UButton>
          <UButton
            :to="GH_URL"
            target="_blank"
            color="neutral"
            variant="ghost"
            icon="i-lucide-github"
            class="hidden sm:inline-flex"
          >
            GitHub
          </UButton>
          <UButton
            to="/editor"
            trailing-icon="i-lucide-arrow-right"
          >
            Classic editor
          </UButton>
        </div>
      </nav>
    </header>

    <p class="px-5 py-3 text-center text-sm leading-relaxed bg-blue-50 text-blue-800">V2 Beta is available alongside the classic editor. Your drafts stay separate in each editor.</p>
    <main>
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200">
      <div class="max-w-7xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Storeshots"
            class="h-7 w-7 rounded-md"
            width="28"
            height="28"
          >
          <span class="font-semibold text-gray-900">Storeshots</span>
          <span class="text-sm text-gray-500">
            · AGPL-3.0 © {{ new Date().getFullYear() }}
          </span>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-500">
          <a
            :href="GH_URL"
            target="_blank"
            rel="noopener"
            class="hover:text-gray-900 flex items-center gap-1.5"
          >
            <UIcon
              name="i-lucide-github"
              class="size-4"
            />
            GitHub
          </a>
          <a
            :href="`${GH_URL}/blob/main/CONTRIBUTING.md`"
            target="_blank"
            rel="noopener"
            class="hover:text-gray-900"
          >
            Contribute
          </a>
          <NuxtLink
            to="/editor"
            class="hover:text-gray-900"
          >
            Editor
          </NuxtLink>
          <NuxtLink
            to="/gallery"
            class="hover:text-gray-900"
          >
            Gallery
          </NuxtLink>
          <NuxtLink
            to="/privacy"
            class="hover:text-gray-900"
          >
            Privacy
          </NuxtLink>
          <NuxtLink
            to="/cookies"
            class="hover:text-gray-900"
          >
            Cookies
          </NuxtLink>
          <NuxtLink
            to="/terms"
            class="hover:text-gray-900"
          >
            Terms
          </NuxtLink>
          <NuxtLink
            to="/changelog"
            class="hover:text-gray-900"
          >
            Changelog
          </NuxtLink>
          <button
            type="button"
            class="hover:text-gray-900 cursor-pointer"
            @click="openSettings"
          >
            Cookie settings
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>
