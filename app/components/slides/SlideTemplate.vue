<script setup lang="ts">
import type { SlideConfig } from '~/utils/types'
import { PLACEHOLDER_IMG } from '~/utils/defaults'
import { MK_RATIO, phoneW, phoneW2, tabletPW, tabletPW2, tabletLW, ipadW, ipadW2, TAB_P_RATIO, TAB_L_RATIO, IPAD_RATIO } from '~/utils/canvas'

const props = defineProps<{
  variant: number // 1-10
  cfg: SlideConfig
  cW: number
  cH: number
  deviceFrame: 'iphone' | 'android-phone' | 'android-tablet-p' | 'android-tablet-l' | 'ipad'
}>()

function imgSrc(v: string | null | undefined) { return v || PLACEHOLDER_IMG }

const widthFns = computed(() => {
  const d = props.deviceFrame
  if (d === 'android-tablet-p') return { wf: tabletPW, wf2: tabletPW2, ratio: TAB_P_RATIO }
  if (d === 'android-tablet-l') return { wf: tabletLW, wf2: tabletLW, ratio: TAB_L_RATIO }
  if (d === 'ipad') return { wf: ipadW, wf2: ipadW2, ratio: IPAD_RATIO }
  return { wf: phoneW, wf2: phoneW2, ratio: MK_RATIO }
})

const pw = computed(() => widthFns.value.wf(props.cW, props.cH) * 100)
const pw2 = computed(() => widthFns.value.wf2(props.cW, props.cH) * 100)

const copy = computed(() => {
  const idx = props.variant <= 9 ? props.variant - 1 : 9
  return props.cfg.copy[idx] ?? { label: '', headline: '' }
})

const c = computed(() => props.cfg.colors)

// Background presets per slide
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

// Caption position: most are top, slides 3 & 8 are bottom-left
const captionPos = computed(() => {
  if (props.variant === 3 || props.variant === 8) return 'bottom-left'
  return 'top'
})
</script>

