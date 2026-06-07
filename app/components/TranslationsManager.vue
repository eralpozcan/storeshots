<script setup lang="ts">
import type { UserConfig, SlideCopy } from '~/utils/types'
import { LOCALE_OPTIONS, localeLabel } from '~/utils/locales'

const props = defineProps<{
  config: UserConfig
  generating: boolean
}>()

const emit = defineEmits<{
  cell: [payload: { locale: string, idx: number, field: 'label' | 'headline', value: string }]
  import: [payload: { locale: string, slides: SlideCopy[] }]
  export: [locale: string]
  translate: [payload: { source: string, targets: string[] }]
  'switch-locale': [locale: string]
}>()

const toast = useToast()

// Columns = every selected language, plus any extra language that already has
// stored copy (so imported/translated extras don't vanish from the table).
const locales = computed<string[]>(() => {
  const sel = props.config.selectedLocales?.length ? props.config.selectedLocales : [props.config.locale]
  const extra = Object.keys(props.config.copyByLocale ?? {}).filter(c => !sel.includes(c))
  return [...sel, ...extra]
})

// Canonical slide count = the active project's slide structure.
const slideCount = computed(() => props.config.copy.length)

function slidesFor(locale: string): SlideCopy[] {
  return props.config.copyByLocale?.[locale]
    ?? (locale === props.config.locale ? props.config.copy : [])
}
function cell(locale: string, idx: number, field: 'label' | 'headline'): string {
  return slidesFor(locale)[idx]?.[field] ?? ''
}
function hasCopy(locale: string): boolean {
  return slidesFor(locale).some(s => s?.headline || s?.label)
}

function onInput(locale: string, idx: number, field: 'label' | 'headline', e: Event) {
  emit('cell', { locale, idx, field, value: (e.target as HTMLInputElement | HTMLTextAreaElement).value })
}

// ─── Translate from source ───
const source = ref(props.config.locale)
watch(() => props.config.locale, (l) => { if (!locales.value.includes(source.value)) source.value = l })

const sourceOptions = computed(() =>
  locales.value.map(c => ({ label: localeLabel(c), value: c })),
)

function translateAll() {
  const targets = locales.value.filter(c => c !== source.value)
  if (!targets.length) {
    toast.add({ title: 'Nothing to translate', description: 'Add more languages in the sidebar first.', color: 'warning', icon: 'i-lucide-languages' })
    return
  }
  emit('translate', { source: source.value, targets })
}
function translateOne(target: string) {
  emit('translate', { source: source.value, targets: [target] })
}

// ─── File import (JSON array or simple CSV) ───
const importInput = ref<HTMLInputElement | null>(null)
const pendingLocale = ref<string | null>(null)
function triggerImport(locale: string) {
  pendingLocale.value = locale
  importInput.value?.click()
}

function parseImport(text: string): SlideCopy[] {
  const trimmed = text.trim()
  // JSON array of {label, headline} (also tolerates a bare array of strings).
  if (trimmed.startsWith('[')) {
    const arr = JSON.parse(trimmed)
    if (!Array.isArray(arr)) throw new Error('Expected a JSON array')
    return arr.map((row: any) => typeof row === 'string'
      ? { label: '', headline: row }
      : { label: String(row.label ?? ''), headline: String(row.headline ?? '') })
  }
  // Fallback CSV: one slide per line, "label,headline". Everything after the
  // first comma is the headline; literal "\n" becomes a real line break.
  return trimmed.split(/\r?\n/).filter(Boolean).map((line) => {
    const comma = line.indexOf(',')
    const label = comma >= 0 ? line.slice(0, comma) : ''
    const headline = comma >= 0 ? line.slice(comma + 1) : line
    return {
      label: label.trim().replace(/^"|"$/g, ''),
      headline: headline.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n'),
    }
  })
}

async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  const locale = pendingLocale.value
  input.value = ''
  pendingLocale.value = null
  if (!file || !locale) return
  if (file.size > 1024 * 1024) {
    toast.add({ title: 'File too large', description: 'Translation files must be under 1MB.', color: 'error', icon: 'i-lucide-triangle-alert' })
    return
  }
  try {
    const slides = parseImport(await file.text())
    if (!slides.length) throw new Error('No rows found')
    emit('import', { locale, slides })
    toast.add({ title: 'Imported', description: `${slides.length} slides loaded into ${localeLabel(locale)}.`, color: 'success', icon: 'i-lucide-upload' })
  }
  catch (err: any) {
    toast.add({ title: 'Import failed', description: err?.message || 'Could not parse file. Use JSON [{label,headline}] or CSV.', color: 'error', icon: 'i-lucide-triangle-alert', duration: 6000 })
  }
}
</script>

