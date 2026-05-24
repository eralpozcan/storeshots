<script setup lang="ts">
import type { SlideElement, DeviceElement, CaptionElement } from '~/utils/types'
import type { DeviceFrame } from '~/utils/canvas'
import { DEVICE_WIDTH_FNS } from '~/utils/canvas'
import { anchorSides, anchorTransform, combineTransform, dragDeltaToPatch } from '~/utils/anchor'

// Interactive transform layer rendered above SlideTemplate in focused mode.
// Hosts per-device drag surfaces; emits element-change with {x, y} patches
// that the editor persists via useElementOverride.
//
// This phase ships MOVE only (corner resize and rotate handles arrive in
// follow-up commits). The surface is sized and positioned to overlap each
// device element exactly so the user grabs the device they see, not an
// invisible hit area that drifts at the corners.

const props = defineProps<{
  elements: SlideElement[]
  cW: number
  cH: number
  deviceFrame: DeviceFrame
}>()

const emit = defineEmits<{
  // Patch is applied to the element with `id`. Caller (editor) writes it via
  // useElementOverride.patchElement so the override-vs-preset bookkeeping
  // stays in one place.
  'element-change': [payload: { id: string, patch: Partial<SlideElement> }]
}>()

// Draggable element types. Device + caption today; icon will join when the
// trust slide gets element-level controls.
type DraggableElement = DeviceElement | CaptionElement
const draggableElements = computed(() => props.elements.filter((e): e is DraggableElement => e.type === 'device' || e.type === 'caption'))

// Width formula resolution — same logic SlideElementRenderer uses so the
// hit-area matches the rendered device exactly.
function deviceWidthPct(el: DeviceElement): number {
  if (el.widthPct !== undefined) return el.widthPct
  const fns = DEVICE_WIDTH_FNS[props.deviceFrame]
  const base = (el.widthRole === 'secondary' ? fns.secondary : fns.primary)(props.cW, props.cH) * 100
  return el.widthMul !== undefined ? base * el.widthMul : base
}

// Inverse of widthFn × MK_RATIO etc. would give us height in canvas %, but
// DeviceFrames render with the device's intrinsic ratio (the `<img>` is
// `width: 100%; height: auto;` inside the frame). For the hit area we
// approximate via the device frame ratio so the surface stays close to the
// visible device shape. Slight mismatch at the very corners is acceptable
// for v1 — the user can still grab the body.
function deviceHeightPct(el: DeviceElement): number {
  const fns = DEVICE_WIDTH_FNS[props.deviceFrame]
  const widthPct = deviceWidthPct(el)
  // widthPct% of cW px → height px = (widthPct/100) * cW / ratio → as % of cH
  return (widthPct / 100) * props.cW / fns.ratio / props.cH * 100
}

// Caption hit area: width from element, height auto-sized to content. Since
// the caption HTML lives in the underlying render layer and we just want a
// drag surface, we approximate height as a fraction of canvas. Tightening
// this later (e.g. measuring the rendered caption) is a polish task.
const CAPTION_HEIGHT_PCT = 14

function sizeFor(el: DraggableElement): { width: string, height: string } {
  if (el.type === 'device') {
    return { width: `${deviceWidthPct(el)}%`, height: `${deviceHeightPct(el)}%` }
  }
  return {
    width: `${el.widthPct ?? 80}%`,
    height: `${CAPTION_HEIGHT_PCT}%`,
  }
}

const drag = ref<{ id: string, startX: number, startY: number, origX: number, origY: number, anchor: SlideElement['anchor'] } | null>(null)

// Live preview offset per element while dragging. Layered over the saved
// position so the surface follows the cursor without yet committing the patch.
const livePatch = ref<{ id: string, dx: number, dy: number } | null>(null)

function styleFor(el: DraggableElement) {
  const live = livePatch.value && livePatch.value.id === el.id ? livePatch.value : null
  const x = live ? el.x + live.dx : el.x
  const y = live ? el.y + live.dy : el.y
  const size = sizeFor(el)
  const transform = combineTransform([
    anchorTransform(el.anchor),
    el.rotate !== undefined ? `rotate(${el.rotate}deg)` : undefined,
  ])
  return {
    position: 'absolute' as const,
    ...anchorSides(el.anchor, x, y),
    ...size,
    transform,
    cursor: drag.value?.id === el.id ? 'grabbing' : 'grab',
    zIndex: String(el.zIndex + 100),
  }
}

function onPointerDown(e: PointerEvent, el: DraggableElement) {
  drag.value = {
    id: el.id, startX: e.clientX, startY: e.clientY,
    origX: el.x, origY: el.y, anchor: el.anchor,
  }
  livePatch.value = { id: el.id, dx: 0, dy: 0 }
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  e.preventDefault()
}

function onPointerMove(e: PointerEvent) {
  if (!drag.value) return
  // Convert screen-space pixel delta into canvas-space %s. We need the
  // overlay's rendered pixel size so the conversion works at any scale
  // (focused mode renders the slide at a different size per viewport).
  const overlay = (e.currentTarget as HTMLElement)
  const rect = overlay.getBoundingClientRect()
  // rect.width is the rendered canvas width in screen pixels; cW is the
  // canvas's internal coordinate width. The two combined cancel out the
  // scale, so dx/dy below is in canvas %s already.
  const dxScreen = e.clientX - drag.value.startX
  const dyScreen = e.clientY - drag.value.startY
  const canvasWidthPx = rect.width
  const canvasHeightPx = rect.height
  const { dx, dy } = dragDeltaToPatch(drag.value.anchor, dxScreen, dyScreen, canvasWidthPx, canvasHeightPx)
  livePatch.value = { id: drag.value.id, dx, dy }
}

function onPointerUp(e: PointerEvent) {
  if (!drag.value) return
  const live = livePatch.value
  if (live && (live.dx !== 0 || live.dy !== 0)) {
    emit('element-change', {
      id: drag.value.id,
      patch: { x: drag.value.origX + live.dx, y: drag.value.origY + live.dy },
    })
  }
  try { (e.currentTarget as Element).releasePointerCapture(e.pointerId) }
  catch { /* noop */ }
  drag.value = null
  livePatch.value = null
}
</script>

<template>
  <div class="absolute inset-0 pointer-events-none">
    <div
      v-for="el in draggableElements"
      :key="el.id"
      class="group/handle pointer-events-auto ring-2 ring-transparent hover:ring-blue-500/80 transition-shadow select-none relative"
      :class="drag?.id === el.id ? '!ring-blue-600 ring-4' : ''"
      :style="styleFor(el)"
      @pointerdown="onPointerDown($event, el)"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!-- Hover hint — appears only when this device frame is hovered or
           being dragged. Anchored to the top of the device so it stays in
           view even when the device peeks out of the canvas bottom. -->
      <!-- Hint sized in canvas pixels — SlideCard scales the whole overlay
           down for display, so we need oversized values to read cleanly at
           typical focused-mode scales (~0.3). -->
      <div
        :style="{
          position: 'absolute',
          left: '50%', top: '8px',
          transform: 'translateX(-50%)',
          padding: '20px 40px',
          borderRadius: '24px',
          background: '#2563eb',
          color: 'white',
          fontSize: '64px',
          fontWeight: '700',
          lineHeight: '1',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap',
        }"
        class="pointer-events-none opacity-0 group-hover/handle:opacity-100 transition-opacity"
        :class="drag?.id === el.id ? '!opacity-100' : ''"
      >
        {{ drag?.id === el.id ? '✋ Drop to place' : '✥ Drag to move' }}
      </div>
    </div>
  </div>
</template>
