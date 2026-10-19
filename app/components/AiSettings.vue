<script setup lang="ts">
import type { UserConfig } from '~/utils/types'
import { saveAiPreferences } from '~/utils/ai-preferences'

const props = defineProps<{ ai: UserConfig['ai'] }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ save: [ai: UserConfig['ai']] }>()
const draft = ref({ ...props.ai })
const toast = useToast()
watch(open, value => { if (value) draft.value = { ...props.ai } })
const modelKey = computed(() => draft.value.provider === 'claude' ? 'claudeModel' : 'openrouterModel')
const canSave = computed(() => !!draft.value.apiKey.trim() && !!draft.value[modelKey.value].trim())
function changeProvider(provider: UserConfig['ai']['provider']) {
  draft.value = { ...draft.value, provider, apiKey: provider === props.ai.provider ? props.ai.apiKey : '' }
}
function save() {
  if (!canSave.value) return
  const ai = { ...draft.value, apiKey: draft.value.apiKey.trim(), [modelKey.value]: draft.value[modelKey.value].trim() }
  try { saveAiPreferences(ai, localStorage) }
  catch { toast.add({ title: 'Settings available for this session', description: 'Browser storage is unavailable. Provider and model may need to be set again next time.', color: 'warning' }) }
  emit('save', ai)
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" title="AI settings" description="Set up your connection once, then return to designing.">
    <template #body>
      <form id="v2-ai-settings-form" class="space-y-5" @submit.prevent="save">
        <UFormField label="Provider" name="provider">
          <select id="v2-settings-provider" :value="draft.provider" aria-label="Provider" class="w-full rounded-md border border-gray-300 p-2.5 text-sm" @change="changeProvider(($event.target as HTMLSelectElement).value as UserConfig['ai']['provider'])"><option value="claude">Anthropic</option><option value="openrouter">OpenRouter</option></select>
        </UFormField>
        <UFormField label="API key" name="key" help="Kept only in this tab's session. Enter it again after closing the tab.">
          <UInput v-model="draft.apiKey" aria-label="API key" type="password" autocomplete="off" :spellcheck="false" class="w-full" placeholder="Paste your API key" required />
        </UFormField>
        <UFormField label="Model" name="model" help="Use a vision-capable model ID from your provider. Your existing model is prefilled.">
          <UInput v-model="draft[modelKey]" aria-label="Model" autocomplete="off" :spellcheck="false" class="w-full" required />
        </UFormField>
        <p class="text-sm leading-relaxed text-gray-600">Provider and model are remembered on this browser across projects. Images are sent to your provider only when you use an AI generation tool.</p>
      </form>
    </template>
    <template #footer>
      <div class="flex w-full flex-wrap justify-end gap-2">
        <UButton v-if="ai.apiKey" color="neutral" variant="ghost" class="mr-auto" @click="emit('save', { ...ai, apiKey: '' }); open = false">Disconnect AI</UButton>
        <UButton color="neutral" variant="outline" @click="open = false">Cancel</UButton>
        <UButton type="submit" form="v2-ai-settings-form" :disabled="!canSave">Save settings</UButton>
      </div>
    </template>
  </UModal>
</template>
