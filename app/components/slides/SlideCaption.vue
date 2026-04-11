<script setup lang="ts">
const props = defineProps<{
  label: string
  headline: string
  textColor: string
  labelColor: string
  cW: number
}>()

const lines = computed(() => props.headline.split('\n'))
</script>

<template>
  <div style="font-family: Inter, sans-serif">
    <div :style="{ fontSize: `${cW * 0.027}px`, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: labelColor, marginBottom: `${cW * 0.016}px` }">
      {{ label }}
    </div>
    <div
      v-for="(line, i) in lines"
      :key="i"
      :style="{ fontSize: `${cW * 0.086}px`, fontWeight: 700, lineHeight: 1.0, color: textColor, letterSpacing: '-0.02em' }"
    >
      {{ line }}
    </div>
  </div>
</template>
