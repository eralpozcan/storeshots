<script setup lang="ts">
import type { SlideConfig } from '~/utils/types'
import type { DeviceFrame } from '~/utils/canvas'
import { VARIANT_PRESETS } from '~/utils/canvas'

const props = defineProps<{
  variant: number // 1-10
  cfg: SlideConfig
  cW: number
  cH: number
  deviceFrame: DeviceFrame
  // Live drag preview from SlideCard's adjust mode. Wins over copy.position.
  positionOverride?: { dx: number, dy: number } | null
}>()

// Each variant maps to a slot in cfg.copy. Variants 1-9 use copy[variant-1];
// variant 10 (trust slide) uses copy[9].
const slideIdx = computed(() => props.variant <= 9 ? props.variant - 1 : 9)

const copy = computed(() => props.cfg.copy[slideIdx.value] ?? { label: '', headline: '' })
const c = computed(() => props.cfg.colors)

// Background presets per slide. Kept inline because backgrounds are
// slide-level (not per-element) and have no planned drag controls.
const lightBgs: Record<number, string> = {
  1: 'linear-gradient(155deg,#EEF4FF 0%,#FFFAF5 55%,#FFF0E4 100%)',
  2: 'linear-gradient(155deg,#F0F7FF 0%,#FFFFFF 55%,#FFF8F2 100%)',
  3: 'linear-gradient(145deg,#FFF6F0 0%,#FFFFFF 50%,#F0F5FF 100%)',
  5: 'linear-gradient(155deg,#FFF4EC 0%,#FFFCF8 50%,#EEF4FF 100%)',
  6: 'linear-gradient(160deg,#F5F9FF 0%,#FFFFFF 50%,#FFF5EE 100%)',
  7: 'linear-gradient(155deg,#FFF8F2 0%,#FFFCF8 55%,#F0F4FF 100%)',
  8: 'linear-gradient(150deg,#F8F4FF 0%,#FFFFFF 55%,#F0F9FF 100%)',
}

const bg = computed(() => {
  const v = props.variant
  if (v === 4 || v === 9) return `linear-gradient(170deg,${c.value.bgFrom} 0%,${c.value.bgTo} 100%)`
  return lightBgs[v] || lightBgs[1]
})

const isDark = computed(() => props.variant === 4 || props.variant === 9 || props.variant === 10)
const textColor = computed(() => isDark.value ? c.value.textLight : c.value.textDark)

// User fine-tune offset applied as an extra transform on the caption element.
const captionTranslate = computed(() => {
  const p = props.positionOverride ?? copy.value.position ?? null
  if (!p || (p.dx === 0 && p.dy === 0)) return undefined
  return `translate(${p.dx}px, ${p.dy}px)`
})

// Element list — prefer per-slide override, else variant preset.
const elements = computed(() => {
  return copy.value.elements ?? VARIANT_PRESETS[props.variant] ?? VARIANT_PRESETS[1] ?? []
})

// Decorative blob params per variant — same math as the original variant
// switch, kept intentionally inline (see VARIANT_PRESETS doc comment).
const blob1Style = computed(() => {
  const v = props.variant
  const evenV = v % 2 === 0
  return {
    width: `${65 + (v % 3) * 10}%`,
    height: `${65 + (v % 3) * 10}%`,
    top: evenV ? '-20%' : '10%',
    [evenV ? 'right' : 'left']: `-${10 + (v % 2) * 8}%`,
  } as Record<string, string>
})

const blob2Style = computed(() => {
  const v = props.variant
  const evenV = v % 2 === 0
  return {
    width: `${50 + (v % 2) * 15}%`,
    height: `${50 + (v % 2) * 15}%`,
    bottom: '-5%',
    [evenV ? 'left' : 'right']: `-${8 + (v % 3) * 2}%`,
  } as Record<string, string>
})

const blob1Color = computed(() => props.variant % 2 === 0 ? c.value.primary : c.value.accent)
const blob1Opacity = computed(() => isDark.value ? 0.18 : (props.variant === 1 ? 0.10 : 0.08 + (props.variant % 3) * 0.02))
const blob2Color = computed(() => props.variant % 2 === 0 ? c.value.accent : c.value.primary)
const blob2Opacity = computed(() => isDark.value ? 0.10 : 0.07 + (props.variant % 4) * 0.02)
</script>

<template>
  <!-- Slide 10 = Trust slide (no device frame, app icon centered) -->
  <div
    v-if="variant === 10"
    :style="{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: `linear-gradient(160deg,${c.bgFrom} 0%,${c.bgTo} 100%)`,
      fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center'
    }"
  >
    <SlideBlob :color="c.primary" :opacity="0.14" :blob-style="{ width: '110%', height: '110%', top: '-35%', left: '-25%' }" />
    <SlideBlob :color="c.accent" :opacity="0.09" :blob-style="{ width: '75%', height: '75%', bottom: '-25%', right: '-15%' }" />
    <img
      v-if="cfg.appIcon"
      :src="cfg.appIcon"
      :alt="cfg.appName"
      :style="{
        width: `${cW * 0.18}px`, height: `${cW * 0.18}px`,
        borderRadius: `${cW * 0.038}px`, marginBottom: `${cH * 0.045}px`,
        boxShadow: `0 24px 70px ${c.primary}88`, position: 'relative', zIndex: 5
      }"
      draggable="false"
    >
    <div :style="{ textAlign: 'center', position: 'relative', zIndex: 5, padding: `0 ${cW * 0.1}px`, transform: captionTranslate }">
      <SlideCaption :label="copy.label" :headline="copy.headline" :text-color="c.textLight" :label-color="c.accent" :c-w="cW" />
    </div>
    <div :style="{ position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%)', width: `${cW * 0.14}px`, height: '3px', background: `linear-gradient(90deg,${c.primary},${c.accent})`, borderRadius: '2px', zIndex: 5 }" />
  </div>

  <!-- Regular slides (1-9): data-driven element list over a variant background -->
  <div
    v-else
    :style="{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: bg, fontFamily: 'Inter,sans-serif'
    }"
  >
    <!-- Decorative blobs (slide-level, not user-controllable in 2a) -->
    <SlideBlob :color="blob1Color" :opacity="blob1Opacity" :blob-style="blob1Style" />
    <SlideBlob :color="blob2Color" :opacity="blob2Opacity" :blob-style="blob2Style" />

    <!-- Element list -->
    <SlideElementRenderer
      v-for="el in elements"
      :key="el.id"
      :element="el"
      :cfg="cfg"
      :c-w="cW"
      :c-h="cH"
      :device-frame="deviceFrame"
      :text-color="textColor"
      :slide-idx="slideIdx"
      :caption-translate="captionTranslate"
    />
  </div>
</template>