<template>
  <div class="space-y-3">
    <!-- Toolbar: source picker + translate-all -->
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-xs font-semibold text-gray-600">Translate from</span>
      <USelect
        v-model="source"
        :items="sourceOptions"
        value-key="value"
        label-key="label"
        size="sm"
        class="min-w-[160px]"
      />
      <UButton
        size="sm"
        icon="i-lucide-languages"
        :loading="generating"
        :disabled="generating || !config.ai.apiKey || locales.length < 2"
        :title="config.ai.apiKey ? 'AI-translate the source language into all other languages' : 'Add an AI key to translate'"
        @click="translateAll"
      >
        Translate to all
      </UButton>
      <span v-if="!config.ai.apiKey" class="text-[11px] text-amber-600">
        Add an AI key in the sidebar to enable translation.
      </span>
      <input
        ref="importInput"
        type="file"
        accept=".json,.csv,.txt,application/json,text/csv,text/plain"
        class="hidden"
        @change="onImportFile"
      >
    </div>

    <!-- Table: rows = slides, columns = languages. Scrolls inside a fixed-height
         region so the column headers (sticky) stay put without colliding with
         the toolbar above. -->
    <div class="overflow-auto max-h-[60vh] border border-gray-200 rounded-lg">
      <table class="border-collapse min-w-full text-xs">
        <thead>
          <tr class="bg-gray-50">
            <th class="sticky left-0 top-0 z-30 bg-gray-50 px-2 py-2 text-left font-semibold text-gray-500 w-10 border-b border-gray-200">#</th>
            <th
              v-for="loc in locales"
              :key="loc"
              class="sticky top-0 z-20 bg-gray-50 px-3 py-2 text-left border-b border-l border-gray-200 align-top min-w-[220px]"
            >
              <div class="flex items-center justify-between gap-2">
                <button
                  type="button"
                  class="font-semibold text-gray-800 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
                  :title="config.locale === loc ? 'Editing this language in the canvas' : 'Make this the active editing language'"
                  @click="emit('switch-locale', loc)"
                >
                  {{ localeLabel(loc) }}
                  <span v-if="config.locale === loc" class="text-[9px] font-bold text-blue-600 bg-blue-50 rounded px-1 py-px">ACTIVE</span>
                  <span v-else-if="hasCopy(loc)" class="size-1.5 rounded-full bg-emerald-500" />
                </button>
                <div class="flex items-center gap-0.5 shrink-0">
                  <button type="button" class="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 cursor-pointer" title="Import file (JSON/CSV)" @click="triggerImport(loc)">
                    <UIcon name="i-lucide-upload" class="size-3.5" />
                  </button>
                  <button type="button" class="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 cursor-pointer" title="Export as JSON" @click="emit('export', loc)">
                    <UIcon name="i-lucide-download" class="size-3.5" />
                  </button>
                  <button
                    v-if="loc !== source"
                    type="button"
                    class="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    :title="config.ai.apiKey ? `Translate from ${localeLabel(source)}` : 'Add an AI key to translate'"
                    :disabled="generating || !config.ai.apiKey"
                    @click="translateOne(loc)"
                  >
                    <UIcon name="i-lucide-sparkles" class="size-3.5" />
                  </button>
                </div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="i in slideCount"
            :key="i - 1"
            class="even:bg-gray-50/40"
          >
            <td class="sticky left-0 z-10 bg-inherit px-2 py-2 font-mono text-gray-400 align-top border-b border-gray-100">
              {{ String(i).padStart(2, '0') }}
            </td>
            <td
              v-for="loc in locales"
              :key="loc"
              class="px-3 py-2 align-top border-b border-l border-gray-100"
            >
              <input
                :value="cell(loc, i - 1, 'label')"
                placeholder="LABEL"
                class="w-full text-[11px] border border-gray-200 rounded px-2 py-1 mb-1 font-bold tracking-wider text-gray-700 bg-white"
                @input="onInput(loc, i - 1, 'label', $event)"
              >
              <textarea
                :value="cell(loc, i - 1, 'headline')"
                placeholder="Line one&#10;Line two"
                :rows="2"
                class="w-full text-xs border border-gray-200 rounded px-2 py-1 resize-y font-[inherit] text-gray-700 bg-white"
                @input="onInput(loc, i - 1, 'headline', $event)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="text-[11px] text-gray-400 leading-relaxed">
      Edits save per language automatically. <b>Import</b> accepts a JSON array of
      <code>{{ '{ label, headline }' }}</code> or a CSV (<code>label,headline</code> per line).
      <b>Translate</b> uses your AI key to localise the source language.
    </p>
  </div>
</template>
