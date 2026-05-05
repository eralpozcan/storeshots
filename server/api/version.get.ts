// Returns the buildId baked into this deploy. Each Netlify build gets a new
// timestamp, so an old client tab polling this endpoint sees a fresh value
// and can prompt the user to refresh.
export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=0, must-revalidate')
  return { buildId: useRuntimeConfig().public.buildId }
})
