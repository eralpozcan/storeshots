const mockupUrl = ref('/mockup.png')
let loaded = false

export function useMockup() {
  if (!loaded && import.meta.client) {
    loaded = true
    fetch('/mockup.png')
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader()
        reader.onloadend = () => { mockupUrl.value = reader.result as string }
        reader.readAsDataURL(blob)
      })
      .catch(() => { /* fallback to path */ })
  }
  return { mockupUrl }
}
