<script setup lang="ts">
import { marked } from 'marked'
import { sanitize } from 'jagajs/sanitize'
// Vite ?raw import: bundles CHANGELOG.md from the repo root as a string
// so the page stays fully static — no runtime fetch, no extra route.
import changelogSource from '~~/CHANGELOG.md?raw'

definePageMeta({ layout: 'legal' })

useSeoMeta({
  title: 'Changelog — Storeshots',
  description: 'What\'s new in Storeshots: features, fixes, and notable changes.',
  ogTitle: 'Changelog — Storeshots',
  ogDescription: 'What\'s new in Storeshots: features, fixes, and notable changes.',
})

marked.setOptions({ gfm: true, breaks: false })
// CHANGELOG.md is repo-controlled, but a malicious PR could still slip raw
// HTML in. jagajs sanitises the rendered output with no JSDOM dependency,
// so it works in both the browser and the Netlify Functions runtime.
const html = computed(() => sanitize(marked.parse(changelogSource) as string).toString())
</script>

<template>
  <article class="max-w-3xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16">
    <header class="mb-10">
      <p class="text-xs font-semibold uppercase tracking-wider text-blue-600">
        Changelog
      </p>
      <h1 class="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
        What's new in Storeshots
      </h1>
      <p class="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
        Tracked in <a
          href="https://github.com/eralpozcan/storeshots/blob/main/CHANGELOG.md"
          target="_blank"
          rel="noopener"
          class="text-blue-600 hover:underline"
        >CHANGELOG.md</a> on GitHub.
      </p>
    </header>

    <div
      class="changelog-prose"
      v-html="html"
    />
  </article>
</template>

<style scoped>
.changelog-prose :deep(h1) { display: none; }
.changelog-prose :deep(h2) {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  letter-spacing: -0.01em;
}
.changelog-prose :deep(h3) {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2563eb;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.changelog-prose :deep(p) {
  font-size: 0.95rem;
  color: #374151;
  line-height: 1.65;
  margin-bottom: 1rem;
}
.changelog-prose :deep(ul) {
  margin-bottom: 1.25rem;
  padding-left: 1.25rem;
  list-style: disc;
}
.changelog-prose :deep(li) {
  font-size: 0.95rem;
  color: #374151;
  line-height: 1.65;
  margin-bottom: 0.5rem;
}
.changelog-prose :deep(a) {
  color: #2563eb;
  text-decoration: none;
}
.changelog-prose :deep(a:hover) { text-decoration: underline; }
.changelog-prose :deep(code) {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.85em;
  background: #f3f4f6;
  color: #111827;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}
</style>
