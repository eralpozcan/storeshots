<script setup lang="ts">
import type { SlideElement, DeviceElement, CaptionElement } from '~/utils/types'
import type { DeviceFrame } from '~/utils/canvas'
import { DEVICE_WIDTH_FNS } from '~/utils/canvas'
import { anchorSides, anchorTransform, combineTransform, dragDeltaToPatch } from '~/utils/anchor'

// Interactive transform layer rendered above SlideTemplate in focused mode.
// Supports:
//   - move (drag element body)
//   - resize devices via 4 corner handles (aspect-locked; height derived
//     from the device frame ratio)
//   - resize captions via E/W edge handles (horizontal only; height is
//     auto-sized by the caption's text content)
//
// All drag types emit element-change with a partial patch. The element grows
// FROM its anchor point — we don't migrate the anchor mid-drag, which keeps
// the math simple and the visual behavior predictable for the variant layouts
// (e.g. a bc-anchored device grows upward; a tr-anchored device grows
// inward). A future "free transform" mode could swap anchor on the fly.

const props = defineProps<{
  elements: SlideElement[]
  cW: number
  cH: number
  deviceFrame: DeviceFrame
}>()

const emit = defineEmits<{
  'element-change': [payload: { id: string, patch: Partial<SlideElement> }]
}>()

type DraggableElement = DeviceElement | CaptionElement
const draggableElements = computed(() => props.elements.filter((e): e is DraggableElement => e.type === 'device' || e.type === 'caption'))

// Width resolution — matches SlideElementRenderer so the hit area sits over
// the rendered element exactly.
function deviceWidthPct(el: DeviceElement): number {
  if (el.widthPct !== undefined) return el.widthPct
  const fns = DEVICE_WIDTH_FNS[props.deviceFrame]
  const base = (el.widthRole === 'secondary' ? fns.secondary : fns.primary)(props.cW, props.cH) * 100
  return el.widthMul !== undefined ? base * el.widthMul : base
}

function deviceHeightPct(el: DeviceElement): number {
  const fns = DEVICE_WIDTH_FNS[props.deviceFrame]
  const widthPct = deviceWidthPct(el)
  return (widthPct / 100) * props.cW / fns.ratio / props.cH * 100
}

const CAPTION_HEIGHT_PCT = 14

function widthPctOf(el: DraggableElement): number {
  return el.type === 'device' ? deviceWidthPct(el) : (el.widthPct ?? 80)
}

function heightPctOf(el: DraggableElement): number {
  return el.type === 'device' ? deviceHeightPct(el) : CAPTION_HEIGHT_PCT
}

// Resize bounds. Devices can shrink to a thumb-sized icon or balloon to 1.5×
// the canvas (over-edge layouts use this); captions stay in a more
// conservative range because tiny text is unreadable and wide text wraps oddly.
const DEVICE_MIN_W = 10
const DEVICE_MAX_W = 150
const CAPTION_MIN_W = 20
const CAPTION_MAX_W = 100

function clampWidth(el: DraggableElement, w: number): number {
  if (el.type === 'device') return Math.max(DEVICE_MIN_W, Math.min(DEVICE_MAX_W, w))
  return Math.max(CAPTION_MIN_W, Math.min(CAPTION_MAX_W, w))
}

// What handles a given element exposes. Devices get corners (aspect-locked),
// captions get horizontal edges only.
const DEVICE_HANDLES = ['nw', 'ne', 'se', 'sw'] as const
const CAPTION_HANDLES = ['w', 'e'] as const
type HandleId = (typeof DEVICE_HANDLES)[number] | (typeof CAPTION_HANDLES)[number]

function handlesFor(el: DraggableElement): readonly HandleId[] {
  return el.type === 'device' ? DEVICE_HANDLES : CAPTION_HANDLES
}

// Drag state — one active interaction at a time (move OR resize).
type DragState =
  | { mode: 'move', id: string, startX: number, startY: number, origX: number, origY: number, anchor: SlideElement['anchor'] }
  | { mode: 'resize', id: string, handle: HandleId, startX: number, startY: number, origWidthPct: number }
const drag = ref<DragState | null>(null)

