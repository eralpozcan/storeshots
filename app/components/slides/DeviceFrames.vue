<script setup lang="ts">
import { MK_W, MK_H, SC_L, SC_T, SC_W, SC_H, SC_RX, SC_RY, TAB_P_RATIO, TAB_L_RATIO } from '~/utils/canvas'

defineProps<{
  type: 'iphone' | 'android-phone' | 'android-tablet-p' | 'android-tablet-l' | 'ipad'
  src: string
  alt?: string
  style?: Record<string, string>
}>()

const { mockupUrl } = useMockup()
</script>

<template>
  <!-- iPhone -->
  <div
    v-if="type === 'iphone'"
    :style="{ position: 'absolute', aspectRatio: `${MK_W}/${MK_H}`, ...style }"
  >
    <img :src="mockupUrl" alt="" :style="{ display: 'block', width: '100%', height: '100%' }" draggable="false">
    <div :style="{ position: 'absolute', zIndex: 10, overflow: 'hidden', left: `${SC_L}%`, top: `${SC_T}%`, width: `${SC_W}%`, height: `${SC_H}%`, borderRadius: `${SC_RX}% / ${SC_RY}%` }">
      <img :src="src" :alt="alt" :style="{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }" draggable="false">
    </div>
  </div>

  <!-- Android Phone -->
  <div
    v-else-if="type === 'android-phone'"
    :style="{ position: 'absolute', aspectRatio: `${MK_W}/${MK_H}`, ...style }"
  >
    <div :style="{ width: '100%', height: '100%', position: 'relative', borderRadius: '6.5% / 3%', background: 'linear-gradient(160deg,#323236 0%,#1c1c20 100%)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.12), 0 12px 48px rgba(0,0,0,0.55)', overflow: 'hidden' }">
      <div :style="{ position: 'absolute', left: '-1.2%', top: '20%', width: '1.5%', height: '7%', background: '#2a2a2e', borderRadius: '2px 0 0 2px' }" />
      <div :style="{ position: 'absolute', left: '-1.2%', top: '30%', width: '1.5%', height: '10%', background: '#2a2a2e', borderRadius: '2px 0 0 2px' }" />
      <div :style="{ position: 'absolute', left: '-1.2%', top: '42%', width: '1.5%', height: '10%', background: '#2a2a2e', borderRadius: '2px 0 0 2px' }" />
      <div :style="{ position: 'absolute', right: '-1.2%', top: '28%', width: '1.5%', height: '8%', background: '#2a2a2e', borderRadius: '0 2px 2px 0' }" />
      <div :style="{ position: 'absolute', top: '1.8%', left: '50%', transform: 'translateX(-50%)', width: '20%', height: '2.4%', borderRadius: '50px', background: '#111', border: '1px solid rgba(255,255,255,0.07)', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }">
        <div :style="{ width: '25%', height: '50%', borderRadius: '50%', background: '#222' }" />
        <div :style="{ width: '18%', height: '40%', borderRadius: '50%', background: '#1a1a1a' }" />
      </div>
      <div :style="{ position: 'absolute', inset: '0', borderRadius: '6.5% / 3%', border: '1px solid rgba(255,255,255,0.07)', pointerEvents: 'none', zIndex: 15 }" />
      <div :style="{ position: 'absolute', left: '3.5%', top: '1.5%', width: '93%', height: '97%', borderRadius: '4.5% / 2.2%', overflow: 'hidden', background: '#000' }">
        <img :src="src" :alt="alt" :style="{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }" draggable="false">
      </div>
    </div>
  </div>

  <!-- Android Tablet Portrait -->
  <div
    v-else-if="type === 'android-tablet-p'"
    :style="{ position: 'absolute', aspectRatio: `${TAB_P_RATIO}`, ...style }"
  >
    <div :style="{ width: '100%', height: '100%', position: 'relative', borderRadius: '4% / 3%', background: 'linear-gradient(160deg,#2e2e32 0%,#1a1a1e 100%)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.10), 0 16px 56px rgba(0,0,0,0.55)', overflow: 'hidden' }">
      <div :style="{ position: 'absolute', right: '-1%', top: '22%', width: '1.2%', height: '5%', background: '#252528', borderRadius: '0 2px 2px 0' }" />
      <div :style="{ position: 'absolute', right: '-1%', top: '29%', width: '1.2%', height: '8%', background: '#252528', borderRadius: '0 2px 2px 0' }" />
      <div :style="{ position: 'absolute', top: '1.2%', left: '50%', transform: 'translateX(-50%)', width: '1.2%', height: '0.9%', borderRadius: '50%', background: '#111', border: '1px solid rgba(255,255,255,0.08)', zIndex: 20 }" />
      <div :style="{ position: 'absolute', inset: '0', borderRadius: '4% / 3%', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none', zIndex: 15 }" />
      <div :style="{ position: 'absolute', left: '6%', top: '3%', width: '88%', height: '94%', borderRadius: '2% / 1.5%', overflow: 'hidden', background: '#000' }">
        <img :src="src" :alt="alt" :style="{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }" draggable="false">
      </div>
    </div>
  </div>

  <!-- Android Tablet Landscape -->
  <div
    v-else-if="type === 'android-tablet-l'"
    :style="{ position: 'absolute', aspectRatio: `${TAB_L_RATIO}`, ...style }"
  >
    <div :style="{ width: '100%', height: '100%', position: 'relative', borderRadius: '3% / 5%', background: 'linear-gradient(160deg,#2e2e32 0%,#1a1a1e 100%)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.10), 0 16px 56px rgba(0,0,0,0.55)', overflow: 'hidden' }">
      <div :style="{ position: 'absolute', left: '1.5%', top: '50%', transform: 'translateY(-50%)', width: '0.8%', height: '1.6%', borderRadius: '50%', background: '#111', border: '1px solid rgba(255,255,255,0.08)', zIndex: 20 }" />
      <div :style="{ position: 'absolute', inset: '0', borderRadius: '3% / 5%', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none', zIndex: 15 }" />
      <div :style="{ position: 'absolute', left: '4%', top: '5%', width: '92%', height: '90%', borderRadius: '1.5% / 2.5%', overflow: 'hidden', background: '#000' }">
        <img :src="src" :alt="alt" :style="{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left' }" draggable="false">
      </div>
    </div>
  </div>

  <!-- iPad -->
  <div
    v-else-if="type === 'ipad'"
    :style="{ position: 'absolute', aspectRatio: '770/1000', ...style }"
  >
    <div :style="{ width: '100%', height: '100%', borderRadius: '5% / 3.6%', background: 'linear-gradient(180deg,#2C2C2E 0%,#1C1C1E 100%)', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 8px 40px rgba(0,0,0,0.6)' }">
      <div :style="{ position: 'absolute', top: '1.2%', left: '50%', transform: 'translateX(-50%)', width: '0.9%', height: '0.65%', borderRadius: '50%', background: '#111113', border: '1px solid rgba(255,255,255,0.08)', zIndex: 20 }" />
      <div :style="{ position: 'absolute', inset: '0', borderRadius: '5% / 3.6%', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none', zIndex: 15 }" />
      <div :style="{ position: 'absolute', left: '4%', top: '2.8%', width: '92%', height: '94.4%', borderRadius: '2.2% / 1.6%', overflow: 'hidden', background: '#000' }">
        <img :src="src" :alt="alt" :style="{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }" draggable="false">
      </div>
    </div>
  </div>
</template>
