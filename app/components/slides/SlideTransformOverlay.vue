<script setup lang="ts">
import type { SlideElement, DeviceElement, CaptionElement, Anchor } from '~/utils/types'
import type { DeviceFrame } from '~/utils/canvas'
import { DEVICE_WIDTH_FNS } from '~/utils/canvas'
import { anchorSides, anchorTransform, combineTransform, dragDeltaToPatch } from '~/utils/anchor'

// Interactive transform layer rendered above SlideTemplate in focused mode.
// Supports:
//   - move (drag element body)
//   - resize devices via 4 corner handles (aspect-locked; height derived
//     from the device frame ratio)
//   - resize captions via E/W edge handles (horizontal only)
//
// Resize uses Figma-style behavior: the OPPOSITE corner/edge of the grabbed
// handle stays fixed while the grabbed end follows the cursor. Achieved by
// migrating the element's anchor to the opposite corner on pointerdown and
// then letting widthPct grow outward from the new anchor.

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

// Template ref to the overlay container — its rect IS the canvas's rendered
// pixel size, which is what we need to convert screen-px drag deltas into
// canvas-% patches. Using e.currentTarget for this returned the handle's
// rect (48×48) instead and made every interaction feel ~10× too sensitive.
const overlayEl = ref<HTMLDivElement>()
function canvasRect(): { width: number, height: number } {
  const r = overlayEl.value?.getBoundingClientRect()
  return { width: r?.width ?? props.cW, height: r?.height ?? props.cH }
}

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

// Resize bounds.
const DEVICE_MIN_W = 10
const DEVICE_MAX_W = 150
const CAPTION_MIN_W = 20
const CAPTION_MAX_W = 100

function clampWidth(el: DraggableElement, w: number): number {
  if (el.type === 'device') return Math.max(DEVICE_MIN_W, Math.min(DEVICE_MAX_W, w))
  return Math.max(CAPTION_MIN_W, Math.min(CAPTION_MAX_W, w))
}

const DEVICE_HANDLES = ['nw', 'ne', 'se', 'sw'] as const
const CAPTION_HANDLES = ['w', 'e'] as const
type HandleId = (typeof DEVICE_HANDLES)[number] | (typeof CAPTION_HANDLES)[number]

function handlesFor(el: DraggableElement): readonly HandleId[] {
  return el.type === 'device' ? DEVICE_HANDLES : CAPTION_HANDLES
}

// Anchor of the corner OPPOSITE the grabbed handle. The element's anchor is
// migrated to this point on resize start, after which "grow outward from
// anchor" naturally implements the Figma-style "opposite corner stays" rule.
// Edge handles (E/W) for captions migrate horizontally only — caption y/anchor
// vertical component is preserved by reusing the element's current vertical
// anchor component.
function oppositeAnchorFor(el: DraggableElement, handle: HandleId): Anchor {
  if (el.type === 'device') {
    switch (handle) {
      case 'nw': return 'br'
      case 'ne': return 'bl'
      case 'se': return 'tl'
      case 'sw': return 'tr'
    }
  }
  // Caption: keep existing vertical anchor component, flip horizontal.
  const vert = el.anchor.startsWith('t') ? 't' : el.anchor.startsWith('b') ? 'b' : 'c'
  const newHoriz = handle === 'w' ? 'r' : 'l'
  // 'cr' / 'cl' replaces 'c' alone if vert is center.
  return (vert === 'c' ? `c${newHoriz}` : `${vert}${newHoriz}`) as Anchor
}

// Convert an element's (anchor, x, y, width, height) into absolute corner
// positions in canvas % from the top-left. We need this to compute where the
// "opposite corner" sits in absolute terms so we can re-anchor without
// visually moving the element.
function absoluteBox(el: DraggableElement): { left: number, top: number, width: number, height: number } {
  const w = widthPctOf(el)
  const h = heightPctOf(el)
  // x → left (or right, depending on anchor's horizontal letter).
  let left: number
  if (el.anchor.endsWith('l') || el.anchor === 'c' || el.anchor === 'tc' || el.anchor === 'bc') {
    if (el.anchor === 'tc' || el.anchor === 'bc' || el.anchor === 'c') {
      // Centered anchors: x is the element's CENTER from the left.
      left = el.x - w / 2
    }
    else {
      // Left-aligned anchors ('tl', 'bl', 'cl'): x is the element's LEFT edge.
      left = el.x
    }
  }
  else {
    // Right-aligned anchors: x is from the right edge.
    left = 100 - el.x - w
  }
  let top: number
  if (el.anchor.startsWith('t')) {
    top = el.y
  }
  else if (el.anchor.startsWith('b')) {
    top = 100 - el.y - h
  }
  else {
    // Vertical-center anchors: y is element CENTER from the top.
    top = el.y - h / 2
  }
  return { left, top, width: w, height: h }
}

