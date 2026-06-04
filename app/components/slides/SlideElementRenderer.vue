<script setup lang="ts">
import type { SlideElement, ElementShadow, SlideConfig, BrandColors } from '~/utils/types'
import type { DeviceFrame } from '~/utils/canvas'
import { DEVICE_WIDTH_FNS } from '~/utils/canvas'
import { PLACEHOLDER_IMG } from '~/utils/defaults'
import { anchorSides, anchorTransform, combineTransform } from '~/utils/anchor'

const props = defineProps<{
  element: SlideElement
  cfg: SlideConfig
  cW: number
  cH: number
  deviceFrame: DeviceFrame
  textColor: string
  // The slide's index in cfg.copy. Captions render copy[slideIdx]; this lets
  // the same caption element be reused across slides without per-slide copies.
  slideIdx: number
  // Caption fine-tune offset from the existing adjust-position mode. Only
  // applied when the element is a caption.
  captionTranslate?: string
}>()

function imgSrc(v: string | null | undefined) { return v || PLACEHOLDER_IMG }

function resolveShadowColor(s: ElementShadow, c: BrandColors): string {
  const base = s.color === 'primary' ? c.primary : s.color === 'accent' ? c.accent : '#000000'
  const a = Math.round(Math.max(0, Math.min(1, s.alpha)) * 255)
    .toString(16).padStart(2, '0').toUpperCase()
  return `${base}${a}`
}

function shadowCss(s: ElementShadow | undefined, c: BrandColors): string | undefined {
  if (!s) return undefined
  const y = s.y ?? 40
  const blur = s.blur ?? 80
  return `drop-shadow(0 ${y}px ${blur}px ${resolveShadowColor(s, c)})`
}

const positionStyle = computed(() => {
  const el = props.element
  return {
    position: 'absolute' as const,
    ...anchorSides(el.anchor, el.x, el.y),
    zIndex: String(el.zIndex),
    opacity: el.opacity !== undefined ? String(el.opacity) : undefined,
  }
})

const transformStyle = computed(() => {
  const el = props.element
  const anchorT = anchorTransform(el.anchor)
  const rotateT = el.rotate !== undefined ? `rotate(${el.rotate}deg)` : undefined
  const captionT = el.type === 'caption' ? props.captionTranslate : undefined
  return combineTransform([anchorT, rotateT, captionT])
})

// Device-specific sizing.
const deviceWidthPct = computed(() => {
  if (props.element.type !== 'device') return undefined
  const fns = DEVICE_WIDTH_FNS[props.deviceFrame]
  if (props.element.widthPct !== undefined) return props.element.widthPct
  const base = (props.element.widthRole === 'secondary' ? fns.secondary : fns.primary)(props.cW, props.cH) * 100
  return props.element.widthMul !== undefined ? base * props.element.widthMul : base
})

const deviceFilter = computed(() => {
  if (props.element.type !== 'device') return undefined
  return shadowCss(props.element.shadow, props.cfg.colors)
})
</script>

<template>
  <!-- DEVICE -->
  <DeviceFrames
    v-if="element.type === 'device'"
    :type="deviceFrame"
    :src="imgSrc(cfg.images[element.imageIdx])"
    :alt="`Screen ${element.imageIdx + 1}`"
    :style="{
      ...positionStyle,
      width: `${deviceWidthPct}%`,
      transform: transformStyle,
      filter: deviceFilter,
    }"
  />

  <!-- CAPTION -->
  <div
    v-else-if="element.type === 'caption'"
    :style="{
      ...positionStyle,
      width: element.widthPct !== undefined ? `${element.widthPct}%` : undefined,
      transform: transformStyle,
    }"
  >
    <SlideCaption
      :label="cfg.copy[slideIdx]?.label ?? ''"
      :headline="cfg.copy[slideIdx]?.headline ?? ''"
      :text-color="textColor"
      :label-color="cfg.colors.accent"
      :c-w="cW"
      :font-family="cfg.fontFamily"
    />
  </div>

  <!-- ICON -->
  <img
    v-else-if="element.type === 'icon' && cfg.appIcon"
    :src="cfg.appIcon"
    :alt="cfg.appName"
    :style="{
      ...positionStyle,
      width: `${cW * element.sizePct / 100}px`,
      height: `${cW * element.sizePct / 100}px`,
      borderRadius: `${cW * 0.038}px`,
      boxShadow: `0 24px 70px ${cfg.colors.primary}88`,
      transform: transformStyle,
    }"
    draggable="false"
  >

  <!-- BLOB (deferred — kept in SlideTemplate background for now, this branch
       exists so future Phase 2d can promote blobs without renderer changes) -->
  <div
    v-else-if="element.type === 'blob'"
    :style="{
      ...positionStyle,
      width: `${element.widthPct}%`,
      height: `${element.heightPct}%`,
      borderRadius: '50%',
      background: element.color === 'primary' ? cfg.colors.primary : cfg.colors.accent,
      opacity: String(element.blobOpacity),
      filter: 'blur(80px)',
      transform: transformStyle,
    }"
  />
</template>
