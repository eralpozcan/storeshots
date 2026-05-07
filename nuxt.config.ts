export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/fonts', 'nuxt-security', '@nuxtjs/seo', '@nuxt/scripts'],
  runtimeConfig: {
    public: {
      umamiWebsiteId: '',
      // Defaults to Umami Cloud. Override for self-host.
      umamiHost: 'https://cloud.umami.is',
      // Baked at build time. Prefers Netlify's COMMIT_REF (git SHA) so the
      // same commit redeployed produces the same id and doesn't trigger a
      // spurious refresh prompt. Falls back to Date.now() for local dev.
      buildId: process.env.COMMIT_REF || process.env.NETLIFY_BUILD_ID || Date.now().toString(),
    },
  },
  // The whole site is designed light-only (landing + legal + editor all assume a white canvas).
  // Forcing the color mode prevents @nuxtjs/color-mode from flipping the body background
  // to dark on systems with `prefers-color-scheme: dark`, which made legal pages unreadable.
  colorMode: {
    preference: 'light',
    fallback: 'light',
  },
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
      { name: 'Inter', provider: 'google', weights: [400, 600, 700], preload: true, display: 'swap' },
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
      meta: [
        { name: 'description', content: 'Generate professional App Store & Google Play screenshots with AI-powered copywriting, device mockups, and smart slide ordering. Free & open source.' },
        { property: 'og:title', content: 'Storeshots — App Store & Google Play Screenshot Generator' },
        { property: 'og:description', content: 'Generate professional App Store & Google Play screenshots with AI-powered copywriting, device mockups, and smart slide ordering. Free & open source.' },
        { property: 'og:image', content: 'https://storeshots.org/logo.png' },
        { property: 'og:image:alt', content: 'Storeshots — App Store & Google Play Screenshot Generator' },
        { property: 'og:url', content: 'https://storeshots.org' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Storeshots' },
        { property: 'og:locale', content: 'en_US' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Storeshots — App Store & Google Play Screenshot Generator' },
        { name: 'twitter:description', content: 'Generate professional App Store & Google Play screenshots with AI-powered copywriting, device mockups, and smart slide ordering. Free & open source.' },
        { name: 'twitter:image', content: 'https://storeshots.org/logo.png' },
        { name: 'twitter:image:alt', content: 'Storeshots — App Store & Google Play Screenshot Generator' },
        { name: 'theme-color', content: '#6366f1' },
        { name: 'application-name', content: 'Storeshots' },
        { name: 'msapplication-TileColor', content: '#6366f1' },
        { name: 'msapplication-TileImage', content: '/android-chrome-192x192.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
      ],
    },
  },
  ogImage: {
    zeroRuntime: true,
  },
  vite: {
    optimizeDeps: {
      include: ['html-to-image', 'jagajs/sanitize', 'marked'],
    },
  },
  routeRules: {
    // Static, content-only — prerender so Netlify serves plain HTML, no Function call.
    '/changelog': { prerender: true },
  },
  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'Storeshots',
      url: 'https://storeshots.org',
      logo: 'https://storeshots.org/logo.png',
      sameAs: [
        'https://github.com/eralpozcan/storeshots',
      ],
    },
  },
  sitemap: {
    enabled: true,
    exclude: ['/editor'],
    urls: [
      { loc: '/', changefreq: 'weekly', priority: 1.0, lastmod: new Date().toISOString() },
      { loc: '/privacy', changefreq: 'yearly', priority: 0.3 },
      { loc: '/cookies', changefreq: 'yearly', priority: 0.3 },
      { loc: '/terms', changefreq: 'yearly', priority: 0.3 },
      { loc: '/changelog', changefreq: 'weekly', priority: 0.5 },
    ],
  },
  robots: {
    enabled: true,
    sitemap: ['https://storeshots.org/sitemap.xml'],
    groups: [
      // Allow all generic crawlers
      { userAgent: ['*'], allow: '/', disallow: ['/editor'] },
      // Explicit allowlist — AI search / answer engines (read-time retrieval)
      { userAgent: ['GPTBot'], allow: '/' },
      { userAgent: ['OAI-SearchBot'], allow: '/' },
      { userAgent: ['ChatGPT-User'], allow: '/' },
      { userAgent: ['ClaudeBot'], allow: '/' },
      { userAgent: ['Claude-Web'], allow: '/' },
      { userAgent: ['PerplexityBot'], allow: '/' },
      { userAgent: ['Perplexity-User'], allow: '/' },
      { userAgent: ['Googlebot'], allow: '/' },
      { userAgent: ['Bingbot'], allow: '/' },
      // Explicit denylist — training-only crawlers
      { userAgent: ['CCBot'], disallow: '/' },
      { userAgent: ['anthropic-ai'], disallow: '/' },
      { userAgent: ['Bytespider'], disallow: '/' },
      { userAgent: ['Applebot-Extended'], disallow: '/' },
      { userAgent: ['Google-Extended'], disallow: '/' },
      { userAgent: ['FacebookBot'], disallow: '/' },
      { userAgent: ['meta-externalagent'], disallow: '/' },
      { userAgent: ['Amazonbot'], disallow: '/' },
      { userAgent: ['cohere-ai'], disallow: '/' },
    ],
  },
  security: {
    nonce: true,
    headers: {
      contentSecurityPolicy: {
        'base-uri': ["'self'", 'blob:'],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        // `'unsafe-inline'` is intentionally absent: nuxt-security injects a
        // per-request nonce into Nuxt's hydration scripts. `'unsafe-eval'`
        // stays for now because some bundled vendor code still needs it; can
        // be removed once we audit and prove no `eval`/`new Function` remains.
        'script-src': ["'self'", "'nonce-{{nonce}}'", "'strict-dynamic'", "'unsafe-eval'", 'https://cloud.umami.is'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'connect-src': ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://cloud.umami.is', 'https://api-gateway.umami.dev'],
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