// Given an absolute box + target anchor, compute the (x, y) that re-anchors
// the element to that corner without visually moving it. Inverse of
// absoluteBox for a chosen anchor.
function xyForAnchor(box: { left: number, top: number, width: number, height: number }, anchor: Anchor): { x: number, y: number } {
  const { left, top, width, height } = box
  let x: number, y: number
  if (anchor.endsWith('l') || anchor === 'tc' || anchor === 'bc' || anchor === 'c') {
    x = (anchor === 'tc' || anchor === 'bc' || anchor === 'c') ? left + width / 2 : left
  }
  else {
    x = 100 - left - width
  }
  if (anchor.startsWith('t')) y = top
  else if (anchor.startsWith('b')) y = 100 - top - height
  else y = top + height / 2
  return { x, y }
}

// Drag state — one active interaction at a time. Resize carries a snapshot
// of the migrated anchor + x/y so onPointerMove can layer width changes on
// top during the drag without re-emitting the anchor every move. Rotate
// stores the element's center (in screen px) and the starting angle so
// motion translates directly into delta-degrees.
type DragState =
  | { mode: 'move', id: string, startX: number, startY: number, origX: number, origY: number, anchor: Anchor }
  | { mode: 'resize', id: string, handle: HandleId, startX: number, startY: number, origWidthPct: number,
      migrated: { anchor: Anchor, x: number, y: number } }
  | { mode: 'rotate', id: string, centerScreenX: number, centerScreenY: number,
      origRotate: number, startAngleDeg: number }
const drag = ref<DragState | null>(null)

// Per-element live preview applied on top of saved values while a drag is
// in flight. For resize, also tracks the migrated anchor so the rendered
// hit area uses it. For rotate, tracks the active rotation in degrees.
const livePatch = ref<{
  id: string, dx: number, dy: number, widthDelta: number,
  anchor?: Anchor, anchorX?: number, anchorY?: number,
  rotate?: number,
} | null>(null)

function activeAnchor(el: DraggableElement): Anchor {
  if (livePatch.value?.id === el.id && livePatch.value.anchor) return livePatch.value.anchor
  return el.anchor
}
function activeX(el: DraggableElement): number {
  if (livePatch.value?.id === el.id) {
    if (livePatch.value.anchorX !== undefined) return livePatch.value.anchorX
    if (drag.value?.mode === 'move') return el.x + livePatch.value.dx
  }
  return el.x
}
function activeY(el: DraggableElement): number {
  if (livePatch.value?.id === el.id) {
    if (livePatch.value.anchorY !== undefined) return livePatch.value.anchorY
    if (drag.value?.mode === 'move') return el.y + livePatch.value.dy
  }
  return el.y
}
function activeWidthPct(el: DraggableElement): number {
  const base = drag.value?.mode === 'resize' && livePatch.value?.id === el.id
    ? drag.value.origWidthPct
    : widthPctOf(el)
  if (drag.value?.mode === 'resize' && livePatch.value?.id === el.id) {
    return clampWidth(el, base + livePatch.value.widthDelta)
  }
  return base
}
function activeHeightPct(el: DraggableElement): number {
  if (el.type !== 'device') return heightPctOf(el)
  const fns = DEVICE_WIDTH_FNS[props.deviceFrame]
  const w = activeWidthPct(el)
  return (w / 100) * props.cW / fns.ratio / props.cH * 100
}

function activeRotate(el: DraggableElement): number | undefined {
  if (livePatch.value?.id === el.id && livePatch.value.rotate !== undefined) return livePatch.value.rotate
  return el.rotate
}

function styleFor(el: DraggableElement) {
  const anchor = activeAnchor(el)
  const x = activeX(el)
  const y = activeY(el)
  const rot = activeRotate(el)
  const transform = combineTransform([
    anchorTransform(anchor),
    rot !== undefined ? `rotate(${rot}deg)` : undefined,
  ])
  return {
    position: 'absolute' as const,
    ...anchorSides(anchor, x, y),
    width: `${activeWidthPct(el)}%`,
    height: `${activeHeightPct(el)}%`,
    transform,
    cursor: drag.value?.mode === 'move' && drag.value.id === el.id ? 'grabbing' : 'grab',
    zIndex: String(el.zIndex + 100),
  }
}

