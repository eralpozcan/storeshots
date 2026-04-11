<script setup lang="ts">
import type { UserConfig, SlideCopy, ImagesKey } from '~/utils/types'
import { SLIDE_COUNT } from '~/utils/defaults'

const props = defineProps<{
  config: UserConfig
  generating: boolean
}>()

const emit = defineEmits<{
  change: [patch: Partial<UserConfig>]
  generate: []
  'generate-design': []
}>()

// Template refs
const iconInputRef = ref<HTMLInputElement>()
const ssInputRefs = ref<Record<number, HTMLInputElement>>({})

function setSsRef(idx: number, el: any) {
  if (el) ssInputRefs.value[idx] = el as HTMLInputElement
}

// Screenshot device tabs
const activeDevice = ref<ImagesKey>('iphone')

const DEVICE_LABELS: { key: ImagesKey; label: string }[] = [
  { key: 'iphone', label: 'iPhone' },
  { key: 'androidPhone', label: 'Android Phone' },
  { key: 'androidTablet7P', label: 'Android 7" P' },
  { key: 'androidTablet7L', label: 'Android 7" L' },
  { key: 'androidTablet10P', label: 'Android 10" P' },
  { key: 'androidTablet10L', label: 'Android 10" L' },
  { key: 'ipad', label: 'iPad' },
]

function updateColors(patch: Partial<UserConfig['colors']>) {
  emit('change', { colors: { ...props.config.colors, ...patch } })
}

function updateAi(patch: Partial<UserConfig['ai']>) {
  emit('change', { ai: { ...props.config.ai, ...patch } })
}

function updateCopy(idx: number, field: keyof SlideCopy, value: string) {
  const copy = [...props.config.copy]
  copy[idx] = { ...copy[idx], [field]: value }
  emit('change', { copy })
}

// ─── Drag & Drop for slide reorder ───
const dragIdx = ref<number | null>(null)
const dragOverIdx = ref<number | null>(null)

// ─── Drag & Drop for screenshot reorder ───
const ssDragIdx = ref<number | null>(null)
const ssDragOverIdx = ref<number | null>(null)

function onSsDragStart(idx: number) {
  ssDragIdx.value = idx
}

function onSsDragOver(e: DragEvent, idx: number) {
  e.preventDefault()
  ssDragOverIdx.value = idx
}

function onSsDragEnd() {
  if (ssDragIdx.value === null || ssDragOverIdx.value === null || ssDragIdx.value === ssDragOverIdx.value) {
    ssDragIdx.value = null
    ssDragOverIdx.value = null
    return
  }

  const from = ssDragIdx.value
  const to = ssDragOverIdx.value
  const images = { ...props.config.images }
  const arr = [...images[activeDevice.value]]
  const tmp = arr[from]
  arr[from] = arr[to]
  arr[to] = tmp
  images[activeDevice.value] = arr as (string | null)[]
  emit('change', { images })

  ssDragIdx.value = null
  ssDragOverIdx.value = null
}

function onDragStart(idx: number) {
  dragIdx.value = idx
}

function onDragOver(e: DragEvent, idx: number) {
  e.preventDefault()
  dragOverIdx.value = idx
}

function onDragEnd() {
  if (dragIdx.value === null || dragOverIdx.value === null || dragIdx.value === dragOverIdx.value) {
    dragIdx.value = null
    dragOverIdx.value = null
    return
  }

  const from = dragIdx.value
  const to = dragOverIdx.value

  // Swap copy
  const copy = [...props.config.copy]
  const tmpCopy = copy[from]
  copy[from] = copy[to]
  copy[to] = tmpCopy

  // Swap images for all device types
  const images = { ...props.config.images }
  for (const key of Object.keys(images) as (keyof typeof images)[]) {
    const arr = [...images[key]]
    const tmpImg = arr[from]
    arr[from] = arr[to]
    arr[to] = tmpImg
    images[key] = arr
  }

  emit('change', { copy, images })
  dragIdx.value = null
  dragOverIdx.value = null
}

function updateSlot(idx: number, value: string | null) {
  const images = { ...props.config.images }
  const arr = [...images[activeDevice.value]] as (string | null)[]
  arr[idx] = value
  images[activeDevice.value] = arr
  emit('change', { images })
}

