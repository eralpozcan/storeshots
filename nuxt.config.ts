export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/fonts'],
  css: ['~/assets/css/main.css'],
  devServer: { port: 3005 },
  compatibilityDate: '2025-01-01',
  future: { compatibilityVersion: 4 },
  nitro: {
    preset: 'netlify',
  },
  components: [
    { path: '~/components', pathPrefix: false },
  ],
  fonts: {
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 600, 700] },
    ],
  },
  app: {
    head: {
      title: 'Storeshots — App Store & Google Play Screenshot Generator',
    },
  },
})
