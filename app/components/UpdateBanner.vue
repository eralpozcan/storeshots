<script setup lang="ts">
const { updateAvailable, reload } = useUpdateAvailable()
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="-translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="-translate-y-full opacity-0"
  >
    <div
      v-if="updateAvailable"
      role="status"
      aria-live="polite"
      class="fixed top-0 inset-x-0 z-[110] flex justify-center pointer-events-none px-3 pt-3"
    >
      <div class="pointer-events-auto flex items-center gap-3 rounded-full border border-blue-200 bg-blue-50 text-blue-900 shadow-md shadow-blue-900/5 px-4 py-2">
        <UIcon
          name="i-lucide-refresh-cw"
          class="size-4 shrink-0"
        />
        <span class="text-sm">A new version of Storeshots is available.</span>
        <UButton
          size="xs"
          color="primary"
          @click="reload"
        >
          Refresh
        </UButton>
      </div>
    </div>
  </Transition>
</template>