async function handleFileUpload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function onIconDrop(e: DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer?.files[0]
  if (!file) return
  emit('change', { appIcon: await handleFileUpload(file) })
}

async function onIconSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  emit('change', { appIcon: await handleFileUpload(file) })
}

async function onScreenshotSelect(idx: number, e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files?.length) return

  // Multi-file: fill slots starting from idx
  for (let i = 0; i < files.length; i++) {
    const slotIdx = idx + i
    if (slotIdx >= SLIDE_COUNT) break
    const dataUrl = await handleFileUpload(files[i])
    updateSlot(slotIdx, dataUrl)
  }
  // Reset input so same files can be re-selected
  ;(e.target as HTMLInputElement).value = ''
}

// Bulk upload ref
const bulkInputRef = ref<HTMLInputElement>()

async function onBulkUpload(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files?.length) return

  for (let i = 0; i < Math.min(files.length, SLIDE_COUNT); i++) {
    const dataUrl = await handleFileUpload(files[i])
    updateSlot(i, dataUrl)
  }
  ;(e.target as HTMLInputElement).value = ''
}

const colorFields: [keyof UserConfig['colors'], string][] = [
  ['primary', 'Primary'],
  ['accent', 'Accent'],
  ['textDark', 'Text (dark)'],
  ['textLight', 'Text (light)'],
  ['bgFrom', 'BG From'],
  ['bgTo', 'BG To'],
]

function handleReset() {
  if (confirm('Reset all copy and colors? Screenshots will be cleared too.')) {
    localStorage.removeItem('screenshot-generator-config')
    sessionStorage.removeItem('screenshot-generator-ai-key')
    window.location.reload()
  }
}
</script>