// Per-element live preview — applied on top of the element's saved values
// while a drag is in flight, then cleared on commit/cancel.
const livePatch = ref<{ id: string, dx: number, dy: number, widthDelta: number } | null>(null)

function appliedX(el: DraggableElement): number {
  return drag.value?.mode === 'move' && livePatch.value?.id === el.id ? el.x + livePatch.value.dx : el.x
}
function appliedY(el: DraggableElement): number {
  return drag.value?.mode === 'move' && livePatch.value?.id === el.id ? el.y + livePatch.value.dy : el.y
}
function appliedWidthPct(el: DraggableElement): number {
  const base = widthPctOf(el)
  if (drag.value?.mode === 'resize' && livePatch.value?.id === el.id) {
    return clampWidth(el, base + livePatch.value.widthDelta)
  }
  return base
}
function appliedHeightPct(el: DraggableElement): number {
  if (el.type !== 'device') return heightPctOf(el)
  const fns = DEVICE_WIDTH_FNS[props.deviceFrame]
  const w = appliedWidthPct(el)
  return (w / 100) * props.cW / fns.ratio / props.cH * 100
}

function styleFor(el: DraggableElement) {
  const x = appliedX(el)
  const y = appliedY(el)
  const transform = combineTransform([
    anchorTransform(el.anchor),
    el.rotate !== undefined ? `rotate(${el.rotate}deg)` : undefined,
  ])
  return {
    position: 'absolute' as const,
    ...anchorSides(el.anchor, x, y),
    width: `${appliedWidthPct(el)}%`,
    height: `${appliedHeightPct(el)}%`,
    transform,
    cursor: drag.value?.mode === 'move' && drag.value.id === el.id ? 'grabbing' : 'grab',
    zIndex: String(el.zIndex + 100),
  }
}

// Handle visual styles — small dots at corners/edges, cursor reflects the
// resize direction the handle implies.
const HANDLE_CURSORS: Record<HandleId, string> = {
  nw: 'nwse-resize', se: 'nwse-resize',
  ne: 'nesw-resize', sw: 'nesw-resize',
  e: 'ew-resize', w: 'ew-resize',
}

function handlePosition(handle: HandleId): { left?: string, right?: string, top?: string, bottom?: string, transform: string } {
  // Returns absolute placement on the element. Each handle sits on the
  // element's bounding box; translate centers the dot on the corner/edge.
  switch (handle) {
    case 'nw': return { left: '0', top: '0', transform: 'translate(-50%, -50%)' }
    case 'ne': return { right: '0', top: '0', transform: 'translate(50%, -50%)' }
    case 'se': return { right: '0', bottom: '0', transform: 'translate(50%, 50%)' }
    case 'sw': return { left: '0', bottom: '0', transform: 'translate(-50%, 50%)' }
    case 'e':  return { right: '0', top: '50%', transform: 'translate(50%, -50%)' }
    case 'w':  return { left: '0', top: '50%', transform: 'translate(-50%, -50%)' }
  }
}

function onMovePointerDown(e: PointerEvent, el: DraggableElement) {
  drag.value = {
    mode: 'move', id: el.id,
    startX: e.clientX, startY: e.clientY,
    origX: el.x, origY: el.y, anchor: el.anchor,
  }
  livePatch.value = { id: el.id, dx: 0, dy: 0, widthDelta: 0 }
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  e.preventDefault()
}

function onResizePointerDown(e: PointerEvent, el: DraggableElement, handle: HandleId) {
  drag.value = {
    mode: 'resize', id: el.id, handle,
    startX: e.clientX, startY: e.clientY,
    origWidthPct: widthPctOf(el),
  }
  livePatch.value = { id: el.id, dx: 0, dy: 0, widthDelta: 0 }
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  e.stopPropagation()
  e.preventDefault()
}

// Direction multipliers — each handle's "grow direction" in screen space.
// Dragging a NE handle to the upper-right grows the element. The dot product
// of (dx, dy) with this vector gives a signed grow amount.
const HANDLE_GROW: Record<HandleId, { sx: number, sy: number }> = {
  nw: { sx: -1, sy: -1 }, ne: { sx: 1, sy: -1 },
  se: { sx: 1, sy: 1 },   sw: { sx: -1, sy: 1 },
  e: { sx: 1, sy: 0 },    w: { sx: -1, sy: 0 },
}

