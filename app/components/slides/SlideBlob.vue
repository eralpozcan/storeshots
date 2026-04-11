<script setup lang="ts">
defineProps<{
  color: string
  opacity: number
  blobStyle?: Record<string, string>
}>()
</script>

<template>
  <div :style="{ position: 'absolute', borderRadius: '50%', background: color, opacity, filter: 'blur(90px)', ...blobStyle }" />
</template>
