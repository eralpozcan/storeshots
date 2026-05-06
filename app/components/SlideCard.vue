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

const emit = defineEmits<{
  export: []
  edit: []
  // null payload = reset to default
  position: [value: { dx: number, dy: number } | null]
}>()

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

// Adjust-position mode — overlays a drag surface so the user can fine-tune
// caption placement. Pointer deltas are divided by the preview scale to
// produce canvas-pixel offsets that survive into the export.
const adjustMode = ref(false)
const tempPos = ref<{ dx: number, dy: number }>({ dx: 0, dy: 0 })
const drag = { startX: 0, startY: 0, origDx: 0, origDy: 0, active: false }

function startAdjust() {
  const cur = props.cfg.copy[props.index]?.position
  tempPos.value = { dx: cur?.dx ?? 0, dy: cur?.dy ?? 0 }
  adjustMode.value = true
}

function onPointerDown(e: PointerEvent) {
  drag.startX = e.clientX
  drag.startY = e.clientY
  drag.origDx = tempPos.value.dx
  drag.origDy = tempPos.value.dy
  drag.active = true
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  e.preventDefault()
}

function onPointerMove(e: PointerEvent) {
  if (!drag.active) return
  const sc = scale.value || 0.15
  tempPos.value = {
    dx: drag.origDx + (e.clientX - drag.startX) / sc,
    dy: drag.origDy + (e.clientY - drag.startY) / sc,
  }
}

function onPointerUp(e: PointerEvent) {
  drag.active = false
  try { (e.currentTarget as Element).releasePointerCapture(e.pointerId) }
  catch { /* noop */ }
}

function saveAdjust() {
  emit('position', { ...tempPos.value })
  adjustMode.value = false
}

function resetAdjust() {
  tempPos.value = { dx: 0, dy: 0 }
  emit('position', null)
  adjustMode.value = false
}

function cancelAdjust() {
  adjustMode.value = false
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      ref="cardRef"
      class="group w-full relative overflow-hidden rounded-xl shadow-lg transition-transform duration-150 hover:shadow-2xl"
      :class="adjustMode ? 'ring-2 ring-blue-500 ring-offset-2' : ''"
      :style="{ aspectRatio: `${cW}/${cH}` }"
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
          :position-override="adjustMode ? tempPos : null"
        />
      </div>

      <!-- Hover overlay actions -->
      <button
        v-if="!adjustMode"
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
        v-if="!adjustMode"
        type="button"
        class="absolute top-2 left-12 size-8 rounded-full bg-white/90 backdrop-blur shadow-md text-gray-700 hover:text-blue-600 hover:bg-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center z-10"
        title="Adjust caption position"
        aria-label="Adjust caption position"
        @click.stop="startAdjust"
      >
        <UIcon
          name="i-lucide-move"
          class="size-4"
        />
      </button>
      <button
        v-if="!adjustMode"
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

      <!-- Adjust mode: drag surface + toolbar -->
      <div
        v-if="adjustMode"
        class="absolute inset-0 cursor-move z-20 select-none"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      />
      <div
        v-if="adjustMode"
        class="absolute top-2 left-2 right-2 z-30 px-2.5 py-1.5 rounded-md bg-blue-600 text-white text-[11px] font-semibold shadow-md flex items-center gap-1.5 pointer-events-none"
      >
        <UIcon
          name="i-lucide-move"
          class="size-3.5"
        />
        Drag the slide to reposition the caption
      </div>
      <div
        v-if="adjustMode"
        class="absolute bottom-2 left-2 right-2 z-30 flex items-center justify-between gap-1"
      >
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          @click.stop="cancelAdjust"
        >
          Cancel
        </UButton>
        <div class="flex gap-1">
          <UButton
            size="xs"
            color="error"
            variant="ghost"
            title="Restore default position"
            @click.stop="resetAdjust"
          >
            Reset
          </UButton>
          <UButton
            size="xs"
            @click.stop="saveAdjust"
          >
            Save
          </UButton>
        </div>
      </div>
    </div>
    <div class="text-center text-[11px] text-gray-500">
      {{ String(index + 1).padStart(2, '0') }} · {{ label }}
    </div>
  </div>
</template>
