<script setup lang="ts">
import type { SlideConfig, SlideElement } from '~/utils/types'
import { VARIANT_PRESETS } from '~/utils/canvas'

const props = defineProps<{
  index: number
  variant: number
  cfg: SlideConfig
  cW: number
  cH: number
  label: string
  deviceFrame: 'iphone' | 'android-phone' | 'android-tablet-p' | 'android-tablet-l' | 'ipad'
  // When true, render the transform overlay (device + caption drag handles)
  // above SlideTemplate. Used by the focused canvas mode.
  transformMode?: boolean
}>()

// Resolve the slide's element list once — shared between SlideTemplate
// (rendering) and SlideTransformOverlay (interaction). Both consume the same
// fallback chain, so passing it explicitly avoids double-resolution.
const elements = computed<SlideElement[]>(() => {
  return props.cfg.copy[props.index]?.elements
    ?? VARIANT_PRESETS[props.variant]
    ?? VARIANT_PRESETS[1]
    ?? []
})

// True when this slide has a screenshot uploaded for the current device.
// The trust slide (variant 10) is intentionally text-only, so it always
// counts as "has content" — only screenshot slides surface the empty state.
const hasContent = computed(() => props.variant === 10 || !!props.cfg.images[props.index])

const emit = defineEmits<{
  export: []
  edit: []
  focus: []
  // Forwarded from SlideTransformOverlay when the user drags an element.
  'element-change': [payload: { id: string, patch: Partial<SlideElement> }]
}>()

const cardRef = ref<HTMLDivElement>()
const scale = ref(0.15)

let ro: ResizeObserver | null = null

onMounted(() => {
  if (!cardRef.value) return
  ro = new ResizeObserver(([e]) => {
    if (!e) return
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
      class="group w-full relative overflow-hidden rounded-xl shadow-lg transition-transform duration-150 hover:shadow-2xl"
      :style="{ aspectRatio: `${cW}/${cH}` }"
    >
      <div
        :style="{
          position: 'absolute', top: 0, left: 0,
          width: `${cW}px`, height: `${cH}px`,
          transform: `scale(${scale})`, transformOrigin: 'top left',
          pointerEvents: transformMode ? undefined : 'none'
        }"
      >
        <SlideTemplate
          :variant="variant"
          :cfg="cfg"
          :c-w="cW"
          :c-h="cH"
          :device-frame="deviceFrame"
        />
        <SlideTransformOverlay
          v-if="transformMode"
          :elements="elements"
          :c-w="cW"
          :c-h="cH"
          :device-frame="deviceFrame"
          @element-change="(p: { id: string, patch: Partial<SlideElement> }) => emit('element-change', p)"
        />
      </div>

      <!-- "No screenshot" badge — surfaces empty slides at a glance. Bulk
           export (Export all / preset ZIP) skips these to avoid shipping
           blank templates; users can still single-export from the card. -->
      <div
        v-if="!hasContent"
        class="absolute bottom-2 left-2 z-10 px-2 py-1 rounded-md bg-amber-100/95 text-amber-700 text-[10px] font-semibold shadow-sm flex items-center gap-1 pointer-events-none"
      >
        <UIcon
          name="i-lucide-image-off"
          class="size-3"
        />
        No screenshot
      </div>

      <!-- Hover overlay actions. Hidden in transform mode — the focused
           header is the single source of edit controls there. -->
      <button
        v-if="!transformMode"
        type="button"
        class="absolute top-2 left-2 size-8 rounded-full bg-white/90 backdrop-blur shadow-md text-gray-700 hover:text-blue-600 hover:bg-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center z-10"
        title="Edit copy"
        aria-label="Edit slide copy"
        @click.stop="emit('edit')"
      >
        <UIcon
          name="i-lucide-pencil"
          class="size-4"
        />
      </button>
      <button
        v-if="!transformMode"
        type="button"
        class="absolute top-2 left-12 size-8 rounded-full bg-white/90 backdrop-blur shadow-md text-gray-700 hover:text-blue-600 hover:bg-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center z-10"
        title="Focus this slide for layout edits"
        aria-label="Focus slide"
        @click.stop="emit('focus')"
      >
        <UIcon
          name="i-lucide-maximize-2"
          class="size-4"
        />
      </button>
      <button
        v-if="!transformMode"
        type="button"
        class="absolute top-2 right-2 size-8 rounded-full bg-white/90 backdrop-blur shadow-md text-gray-700 hover:text-blue-600 hover:bg-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center z-10"
        title="Download this slide as PNG"
        aria-label="Download slide"
        @click.stop="emit('export')"
      >
        <UIcon
          name="i-lucide-download"
          class="size-4"
        />
      </button>
    </div>
    <div class="text-center text-[11px] text-gray-500">
      {{ String(index + 1).padStart(2, '0') }} · {{ label }}
    </div>
  </div>
</template>