function onPointerMove(e: PointerEvent) {
  if (!drag.value) return
  const overlay = (e.currentTarget as HTMLElement)
  const rect = overlay.getBoundingClientRect()
  const dxScreen = e.clientX - drag.value.startX
  const dyScreen = e.clientY - drag.value.startY

  if (drag.value.mode === 'move') {
    const { dx, dy } = dragDeltaToPatch(drag.value.anchor, dxScreen, dyScreen, rect.width, rect.height)
    livePatch.value = { id: drag.value.id, dx, dy, widthDelta: 0 }
  }
  else {
    const grow = HANDLE_GROW[drag.value.handle]
    // Project drag onto the grow axis and convert to canvas-width %.
    // Diagonal handles use a half-and-half combine so they feel uniform.
    const screenGrow = grow.sy === 0
      ? dxScreen * grow.sx
      : (dxScreen * grow.sx + dyScreen * grow.sy) / 2
    const widthDeltaPct = (screenGrow / rect.width) * 100 * 2 // ×2: handle on edge, but grow happens from anchor; double for parity with cursor distance
    livePatch.value = { id: drag.value.id, dx: 0, dy: 0, widthDelta: widthDeltaPct }
  }
}

function onPointerUp(e: PointerEvent) {
  if (!drag.value) return
  const live = livePatch.value
  if (live) {
    if (drag.value.mode === 'move' && (live.dx !== 0 || live.dy !== 0)) {
      const el = draggableElements.value.find(x => x.id === drag.value!.id)
      if (el) {
        emit('element-change', {
          id: drag.value.id,
          patch: { x: el.x + live.dx, y: el.y + live.dy },
        })
      }
    }
    else if (drag.value.mode === 'resize' && live.widthDelta !== 0) {
      const el = draggableElements.value.find(x => x.id === drag.value!.id)
      if (el) {
        const next = clampWidth(el, drag.value.origWidthPct + live.widthDelta)
        emit('element-change', { id: drag.value.id, patch: { widthPct: next } })
      }
    }
  }
  try { (e.currentTarget as Element).releasePointerCapture(e.pointerId) }
  catch { /* noop */ }
  drag.value = null
  livePatch.value = null
}

function hintLabel(el: DraggableElement): string {
  if (drag.value?.id === el.id) {
    return drag.value.mode === 'move' ? '✋ Drop to place' : `↔ ${Math.round(appliedWidthPct(el))}%`
  }
  return '✥ Drag to move · grab a corner to resize'
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
      @pointerdown="onMovePointerDown($event, el)"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!-- Resize handles — corners (devices) or edges (captions). Stop the
           pointerdown from reaching the move surface so a corner grab starts
           a resize, not a move. -->
      <div
        v-for="h in handlesFor(el)"
        :key="`${el.id}-${h}`"
        :style="{
          position: 'absolute',
          width: '48px', height: '48px',
          background: drag?.id === el.id && drag.mode === 'resize' && drag.handle === h
            ? '#1d4ed8' : '#2563eb',
          border: '6px solid white',
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          cursor: HANDLE_CURSORS[h],
          ...handlePosition(h),
        }"
        class="opacity-0 group-hover/handle:opacity-100 transition-opacity"
        :class="drag?.id === el.id ? '!opacity-100' : ''"
        @pointerdown.stop="onResizePointerDown($event, el, h)"
        @pointermove.stop="onPointerMove"
        @pointerup.stop="onPointerUp"
        @pointercancel.stop="onPointerUp"
      />

      <!-- Hover hint sized in canvas pixels (overlay is inside the scaled
           SlideCard wrapper, so utility classes would shrink too small). -->
      <div
        :style="{
          position: 'absolute',
          left: '50%', top: '8px',
          transform: 'translateX(-50%)',
          padding: '20px 40px',
          borderRadius: '24px',
          background: '#2563eb',
          color: 'white',
          fontSize: '52px',
          fontWeight: '700',
          lineHeight: '1',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap',
        }"
        class="pointer-events-none opacity-0 group-hover/handle:opacity-100 transition-opacity"
        :class="drag?.id === el.id ? '!opacity-100' : ''"
      >
        {{ hintLabel(el) }}
      </div>
    </div>
  </div>
</template>
