<script setup lang="ts">
import type { SlideConfig } from '~/utils/types'
import { artworkStyle } from '~/utils/apple-assets'

defineProps<{
  cfg: SlideConfig
  index: number
  cW: number
  cH: number
  kind: 'duo' | 'creative'
}>()
</script>

<template>
  <div :style="{ width: `${cW}px`, height: `${cH}px`, position: 'relative', overflow: 'hidden', background: cfg.artwork?.background || cfg.colors.bgFrom, fontFamily: cfg.fontFamily }">
    <!-- The same fit and focus settings drive both the preview and export. -->
    <img v-if="cfg.images[index]" :src="cfg.images[index]!" :alt="cfg.appName" :style="{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...artworkStyle(cfg.artwork) }" draggable="false">
    <div v-else :style="{ position: 'absolute', inset: '12%', display: 'grid', placeItems: 'center', color: cfg.colors.textLight, fontSize: `${cW * .045}px`, textAlign: 'center' }">{{ kind === 'duo' ? 'Add a Duo screenshot' : 'Add your artwork' }}</div>
  </div>
</template>