<template>
  <div class="w-[280px] shrink-0 bg-white border-r border-gray-200 overflow-y-auto h-screen">
    <!-- App Info -->
    <div class="border-b border-gray-200 p-4">
      <div class="text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-3">
        App Info
      </div>
      <div class="flex gap-2.5 items-start mb-2.5">
        <div
          class="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer flex items-center justify-center overflow-hidden shrink-0 relative"
          @click="iconInputRef?.click()"
          @dragover.prevent
          @drop="onIconDrop"
        >
          <img
            v-if="config.appIcon"
            :src="config.appIcon"
            alt="Icon"
            class="w-full h-full object-cover"
          >
          <span v-else class="text-lg text-gray-400">+</span>
          <input
            ref="iconInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onIconSelect"
          >
        </div>
        <div class="flex-1">
          <div class="text-xs font-semibold text-gray-700 mb-1">
            App Name
          </div>
          <UInput
            :model-value="config.appName"
            size="sm"
            placeholder="My App"
            @update:model-value="emit('change', { appName: $event as string })"
          />
        </div>
      </div>
      <div class="text-xs font-semibold text-gray-700 mb-1">
        Description <span class="font-normal text-gray-400">(for AI)</span>
      </div>
      <UTextarea
        :model-value="config.appDescription"
        :rows="3"
        size="sm"
        placeholder="What does your app do?"
        @update:model-value="emit('change', { appDescription: $event as string })"
      />
      <div class="mt-2">
        <div class="text-xs font-semibold text-gray-700 mb-1">
          Features <span class="font-normal text-gray-400">(one per line)</span>
        </div>
        <UTextarea
          :model-value="config.features.join('\n')"
          :rows="4"
          size="sm"
          placeholder="Rent tracking&#10;Tenant management"
          @update:model-value="emit('change', { features: ($event as string).split('\n').map((f: string) => f.trim()).filter(Boolean) })"
        />
      </div>
    </div>

    <!-- Brand Colors -->
    <div class="border-b border-gray-200 p-4">
      <div class="text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-3">
        Brand Colors
      </div>
      <div class="grid grid-cols-2 gap-x-3 gap-y-2.5">
        <div
          v-for="[key, label] in colorFields"
          :key="key"
        >
          <div class="text-[11px] font-semibold text-gray-600 mb-1">
            {{ label }}
          </div>
          <div class="flex items-center gap-2 h-8 rounded-md border border-gray-200 bg-gray-50 px-1.5">
            <label class="relative shrink-0 cursor-pointer">
              <span
                class="block w-5 h-5 rounded border border-gray-300"
                :style="{ backgroundColor: config.colors[key] }"
              />
              <input
                type="color"
                :value="config.colors[key]"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                @input="updateColors({ [key]: ($event.target as HTMLInputElement).value })"
              >
            </label>
            <input
              type="text"
              :value="config.colors[key]"
              class="flex-1 min-w-0 text-[11px] bg-transparent border-none outline-none font-mono text-gray-700"
              @input="updateColors({ [key]: ($event.target as HTMLInputElement).value })"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Screenshots -->
    <div class="border-b border-gray-200 p-4">
      <div class="flex items-center justify-between mb-3">
        <div class="text-[11px] font-bold text-gray-500 tracking-wider uppercase">
          Screenshots
        </div>
        <button
          class="text-[11px] font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
          @click="bulkInputRef?.click()"
        >
          Upload All
        </button>
        <input
          ref="bulkInputRef"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="onBulkUpload"
        >
      </div>
      <div class="flex gap-1 flex-wrap mb-3">
        <button
          v-for="d in DEVICE_LABELS"
          :key="d.key"
          class="text-[11px] px-2 py-0.5 rounded border cursor-pointer"
          :class="activeDevice === d.key ? 'border-blue-500 bg-blue-50 text-blue-600 font-semibold' : 'border-gray-200 bg-white text-gray-700'"
          @click="activeDevice = d.key"
        >
          {{ d.label }}
        </button>
      </div>
      <div class="grid grid-cols-4 gap-1.5">
        <div
          v-for="i in SLIDE_COUNT"
          :key="i"
          class="flex flex-col items-center gap-0.5"
          :draggable="!!config.images[activeDevice][i - 1]"
          @dragstart="config.images[activeDevice][i - 1] && onSsDragStart(i - 1)"
          @dragover="onSsDragOver($event, i - 1)"
          @dragend="onSsDragEnd"
        >
          <div
            class="w-[60px] h-[60px] rounded-lg border-2 flex items-center justify-center overflow-hidden relative transition-all duration-100"
            :class="[
              ssDragOverIdx === i - 1 && ssDragIdx !== i - 1
                ? 'border-blue-400 bg-blue-50 scale-105'
                : ssDragIdx === i - 1
                  ? 'border-blue-300 opacity-40 scale-95'
                  : config.images[activeDevice][i - 1]
                    ? 'border-green-400 bg-green-50 cursor-grab active:cursor-grabbing'
                    : 'border-dashed border-gray-300 bg-gray-50 cursor-pointer',
            ]"
            @click="!config.images[activeDevice][i - 1] && ssInputRefs[i - 1]?.click()"
          >
            <img
              v-if="config.images[activeDevice][i - 1]"
              :src="config.images[activeDevice][i - 1]!"
              alt=""
              class="w-full h-full object-cover pointer-events-none"
            >
            <span v-else class="text-lg text-gray-400">+</span>
            <button
              v-if="config.images[activeDevice][i - 1]"
              class="absolute top-0.5 right-0.5 bg-black/60 text-white border-none rounded w-4 h-4 text-[10px] cursor-pointer flex items-center justify-center z-10"
              @click.stop="updateSlot(i - 1, null)"
            >
              ✕
            </button>
          </div>
          <span class="text-[9px] text-gray-400">#{{ i }}</span>
          <input
            :ref="(el) => setSsRef(i - 1, el)"
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            @change="onScreenshotSelect(i - 1, $event)"
          >
        </div>
      </div>
    </div>

    <!-- AI Generate -->
    <div class="border-b border-gray-200 p-4">
      <div class="text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-3">
        AI Generate
      </div>

      <!-- Language -->
      <div class="text-xs font-semibold text-gray-700 mb-1">App Language</div>
      <USelect
        :model-value="config.locale"
        :items="[
          { label: '🇬🇧 English', value: 'en' },
          { label: '🇹🇷 Türkçe', value: 'tr' },
          { label: '🇩🇪 Deutsch', value: 'de' },
          { label: '🇫🇷 Français', value: 'fr' },
          { label: '🇪🇸 Español', value: 'es' },
          { label: '🇵🇹 Português', value: 'pt' },
          { label: '🇮🇹 Italiano', value: 'it' },
          { label: '🇯🇵 日本語', value: 'ja' },
          { label: '🇰🇷 한국어', value: 'ko' },
          { label: '🇸🇦 العربية', value: 'ar' },
          { label: '🇨🇳 中文', value: 'zh' },
          { label: '🇳🇱 Nederlands', value: 'nl' },
          { label: '🇷🇺 Русский', value: 'ru' },
        ]"
        value-key="value"
        label-key="label"
        size="sm"
        class="mb-3"
        @update:model-value="emit('change', { locale: $event as string })"
      />
      <p class="text-[10px] text-gray-400 mb-3 leading-relaxed">
        Select the language of your app's UI. AI will analyze screenshots in this language and generate headlines accordingly.
      </p>

      <!-- Generate buttons -->
      <div class="flex gap-1.5 mb-2">
        <UButton
          size="xs"
          variant="outline"
          class="flex-1"
          :loading="generating"
          :disabled="generating || !config.ai.apiKey"
          @click="emit('generate')"
        >
          ✦ Headlines
        </UButton>
        <UButton
          size="xs"
          class="flex-1"
          :loading="generating"
          :disabled="generating || !config.ai.apiKey"
          @click="emit('generate-design')"
        >
          ✦ Full Design
        </UButton>
      </div>

      <!-- How it works -->
      <div class="bg-blue-50 rounded-lg p-2.5 mb-3">
        <p class="text-[10px] text-blue-700 leading-relaxed">
          <b>How it works:</b> Upload your screenshots first, then click generate.
          AI will analyze each image to understand what's on screen, and write matching headlines.
        </p>
        <div class="mt-1.5 text-[10px] text-blue-600 leading-relaxed">
          <b>✦ Headlines</b> — copy only<br>
          <b>✦ Full Design</b> — copy + brand colors from your screenshots
        </div>
      </div>
      <!-- Slide copy list header -->
      <div class="flex items-center justify-between mb-2">
        <div class="text-[11px] font-bold text-gray-500 tracking-wider uppercase">
          Slides
        </div>
        <span class="text-[10px] text-gray-400">drag to reorder</span>
      </div>

      <div
        v-for="(slide, i) in config.copy"
        :key="i"
        class="mb-2 rounded-lg border transition-all duration-150 cursor-grab active:cursor-grabbing"
        :class="[
          dragOverIdx === i && dragIdx !== i
            ? 'border-blue-400 bg-blue-50'
            : dragIdx === i
              ? 'border-blue-300 bg-blue-50/50 opacity-50'
              : 'border-gray-200 bg-white',
        ]"
        draggable="true"
        @dragstart="onDragStart(i)"
        @dragover="onDragOver($event, i)"
        @dragend="onDragEnd"
      >
        <div class="flex items-start gap-1.5 p-2">
          <!-- Drag handle -->
          <div class="pt-1 text-gray-300 hover:text-gray-500 shrink-0 select-none">
            <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
              <circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" />
              <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
              <circle cx="2" cy="14" r="1.5" /><circle cx="8" cy="14" r="1.5" />
            </svg>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-[9px] font-bold text-white bg-gray-400 rounded px-1 py-px leading-none">{{ i + 1 }}</span>
              <!-- Thumbnail preview -->
              <div
                v-if="config.images.iphone[i]"
                class="w-5 h-5 rounded overflow-hidden shrink-0 border border-gray-200"
              >
                <img :src="config.images.iphone[i]!" class="w-full h-full object-cover" alt="">
              </div>
              <div v-else class="w-5 h-5 rounded bg-gray-100 shrink-0 border border-gray-200" />
            </div>
            <input
              :value="slide.label"
              placeholder="LABEL"
              class="w-full text-[11px] border border-gray-200 rounded px-2 py-1 mb-1 font-bold tracking-wider text-gray-700 bg-gray-50"
              @input="updateCopy(i, 'label', ($event.target as HTMLInputElement).value)"
            >
            <textarea
              :value="slide.headline"
              placeholder="Line one&#10;Line two"
              :rows="2"
              class="w-full text-xs border border-gray-200 rounded px-2 py-1 resize-y font-[inherit] text-gray-700 bg-gray-50"
              @input="updateCopy(i, 'headline', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- AI Settings -->
    <div class="border-b border-gray-200 p-4">
      <div class="text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-3">
        AI Settings
      </div>
      <div class="text-xs font-semibold text-gray-700 mb-1">
        Provider
      </div>
      <USelect
        :model-value="config.ai.provider"
        :items="[{ label: 'Claude (Anthropic)', value: 'claude' }, { label: 'OpenRouter', value: 'openrouter' }]"
        value-key="value"
        label-key="label"
        size="sm"
        class="mb-2"
        @update:model-value="updateAi({ provider: $event as 'claude' | 'openrouter' })"
      />
      <template v-if="config.ai.provider === 'openrouter'">
        <div class="text-xs font-semibold text-gray-700 mb-1">
          Model
        </div>
        <UInput
          :model-value="config.ai.openrouterModel"
          size="sm"
          placeholder="anthropic/claude-3-5-sonnet"
          class="mb-1.5"
          @update:model-value="updateAi({ openrouterModel: $event as string })"
        />
        <!-- Vision-capable models (recommended) -->
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2">
          <p class="text-[10px] text-amber-700 font-semibold mb-1">👁 Vision models (recommended)</p>
          <p class="text-[10px] text-amber-600 leading-relaxed mb-1.5">
            These models can analyze your screenshots for better, more accurate headlines.
          </p>
          <div class="flex flex-wrap gap-1">
            <span
              class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-200 transition-colors"
              @click="updateAi({ openrouterModel: 'google/gemini-2.0-flash-001' })"
            >gemini-2.0-flash</span>
            <span
              class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-200 transition-colors"
              @click="updateAi({ openrouterModel: 'anthropic/claude-3-5-sonnet' })"
            >claude-3.5-sonnet</span>
            <span
              class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-200 transition-colors"
              @click="updateAi({ openrouterModel: 'openai/gpt-4o-mini' })"
            >gpt-4o-mini</span>
          </div>
        </div>
        <!-- Free text-only models -->
        <p class="text-[10px] text-gray-400 mb-2 leading-relaxed">
          Free (text-only): <span class="text-gray-500 cursor-pointer hover:text-blue-500" @click="updateAi({ openrouterModel: 'google/gemini-2.0-flash-exp:free' })">gemini-2.0-flash:free</span>,
          <span class="text-gray-500 cursor-pointer hover:text-blue-500" @click="updateAi({ openrouterModel: 'meta-llama/llama-4-maverick:free' })">llama-4-maverick:free</span>,
          <span class="text-gray-500 cursor-pointer hover:text-blue-500" @click="updateAi({ openrouterModel: 'deepseek/deepseek-chat-v3-0324:free' })">deepseek-chat:free</span>
        </p>
      </template>
      <!-- Claude info -->
      <template v-if="config.ai.provider === 'claude'">
        <div class="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
          <p class="text-[10px] text-green-700 leading-relaxed">
            👁 <b>Claude supports vision</b> — your screenshots will be analyzed for accurate, context-aware headlines.
          </p>
        </div>
      </template>
      <div class="text-xs font-semibold text-gray-700 mb-1">
        API Key
      </div>
      <UInput
        :model-value="config.ai.apiKey"
        type="password"
        size="sm"
        :placeholder="config.ai.provider === 'claude' ? 'sk-ant-...' : 'sk-or-...'"
        @update:model-value="updateAi({ apiKey: $event as string })"
      />
      <p class="text-[11px] text-gray-400 mt-1.5">
        Key is stored in session only — cleared when you close the tab.
      </p>
    </div>

    <!-- Reset -->
    <div class="p-4 pb-6">
      <UButton
        color="error"
        variant="outline"
        size="sm"
        block
        @click="handleReset"
      >
        Reset to defaults
      </UButton>
    </div>
  </div>
</template>
