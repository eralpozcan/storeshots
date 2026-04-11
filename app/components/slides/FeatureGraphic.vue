<script setup lang="ts">
import type { SlideConfig } from '~/utils/types'
import { FGW, FGH } from '~/utils/canvas'

defineProps<{ cfg: SlideConfig }>()
</script>

<template>
  <div :style="{ width: `${FGW}px`, height: `${FGH}px`, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg,${cfg.colors.bgFrom} 0%,${cfg.colors.bgTo} 100%)`, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center' }">
    <div :style="{ position: 'absolute', borderRadius: '50%', background: cfg.colors.primary, opacity: 0.18, filter: 'blur(60px)', width: '500px', height: '500px', top: '-150px', left: '-100px' }" />
    <div :style="{ position: 'absolute', borderRadius: '50%', background: cfg.colors.accent, opacity: 0.12, filter: 'blur(60px)', width: '350px', height: '350px', bottom: '-120px', right: '-60px' }" />
    <div :style="{ display: 'flex', alignItems: 'center', gap: '28px', paddingLeft: '56px', position: 'relative', zIndex: 5, flexShrink: '0' }">
      <img
        v-if="cfg.appIcon"
        :src="cfg.appIcon"
        :alt="cfg.appName"
        :style="{ width: '88px', height: '88px', borderRadius: '20px', boxShadow: `0 8px 32px ${cfg.colors.primary}80` }"
        draggable="false"
      >
      <div>
        <div :style="{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: cfg.colors.accent, marginBottom: '6px' }">
          {{ cfg.appName }}
        </div>
        <div :style="{ fontSize: '32px', fontWeight: 700, color: cfg.colors.textLight, lineHeight: 1.05, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }">
          {{ cfg.copy[0]?.headline.replace('\n', ' ') ?? cfg.appName }}
        </div>
      </div>
    </div>
    <div :style="{ width: '1px', height: '80px', background: 'rgba(255,255,255,0.1)', margin: '0 48px', flexShrink: '0', position: 'relative', zIndex: 5 }" />
    <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxWidth: '380px', position: 'relative', zIndex: 5 }">
      <div
        v-for="(f, i) in cfg.features"
        :key="i"
        :style="{ padding: '7px 16px', background: i % 2 === 0 ? `${cfg.colors.primary}40` : `${cfg.colors.accent}2E`, border: `1px solid ${i % 2 === 0 ? cfg.colors.primary + '80' : cfg.colors.accent + '66'}`, borderRadius: '20px', fontSize: '13px', fontWeight: 600, color: cfg.colors.textLight }"
      >
        {{ f }}
      </div>
    </div>
    <div :style="{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '3px', background: `linear-gradient(90deg,${cfg.colors.primary},${cfg.colors.accent})` }" />
  </div>
</template>
