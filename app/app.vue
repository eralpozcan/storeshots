<script setup lang="ts">
const isMobile = ref(false)
const currentUrl = ref('')
const route = useRoute()

// Mobile warning only makes sense on the editor (small screens can't use the design surface).
// Landing + legal pages are responsive and must remain visible on mobile.
const showMobileWarning = computed(() => isMobile.value && route.path.startsWith('/editor'))

onMounted(() => {
  currentUrl.value = window.location.hostname
  const check = () => { isMobile.value = window.innerWidth < 768 }
  check()
  window.addEventListener('resize', check)
  onUnmounted(() => window.removeEventListener('resize', check))
})
</script>

<template>
  <!-- Mobile warning overlay -->
  <Transition name="fade">
    <div
      v-if="showMobileWarning"
      class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-8 text-center"
    >
      <!-- Icon -->
      <div class="mb-6 flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-10 h-10 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
        </svg>
      </div>

      <h1 class="text-2xl font-bold text-gray-900 mb-3">
        Best on desktop 🖥️
      </h1>
      <p class="text-gray-600 text-base leading-relaxed max-w-xs mb-2">
        Storeshots needs a big screen to design your screenshots properly.
      </p>
      <p class="text-gray-500 text-sm">
        Open it on your computer — same URL, waiting for you.
      </p>

      <!-- URL chip -->
      <div class="mt-6 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-blue-100 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4 text-blue-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
        <span class="text-sm font-mono text-blue-600 select-all">{{ currentUrl }}</span>
      </div>
    </div>
  </Transition>

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <ClientOnly>
    <CookieBanner />
  </ClientOnly>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
