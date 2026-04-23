<script setup lang="ts">
const GH_URL = 'https://github.com/eralpozcan/storeshots'
const { openSettings } = useCookieConsent()
</script>

<template>
  <div class="min-h-screen bg-white text-gray-900 font-[Inter,sans-serif] antialiased">
    <!-- Nav -->
    <header class="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
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
        </NuxtLink>
        <div class="flex items-center gap-2">
          <UButton
            to="/"
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-arrow-left"
            class="hidden sm:inline-flex"
          >
            Home
          </UButton>
          <UButton
            to="/editor"
            size="sm"
            trailing-icon="i-lucide-arrow-right"
          >
            Open Editor
          </UButton>
        </div>
      </nav>
    </header>

    <main>
      <slot />
    </main>

    <!-- Shared contact CTA — shows on every legal page -->
    <section class="max-w-5xl mx-auto px-5 sm:px-8 mt-16 sm:mt-20 pb-4">
      <div class="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 sm:p-10">
        <div
          aria-hidden="true"
          class="absolute top-[-30%] right-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-blue-200/50 to-purple-200/40 blur-3xl"
        />
        <div class="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
          <div class="flex-1">
            <h3 class="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Still have questions?
            </h3>
            <p class="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">
              Privacy, cookies, terms, KVKK or GDPR — open an issue on GitHub and we'll respond.
            </p>
          </div>
          <UButton
            :to="`${GH_URL}/issues`"
            target="_blank"
            size="lg"
            icon="i-lucide-github"
            trailing-icon="i-lucide-arrow-up-right"
          >
            Open an issue
          </UButton>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-gray-200 mt-20">
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
          <button
            type="button"
            class="hover:text-gray-900 cursor-pointer"
            @click="openSettings"
          >
            Cookie settings
          </button>
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
        </div>
      </div>
    </footer>
  </div>
</template>