<template>
  <!-- Slide 10 = Trust slide (no device frame) -->
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
    <div :style="{ textAlign: 'center', position: 'relative', zIndex: 5, padding: `0 ${cW * 0.1}px` }">
      <SlideCaption :label="copy.label" :headline="copy.headline" :text-color="c.textLight" :label-color="c.accent" :c-w="cW" />
    </div>
    <div :style="{ position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%)', width: `${cW * 0.14}px`, height: '3px', background: `linear-gradient(90deg,${c.primary},${c.accent})`, borderRadius: '2px', zIndex: 5 }" />
  </div>

  <!-- Regular slides with device frame -->
  <div
    v-else
    :style="{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: bg, fontFamily: 'Inter,sans-serif'
    }"
  >
    <!-- Blobs -->
    <SlideBlob
      :color="variant % 2 === 0 ? c.primary : c.accent"
      :opacity="isDark ? 0.18 : (variant === 1 ? 0.10 : 0.08 + (variant % 3) * 0.02)"
      :blob-style="{
        width: `${65 + (variant % 3) * 10}%`, height: `${65 + (variant % 3) * 10}%`,
        top: variant % 2 === 0 ? '-20%' : '10%',
        [variant % 2 === 0 ? 'right' : 'left']: `-${10 + (variant % 2) * 8}%`
      }"
    />
    <SlideBlob
      :color="variant % 2 === 0 ? c.accent : c.primary"
      :opacity="isDark ? 0.10 : 0.07 + (variant % 4) * 0.02"
      :blob-style="{
        width: `${50 + (variant % 2) * 15}%`, height: `${50 + (variant % 2) * 15}%`,
        bottom: '-5%',
        [variant % 2 === 0 ? 'left' : 'right']: `-${8 + (variant % 3) * 2}%`
      }"
    />

    <!-- Caption -->
    <div
      v-if="captionPos === 'top'"
      :style="{ position: 'absolute', top: '6%', left: '10%', right: '10%', zIndex: 10 }"
    >
      <SlideCaption :label="copy.label" :headline="copy.headline" :text-color="textColor" :label-color="c.accent" :c-w="cW" />
    </div>
    <div
      v-else
      :style="{ position: 'absolute', bottom: cH > 2400 ? '10%' : '8%', left: '8%', right: '46%', zIndex: 10 }"
    >
      <SlideCaption :label="copy.label" :headline="copy.headline" :text-color="textColor" :label-color="c.accent" :c-w="cW" />
    </div>

    <!-- Device frame(s) -->
    <!-- Slide 1: single centered bottom -->
    <DeviceFrames
      v-if="variant === 1"
      :type="deviceFrame"
      :src="imgSrc(cfg.images[0])"
      alt="Screen 1"
      :style="{ width: `${pw}%`, left: '50%', bottom: '-4%', transform: 'translateX(-50%)', filter: `drop-shadow(0 40px 80px ${c.primary}44)`, zIndex: '5' }"
    />

    <!-- Slide 2: two phones, bg phone faded left, main right -->
    <template v-if="variant === 2">
      <DeviceFrames
        :type="deviceFrame"
        :src="imgSrc(cfg.images[0])"
        alt=""
        :style="{ width: `${pw2 * 0.82}%`, left: '-5%', bottom: '-3%', transform: 'rotate(-5deg)', opacity: '0.45', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.12))', zIndex: '3' }"
      />
      <DeviceFrames
        :type="deviceFrame"
        :src="imgSrc(cfg.images[1])"
        alt="Screen 2"
        :style="{ width: `${pw2}%`, right: '-3%', bottom: '-3%', filter: `drop-shadow(0 40px 80px ${c.primary}38)`, zIndex: '5' }"
      />
    </template>

    <!-- Slide 3: phone top-right, caption bottom-left -->
    <DeviceFrames
      v-if="variant === 3"
      :type="deviceFrame"
      :src="imgSrc(cfg.images[2])"
      alt="Screen 3"
      :style="{ width: `${pw}%`, right: '-6%', top: '5%', filter: `drop-shadow(0 30px 70px ${c.primary}38)`, zIndex: '5' }"
    />

    <!-- Slide 4: dark bg, single centered bottom -->
    <DeviceFrames
      v-if="variant === 4"
      :type="deviceFrame"
      :src="imgSrc(cfg.images[3])"
      alt="Screen 4"
      :style="{ width: `${pw}%`, left: '50%', bottom: '-4%', transform: 'translateX(-50%)', filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.55))', zIndex: '5' }"
    />

    <!-- Slide 5: single centered bottom -->
    <DeviceFrames
      v-if="variant === 5"
      :type="deviceFrame"
      :src="imgSrc(cfg.images[4])"
      alt="Screen 5"
      :style="{ width: `${pw}%`, left: '50%', bottom: '-4%', transform: 'translateX(-50%)', filter: `drop-shadow(0 40px 80px ${c.accent}40)`, zIndex: '5' }"
    />

    <!-- Slide 6: two phones, bg right faded, main left -->
    <template v-if="variant === 6">
      <DeviceFrames
        :type="deviceFrame"
        :src="imgSrc(cfg.images[5])"
        alt=""
        :style="{ width: `${pw2 * 0.80}%`, right: '-5%', bottom: '-2%', transform: 'rotate(4deg)', opacity: '0.45', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.10))', zIndex: '3' }"
      />
      <DeviceFrames
        :type="deviceFrame"
        :src="imgSrc(cfg.images[6])"
        alt="Screen 6"
        :style="{ width: `${pw2}%`, left: '-3%', bottom: '-3%', filter: `drop-shadow(0 40px 80px ${c.primary}33)`, zIndex: '5' }"
      />
    </template>

    <!-- Slide 7: single centered bottom -->
    <DeviceFrames
      v-if="variant === 7"
      :type="deviceFrame"
      :src="imgSrc(cfg.images[6])"
      alt="Screen 7"
      :style="{ width: `${pw}%`, left: '50%', bottom: '-4%', transform: 'translateX(-50%)', filter: `drop-shadow(0 40px 80px ${c.primary}38)`, zIndex: '5' }"
    />

    <!-- Slide 8: phone top-right, caption bottom-left -->
    <DeviceFrames
      v-if="variant === 8"
      :type="deviceFrame"
      :src="imgSrc(cfg.images[7])"
      alt="Screen 8"
      :style="{ width: `${pw}%`, right: '-6%', top: '5%', filter: `drop-shadow(0 30px 70px ${c.primary}38)`, zIndex: '5' }"
    />

    <!-- Slide 9: dark bg, single centered bottom -->
    <DeviceFrames
      v-if="variant === 9"
      :type="deviceFrame"
      :src="imgSrc(cfg.images[8])"
      alt="Screen 9"
      :style="{ width: `${pw}%`, left: '50%', bottom: '-4%', transform: 'translateX(-50%)', filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.50))', zIndex: '5' }"
    />
  </div>
</template>
