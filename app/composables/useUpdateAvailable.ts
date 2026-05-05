// Polls /api/version every 5 minutes (and on tab focus) and flips
// `updateAvailable` to true when the server's buildId differs from the one
// baked into this client bundle.
const updateAvailable = ref(false)
let started = false

export function useUpdateAvailable() {
  if (import.meta.client && !started) {
    started = true
    const localBuildId = useRuntimeConfig().public.buildId

    async function check() {
      if (updateAvailable.value) return
      try {
        const res = await $fetch<{ buildId: string }>('/api/version', {
          headers: { 'cache-control': 'no-cache' },
        })
        if (res.buildId && res.buildId !== localBuildId) {
          updateAvailable.value = true
        }
      }
      catch { /* offline or transient — ignore */ }
    }

    const POLL_MS = 5 * 60 * 1000
    setTimeout(check, 30_000)
    setInterval(check, POLL_MS)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
  }

  function reload() {
    if (import.meta.client) window.location.reload()
  }

  return { updateAvailable: readonly(updateAvailable), reload }
}