const HANDLE_CURSORS: Record<HandleId, string> = {
  nw: 'nwse-resize', se: 'nwse-resize',
  ne: 'nesw-resize', sw: 'nesw-resize',
  e: 'ew-resize', w: 'ew-resize',
}

function handlePosition(handle: HandleId) {
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

// Element center in screen pixels (for rotate angle math). Built from the
// canvas rect + the element's absolute box in canvas %.
function elementCenterScreen(el: DraggableElement): { x: number, y: number } {
  const box = absoluteBox(el)
  const rect = overlayEl.value?.getBoundingClientRect() ?? { left: 0, top: 0, width: props.cW, height: props.cH }
  const cxPct = box.left + box.width / 2
  const cyPct = box.top + box.height / 2
  return {
    x: rect.left + (cxPct / 100) * rect.width,
    y: rect.top + (cyPct / 100) * rect.height,
  }
}

function angleDeg(fromX: number, fromY: number, toX: number, toY: number): number {
  return Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI)
}

function onRotatePointerDown(e: PointerEvent, el: DraggableElement) {
  const center = elementCenterScreen(el)
  const startAngle = angleDeg(center.x, center.y, e.clientX, e.clientY)
  drag.value = {
    mode: 'rotate', id: el.id,
    centerScreenX: center.x, centerScreenY: center.y,
    origRotate: el.rotate ?? 0,
    startAngleDeg: startAngle,
  }
  livePatch.value = { id: el.id, dx: 0, dy: 0, widthDelta: 0, rotate: el.rotate ?? 0 }
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  e.stopPropagation()
  e.preventDefault()
}

function onResizePointerDown(e: PointerEvent, el: DraggableElement, handle: HandleId) {
  // Re-anchor to the opposite corner so the element grows outward from the
  // fixed side. xyForAnchor preserves the element's visual position; the
  // resize itself just modifies width from here on.
  const box = absoluteBox(el)
  const newAnchor = oppositeAnchorFor(el, handle)
  const { x: newX, y: newY } = xyForAnchor(box, newAnchor)

  drag.value = {
    mode: 'resize', id: el.id, handle,
    startX: e.clientX, startY: e.clientY,
    origWidthPct: widthPctOf(el),
    migrated: { anchor: newAnchor, x: newX, y: newY },
  }
  livePatch.value = {
    id: el.id, dx: 0, dy: 0, widthDelta: 0,
    anchor: newAnchor, anchorX: newX, anchorY: newY,
  }
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  e.stopPropagation()
  e.preventDefault()
}

// Each handle's "grow direction" in screen space relative to the (now
// re-anchored) element. Dot product of (dx, dy) with this vector gives a
// signed grow amount. Edge handles ignore the y axis.
const HANDLE_GROW: Record<HandleId, { sx: number, sy: number }> = {
  nw: { sx: -1, sy: -1 }, ne: { sx: 1, sy: -1 },
  se: { sx: 1, sy: 1 },   sw: { sx: -1, sy: 1 },
  e: { sx: 1, sy: 0 },    w: { sx: -1, sy: 0 },
}

function onPointerMove(e: PointerEvent) {
  if (!drag.value) return
  const rect = canvasRect()

  if (drag.value.mode === 'move') {
    const dxScreen = e.clientX - drag.value.startX
    const dyScreen = e.clientY - drag.value.startY
    const { dx, dy } = dragDeltaToPatch(drag.value.anchor, dxScreen, dyScreen, rect.width, rect.height)
    livePatch.value = { id: drag.value.id, dx, dy, widthDelta: 0 }
  }
  else if (drag.value.mode === 'rotate') {
    const currentAngle = angleDeg(drag.value.centerScreenX, drag.value.centerScreenY, e.clientX, e.clientY)
    const delta = currentAngle - drag.value.startAngleDeg
    // Snap to 15° increments while shift is held — handy for clean angles.
    let next = drag.value.origRotate + delta
    if (e.shiftKey) next = Math.round(next / 15) * 15
    // Keep rotation in the -180..180 range for readability in localStorage.
    next = ((next + 180) % 360 + 360) % 360 - 180
    livePatch.value = { id: drag.value.id, dx: 0, dy: 0, widthDelta: 0, rotate: next }
  }
  else {
    const dxScreen = e.clientX - drag.value.startX
    const dyScreen = e.clientY - drag.value.startY
    const grow = HANDLE_GROW[drag.value.handle]
    // Project drag onto grow axis. Corners average x+y; edges take x only.
    const screenGrow = grow.sy === 0
      ? dxScreen * grow.sx
      : (dxScreen * grow.sx + dyScreen * grow.sy) / 2
    // Now 1:1 against the actual canvas rect (no compensating multipliers
    // needed) — moving the handle N screen pixels widens the element by
    // N pixels in canvas space.
    const widthDeltaPct = (screenGrow / rect.width) * 100
    livePatch.value = {
      id: drag.value.id, dx: 0, dy: 0, widthDelta: widthDeltaPct,
      anchor: drag.value.migrated.anchor,
      anchorX: drag.value.migrated.x,
      anchorY: drag.value.migrated.y,
    }
  }
}

