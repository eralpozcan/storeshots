<script setup lang="ts">
import type { SlideConfig, SlideElement, TextElement, IconElement, ChipsElement, BrandColors } from '~/utils/types'
import { FGW, FGH, FG_PRESET } from '~/utils/canvas'
import { anchorSides, anchorTransform, combineTransform } from '~/utils/anchor'

const props = withDefaults(defineProps<{
  cfg: SlideConfig
  elements?: SlideElement[]
}>(), {
  elements: () => FG_PRESET,
})

// Only icon / text / chips render on the FG (device/caption/blob are slide-only).
const fgElements = computed(() =>
  props.elements.filter(e => e.type === 'icon' || e.type === 'text' || e.type === 'chips'))

function colorOf(c: BrandColors, key: TextElement['color']): string {
  return c[key]
}

function textOf(el: TextElement): string {
  if (el.bind === 'appName') return props.cfg.appName
  if (el.bind === 'headline') return (props.cfg.copy[0]?.headline ?? '').replace(/\n/g, ' ')
  return el.text ?? ''
}

function baseStyle(el: SlideElement): Record<string, string | undefined> {
  return {
    position: 'absolute',
    ...anchorSides(el.anchor, el.x, el.y),
    transform: combineTransform([anchorTransform(el.anchor), el.rotate ? `rotate(${el.rotate}deg)` : undefined]),
    opacity: el.opacity !== undefined ? String(el.opacity) : undefined,
    zIndex: String(el.zIndex),
  }
}

function textStyle(el: TextElement): Record<string, string | undefined> {
  return {
    ...baseStyle(el),
    fontSize: `${FGW * el.sizePct / 100}px`,
    fontWeight: String(el.weight),
    color: colorOf(props.cfg.colors, el.color),
    textTransform: el.uppercase ? 'uppercase' : undefined,
    letterSpacing: el.letterSpacing !== undefined ? `${el.letterSpacing}em` : undefined,
    width: el.widthPct !== undefined ? `${el.widthPct}%` : undefined,
    whiteSpace: el.widthPct !== undefined ? 'pre-line' : 'nowrap',
    textAlign: el.align,
    lineHeight: '1.1',
  }
}

function iconStyle(el: IconElement): Record<string, string | undefined> {
  const size = FGW * el.sizePct / 100
  return {
    ...baseStyle(el),
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: `${size * 0.22}px`,
    boxShadow: `0 8px 32px ${props.cfg.colors.primary}80`,
  }
}

function chipsStyle(el: ChipsElement): Record<string, string | undefined> {
  return {
    ...baseStyle(el),
    width: `${el.widthPct}%`,
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  }
}
</script>

<template>
  <div :style="{ width: `${FGW}px`, height: `${FGH}px`, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg,${cfg.colors.bgFrom} 0%,${cfg.colors.bgTo} 100%)`, fontFamily: cfg.fontFamily }">
    <!-- Decorative background (not editable) -->
    <div :style="{ position: 'absolute', borderRadius: '50%', background: cfg.colors.primary, opacity: 0.18, filter: 'blur(60px)', width: '500px', height: '500px', top: '-150px', left: '-100px' }" />
    <div :style="{ position: 'absolute', borderRadius: '50%', background: cfg.colors.accent, opacity: 0.12, filter: 'blur(60px)', width: '350px', height: '350px', bottom: '-120px', right: '-60px' }" />

    <!-- Editable elements -->
    <template
      v-for="el in fgElements"
      :key="el.id"
    >
      <img
        v-if="el.type === 'icon' && cfg.appIcon"
        :src="cfg.appIcon"
        :alt="cfg.appName"
        :style="iconStyle(el)"
        draggable="false"
      >
      <div
        v-else-if="el.type === 'text'"
        :style="textStyle(el)"
      >
        {{ textOf(el) }}
      </div>
      <div
        v-else-if="el.type === 'chips'"
        :style="chipsStyle(el)"
      >
        <div
          v-for="(f, i) in cfg.features"
          :key="i"
          :style="{ padding: '7px 16px', background: i % 2 === 0 ? `${cfg.colors.primary}40` : `${cfg.colors.accent}2E`, border: `1px solid ${i % 2 === 0 ? cfg.colors.primary + '80' : cfg.colors.accent + '66'}`, borderRadius: '20px', fontSize: '13px', fontWeight: 600, color: cfg.colors.textLight, whiteSpace: 'nowrap', textTransform: 'capitalize' }"
        >
          {{ f }}
        </div>
      </div>
    </template>

    <!-- Bottom accent bar (not editable) -->
    <div :style="{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '3px', background: `linear-gradient(90deg,${cfg.colors.primary},${cfg.colors.accent})`, zIndex: 6 }" />
  </div>
</template>
