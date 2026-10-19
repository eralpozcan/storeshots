import type { UserConfig } from './types'

type AiPreferences = Omit<UserConfig['ai'], 'apiKey'>
const STORAGE_KEY = 'storeshots-v2-ai-preferences'

export function loadAiPreferences(storage: Pick<Storage, 'getItem'>): AiPreferences | undefined {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY) || 'null')
    if (!value || !['claude', 'openrouter'].includes(value.provider)
      || typeof value.openrouterModel !== 'string' || typeof value.claudeModel !== 'string') return
    return { provider: value.provider, openrouterModel: value.openrouterModel, claudeModel: value.claudeModel }
  } catch { return undefined }
}

export function saveAiPreferences(ai: AiPreferences, storage: Pick<Storage, 'setItem'>): void {
  // Explicit fields keep API keys out even when a full AI config is passed.
  storage.setItem(STORAGE_KEY, JSON.stringify({ provider: ai.provider, openrouterModel: ai.openrouterModel, claudeModel: ai.claudeModel }))
}