const POS_MIN = -30
const POS_MAX = 130
function clampPos(v: number): number { return Math.max(POS_MIN, Math.min(POS_MAX, v)) }

function onPointerUp(e: PointerEvent) {
  if (!drag.value) return
  const live = livePatch.value
  if (live) {
    if (drag.value.mode === 'move' && (live.dx !== 0 || live.dy !== 0)) {
      const el = draggableElements.value.find(x => x.id === drag.value!.id)
      if (el) {
        emit('element-change', {
          id: drag.value.id,
          patch: { x: clampPos(el.x + live.dx), y: clampPos(el.y + live.dy) },
        })
      }
    }
    else if (drag.value.mode === 'rotate' && live.rotate !== undefined && live.rotate !== drag.value.origRotate) {
      emit('element-change', {
        id: drag.value.id,
        // Round to a whole degree so persisted JSON stays clean. 0 special-
        // cases as undefined so the override-equality check in
        // useElementOverride can drop it back to the preset.
        patch: { rotate: Math.abs(live.rotate) < 0.5 ? undefined : Math.round(live.rotate) },
      })
    }
    else if (drag.value.mode === 'resize') {
      const el = draggableElements.value.find(x => x.id === drag.value!.id)
      if (el && live.widthDelta !== 0) {
        const next = clampWidth(el, drag.value.origWidthPct + live.widthDelta)
        // Commit width AND the migrated anchor in one patch. The new anchor
        // is the source of truth from now on — subsequent renders use it as
        // a regular preset position.
        emit('element-change', {
          id: drag.value.id,
          patch: {
            widthPct: next,
            anchor: drag.value.migrated.anchor,
            x: drag.value.migrated.x,
            y: drag.value.migrated.y,
          },
        })
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
    if (drag.value.mode === 'move') return '✋ Drop to place'
    if (drag.value.mode === 'rotate') return `⟳ ${Math.round(activeRotate(el) ?? 0)}°`
    return `↔ ${Math.round(activeWidthPct(el))}%`
  }
  return '✥ Drag · ◯ corners resize · ⟳ rotate'
}
</script>

<template>
  <div ref="overlayEl" class="absolute inset-0 pointer-events-none">
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
      <!-- Rotate handle — only on devices, offset above the top edge so it
           doesn't crowd the corner resize handles. Hold Shift while dragging
           to snap to 15° increments for clean angles. -->
      <div
        v-if="el.type === 'device'"
        :style="{
          position: 'absolute',
          left: '50%', top: '0',
          width: '64px', height: '64px',
          transform: 'translate(-50%, -200%)',
          background: drag?.id === el.id && drag.mode === 'rotate' ? '#1d4ed8' : '#2563eb',
          border: '8px solid white',
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          cursor: 'grab',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '38px', fontWeight: '700',
        }"
        class="opacity-0 group-hover/handle:opacity-100 transition-opacity"
        :class="drag?.id === el.id ? '!opacity-100' : ''"
        title="Drag to rotate (hold Shift to snap to 15° steps)"
        @pointerdown.stop="onRotatePointerDown($event, el)"
        @pointermove.stop="onPointerMove"
        @pointerup.stop="onPointerUp"
        @pointercancel.stop="onPointerUp"
      >
        ⟳
      </div>

      <!-- Visual tether between rotate handle and element top, so the
           interaction is legible from a glance. -->
      <div
        v-if="el.type === 'device'"
        :style="{
          position: 'absolute',
          left: '50%', top: '0',
          width: '4px', height: '128px',
          transform: 'translate(-50%, -100%)',
          background: '#2563eb',
          opacity: '0.4',
          pointerEvents: 'none',
        }"
        class="opacity-0 group-hover/handle:!opacity-40 transition-opacity"
      />

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
