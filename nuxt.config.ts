export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/fonts', 'nuxt-security', '@nuxtjs/seo'],
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
  site: {
    url: 'https://storeshots.org',
    name: 'Storeshots',
    description: 'Generate professional App Store & Google Play screenshots with AI-powered copywriting, device mockups, and smart slide ordering.',
    defaultLocale: 'en',
  },
  app: {
    head: {
      title: 'Storeshots — App Store & Google Play Screenshot Generator',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },
  ogImage: {
    zeroRuntime: true,
  },
  vite: {
    optimizeDeps: {
      include: ['html-to-image'],
    },
  },
  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'Storeshots',
      url: 'https://storeshots.org',
      logo: '/logo.png',
    },
  },
  sitemap: {
    enabled: true,
  },
  robots: {
    enabled: true,
  },
  security: {
    headers: {
      contentSecurityPolicy: {
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'connect-src': ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
        'worker-src': ["'self'", 'blob:'],
      },
      crossOriginEmbedderPolicy: false,
    },
    rateLimiter: {
      tokensPerInterval: 30,
      interval: 60000,
    },
    corsHandler: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  },
})
