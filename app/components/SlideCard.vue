<script setup lang="ts">
import type { SlideConfig } from '~/utils/types'

const props = defineProps<{
  index: number
  variant: number
  cfg: SlideConfig
  cW: number
  cH: number
  label: string
  deviceFrame: 'iphone' | 'android-phone' | 'android-tablet-p' | 'android-tablet-l' | 'ipad'
}>()

const emit = defineEmits<{ export: [] }>()

const cardRef = ref<HTMLDivElement>()
const scale = ref(0.15)

let ro: ResizeObserver | null = null

onMounted(() => {
  if (!cardRef.value) return
  ro = new ResizeObserver(([e]) => {
    scale.value = e.contentRect.width / props.cW
  })
  ro.observe(cardRef.value)
})

onUnmounted(() => ro?.disconnect())
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      ref="cardRef"
      class="w-full relative overflow-hidden rounded-xl cursor-pointer shadow-lg transition-transform duration-150 hover:scale-[1.02] hover:shadow-2xl"
      :style="{ aspectRatio: `${cW}/${cH}` }"
      @click="emit('export')"
      title="Click to export"
    >
      <div
        :style="{
          position: 'absolute', top: 0, left: 0,
          width: `${cW}px`, height: `${cH}px`,
          transform: `scale(${scale})`, transformOrigin: 'top left',
          pointerEvents: 'none'
        }"
      >
        <SlideTemplate
          :variant="variant"
          :cfg="cfg"
          :c-w="cW"
          :c-h="cH"
          :device-frame="deviceFrame"
        />
      </div>
    </div>
    <div class="text-center text-[11px] text-gray-500">
      {{ String(index + 1).padStart(2, '0') }} · {{ label }}
    </div>
  </div>
</template>
