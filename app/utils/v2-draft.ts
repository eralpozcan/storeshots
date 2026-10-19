import type { UserConfig } from './types'
import { restoreConfig } from './defaults'

const SESSION_KEY = 'storeshots-v2-api-key'

// One isolated draft, including images. Resolve writes on transaction commit,
// so the UI never reports "saved" before IndexedDB has committed the data.
async function draftTransaction(config?: UserConfig): Promise<UserConfig | undefined> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('storeshots-v2', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('drafts')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Close other V2 tabs and try again.'))
  })
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', config ? 'readwrite' : 'readonly')
      const store = tx.objectStore('drafts')
      const request = config ? store.put(config, 'current') : store.get('current')
      tx.oncomplete = () => resolve(config ? undefined : request.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error || new Error('Draft save was interrupted.'))
    })
  } finally { db.close() }
}

export async function loadV2Draft(): Promise<UserConfig | undefined> {
  const draft = await draftTransaction()
  return draft ? restoreConfig(draft, sessionStorage.getItem(SESSION_KEY) || '') : undefined
}

export async function saveV2Draft(config: UserConfig): Promise<void> {
  // JSON also removes Vue proxies before structured cloning into IndexedDB.
  const draft: UserConfig = JSON.parse(JSON.stringify(config))
  const key = draft.ai.apiKey
  if (key) sessionStorage.setItem(SESSION_KEY, key)
  else sessionStorage.removeItem(SESSION_KEY)
  draft.ai.apiKey = ''
  await draftTransaction(draft)
}
