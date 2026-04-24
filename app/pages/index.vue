<script setup lang="ts">
definePageMeta({ layout: false })

useSeoMeta({
  title: 'Storeshots — App Store & Google Play Screenshot Generator',
  description: 'Generate professional App Store & Google Play screenshots with AI-powered copywriting, device mockups, and smart slide ordering. Free & open source.',
  ogImage: 'https://storeshots.org/logo.png',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://storeshots.org/logo.png',
  robots: 'index, follow',
})

const GH_URL = 'https://github.com/eralpozcan/storeshots'

const { openSettings } = useCookieConsent()

const PUBLISHED_AT = '2026-04-01'
const UPDATED_AT = new Date().toISOString().slice(0, 10)

const faq = [
  {
    q: 'What is Storeshots?',
    a: 'Storeshots is a free, open-source web application that generates production-ready screenshots for the Apple App Store and Google Play. You upload your app\'s in-product screenshots, pick a target device (iPhone, Android phone, iPad, or Android tablet), and Storeshots wraps each screen in a realistic device mockup on a designed slide template. An AI vision model writes context-aware headlines, extracts a six-color brand palette, and reorders the slide deck for maximum store-page conversion. It runs entirely in your browser and is released under AGPL-3.0.',
  },
  {
    q: 'How much does Storeshots cost?',
    a: 'Storeshots is free. Every device type, every slide template, AI-generated headlines, color extraction, smart slide ordering, and PNG export is available at no cost under the AGPL-3.0 license. You bring your own AI API key (Anthropic or OpenRouter), so the only cost is what your chosen model provider charges — and OpenRouter offers free text-only and vision models that bring that to zero. A separate Pro template pack will be available later under a commercial license, but the core editor stays free forever.',
  },
  {
    q: 'Which App Store and Google Play sizes are supported?',
    a: 'Storeshots exports PNGs at the exact resolutions each store requires. Apple App Store: iPhone 6.7", iPhone 6.5", iPhone 5.5", iPad Pro 12.9", iPad 11". Google Play: Android phone, Android 7" tablet (portrait + landscape), Android 10" tablet (portrait + landscape), plus the 1024x500 Feature Graphic banner. You can export an individual slide or the full deck with one click.',
  },
  {
    q: 'Does Storeshots work offline?',
    a: 'The editor itself runs in your browser, so once the page is loaded it works offline for everything except AI features. AI headline generation and color extraction call your chosen provider (Anthropic or OpenRouter), which requires internet. PNG export happens entirely client-side — no server round-trip.',
  },
  {
    q: 'Where are my API keys stored?',
    a: 'API keys live only in your browser\'s sessionStorage, which is scoped to the current tab and wiped the moment you close it. Storeshots never sends keys to any server we control. Requests go directly from your browser to Anthropic or OpenRouter.',
  },
  {
    q: 'Can I self-host Storeshots?',
    a: 'Yes. The repository at github.com/eralpozcan/storeshots builds to a static Nitro/Netlify output and can be deployed to Netlify, Vercel, Cloudflare Pages, or any Node-compatible host. Because Storeshots is AGPL-3.0 licensed, any modified version you run as a network service must make its source available to its users.',
  },
  {
    q: 'How does the AI decide what headline to write for each screenshot?',
    a: 'When you click "Full Design" or "Headlines," Storeshots sends each screenshot to a vision-capable model (Claude, GPT-4o, Gemini, etc.) along with your app name, tagline, and target language. The model reads what\'s on each screen and writes a short benefit-focused headline that matches what users actually see. "Full Design" additionally derives a six-color palette and reorders slides so the strongest benefit appears first.',
  },
  {
    q: 'Which AI providers and models work best?',
    a: 'Vision-capable models produce the best results: Claude 3.5 Sonnet or newer, GPT-4o, and Gemini 1.5 Pro all analyze the actual screenshot content. Free text-only models on OpenRouter work too but generate generic headlines that don\'t reference what\'s on the screen. You can swap models at any time from the sidebar without re-uploading screenshots.',
  },
  {
    q: 'Is Storeshots open source?',
    a: 'Yes. The full source is on GitHub under the AGPL-3.0-or-later license. Fork it, contribute new slide templates, add device frames, or self-host your own copy. The license is copyleft: if you modify Storeshots and run it as a hosted service, you must share your changes under the same license.',
  },
]

useSchemaOrg([
  defineWebPage({
    name: 'Storeshots — App Store & Google Play Screenshot Generator',
    description: 'Generate professional App Store & Google Play screenshots with AI-powered copywriting, device mockups, and smart slide ordering. Free & open source.',
    url: 'https://storeshots.org',
    datePublished: PUBLISHED_AT,
    dateModified: UPDATED_AT,
    inLanguage: 'en',
  }),
  defineSoftwareApp({
    name: 'Storeshots',
    description: 'Open-source web app that generates App Store and Google Play screenshots with AI-powered copywriting, device mockups, and smart slide ordering.',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    url: 'https://storeshots.org',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      '7 device types (iPhone, Android, iPad, tablets, Google Play Feature Graphic)',
      '10 slide templates with light and dark themes',
      'AI vision analysis for context-aware headlines',
      'Smart slide ordering optimized for store conversion',
      'Brand color palette extraction',
      'Headline generation in 13 languages',
      'One-click PNG export at exact store resolutions',
      'Multi-provider AI (Anthropic Claude, OpenRouter 300+ models)',
      'Client-side only — no sign-up, no server uploads',
    ],
  }),
  ...faq.map(item => defineQuestion({
    name: item.q,
    acceptedAnswer: item.a,
  })),
])

const features = [
  {
    icon: 'i-lucide-sparkles',
    title: 'AI Vision Analysis',
    desc: 'Upload screenshots, AI reads each screen and writes context-aware headlines that match what users actually see.',
  },
  {
    icon: 'i-lucide-palette',
    title: 'AI Color Extraction',
    desc: 'Derives a 6-color brand palette from your app\'s visual identity — no manual color picking.',
  },
  {
    icon: 'i-lucide-list-ordered',
    title: 'Smart Slide Ordering',
    desc: 'AI reorders slides for maximum store conversion — hero → primary feature → differentiator → trust.',
  },
  {
    icon: 'i-lucide-smartphone',
    title: '7 Device Types',
    desc: 'iPhone, Android Phone, iPad, Android 7" & 10" tablets (portrait + landscape), plus Google Play Feature Graphic.',
  },
  {
    icon: 'i-lucide-layout-template',
    title: '10 Slide Templates',
    desc: 'Unique layouts with light/dark themes, gradient backgrounds, and decorative elements. Drag & drop to reorder.',
  },
  {
    icon: 'i-lucide-download',
    title: 'One-Click Export',
    desc: 'Export individual slides or all at once as PNG at exact Apple App Store and Google Play resolutions.',
  },
  {
    icon: 'i-lucide-languages',
    title: '13 Languages',
    desc: 'Generate headlines in English, Turkish, German, French, Spanish, Italian, Portuguese and more.',
  },
  {
    icon: 'i-lucide-cpu',
    title: 'Multi-Provider AI',
    desc: 'Claude (Anthropic) or 300+ models via OpenRouter — including free text-only options.',
  },
  {
    icon: 'i-lucide-shield-check',
    title: 'Secure by Default',
    desc: 'API keys live only in sessionStorage — cleared the moment you close the tab. No server storage.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Enter App Info',
    desc: 'App name, tagline, target language. Pick device type — iPhone, Android, iPad, or Feature Graphic.',
  },
  {
    n: '02',
    title: 'Upload Screenshots',
    desc: 'Drop all screens at once. Auto-fills slots — drag & drop to reorder any time.',
  },
  {
    n: '03',
    title: 'Generate with AI',
    desc: '✦ Headlines — context-aware copy per slide. ✦ Full Design — headlines + brand palette + smart slide ordering.',
  },
  {
    n: '04',
    title: 'Fine-tune',
    desc: 'Edit any label, tweak the 6-color palette, swap slide templates. Real-time preview.',
  },
  {
    n: '05',
    title: 'Export',
    desc: 'One-click PNG export at exact store resolutions. Individual slides or the full set.',
  },
]

const stats = [
  { value: '7', label: 'Device types' },
  { value: '10', label: 'Slide templates' },
  { value: '13', label: 'Languages' },
  { value: '300+', label: 'AI models' },
  { value: '100%', label: 'Free & OSS' },
]
</script>

<template>
  <div class="min-h-screen bg-white text-gray-900 font-[Inter,sans-serif] antialiased">
    <!-- Nav -->
    <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
      <nav class="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <NuxtLink
          to="/"
          class="flex items-center gap-2.5"
        >
          <img
            src="/logo.png"
            alt="Storeshots"
            class="h-8 w-8 rounded-md"
            width="32"
            height="32"
          >
          <span class="font-bold text-lg tracking-tight">Storeshots</span>
          <span class="hidden sm:inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 ml-1">
            BETA
          </span>
        </NuxtLink>

        <div class="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
          <a
            href="#features"
            class="hover:text-gray-900 transition-colors"
          >Features</a>
          <a
            href="#how"
            class="hover:text-gray-900 transition-colors"
          >How it works</a>
          <a
            href="#platforms"
            class="hover:text-gray-900 transition-colors"
          >Platforms</a>
          <a
            href="#ai"
            class="hover:text-gray-900 transition-colors"
          >AI</a>
          <a
            href="#faq"
            class="hover:text-gray-900 transition-colors"
          >FAQ</a>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            :to="GH_URL"
            target="_blank"
            color="neutral"
            variant="ghost"
            icon="i-lucide-github"
            class="hidden sm:inline-flex"
          >
            GitHub
          </UButton>
          <UButton
            to="/editor"
            trailing-icon="i-lucide-arrow-right"
          >
            Open Editor
          </UButton>
        </div>
      </nav>
    </header>

    <!-- Hero -->
    <section class="relative overflow-hidden">
      <!-- Decorative gradient -->
      <div
        aria-hidden="true"
        class="absolute inset-0 -z-10 pointer-events-none"
      >
        <div class="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-gradient-to-br from-blue-200/50 via-indigo-200/40 to-transparent blur-3xl" />
        <div class="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-200/40 to-transparent blur-3xl" />
        <div class="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-pink-200/40 to-transparent blur-3xl" />
      </div>

      <div class="max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-16 text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white/60 backdrop-blur text-xs font-medium text-gray-700 mb-7">
          <span class="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Open source · AGPL-3.0 licensed · No sign-up
          <UIcon
            name="i-lucide-arrow-up-right"
            class="size-3.5"
          />
        </div>

        <h1 class="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] text-gray-900 max-w-4xl mx-auto">
          Ship store screenshots
          <span class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            in minutes
          </span>
          — not days.
        </h1>

        <p class="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 leading-relaxed">
          Upload your app screenshots, let AI write context-aware headlines, pick a device mockup, and export pixel-perfect PNGs for
          <strong class="text-gray-900 font-semibold">App Store</strong> &
          <strong class="text-gray-900 font-semibold">Google Play</strong>.
        </p>

        <div class="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <UButton
            to="/editor"
            size="xl"
            trailing-icon="i-lucide-arrow-right"
            class="px-7"
          >
            Start designing — it's free
          </UButton>
          <UButton
            :to="GH_URL"
            target="_blank"
            size="xl"
            color="neutral"
            variant="outline"
            icon="i-lucide-github"
            class="px-7"
          >
            Star on GitHub
          </UButton>
        </div>

        <p class="mt-5 text-xs text-gray-500">
          Runs 100% in your browser. No account. No server uploads. API keys stay in your tab.
        </p>

        <!-- Hero visual — dual platform preview -->
        <div class="mt-16 sm:mt-20 relative">
          <div class="absolute inset-x-0 -bottom-8 h-40 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
          <div class="relative mx-auto max-w-3xl">
            <div class="absolute -inset-6 bg-gradient-to-tr from-blue-500/20 via-indigo-500/10 to-purple-500/20 rounded-[2rem] blur-2xl" />

            <div class="relative grid grid-cols-2 gap-4 sm:gap-8 items-end">
              <!-- App Store slide (iPhone) -->
              <figure class="flex flex-col items-center">
                <figcaption class="mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <UIcon
                    name="i-lucide-apple"
                    class="size-3.5"
                  />
                  App Store · iPhone 6.7"
                </figcaption>
                <div class="relative w-full max-w-[220px] aspect-[9/19.5] rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-4 shadow-2xl shadow-indigo-900/30 ring-1 ring-black/5">
                  <div class="text-center text-white pt-1">
                    <div class="text-[13px] sm:text-sm font-bold leading-tight tracking-tight">
                      Track every rental<br>in one tap.
                    </div>
                    <div class="mt-1 text-[9px] opacity-80 font-medium">
                      AI-generated headline
                    </div>
                  </div>
                  <!-- Phone frame -->
                  <div class="mt-3 mx-auto w-full aspect-[9/17] rounded-[1.25rem] bg-gray-900 p-1.5 shadow-xl ring-2 ring-white/20">
                    <div class="relative w-full h-full rounded-[1rem] bg-white overflow-hidden">
                      <div class="absolute top-1 left-1/2 -translate-x-1/2 h-3 w-12 rounded-full bg-gray-900 z-10" />
                      <!-- Fake app UI -->
                      <div class="h-full flex flex-col pt-5 px-2 bg-gradient-to-b from-blue-50 to-white">
                        <div class="text-[8px] font-bold text-gray-900 px-1">
                          Dashboard
                        </div>
                        <div class="mt-1.5 rounded-md bg-blue-600 text-white p-1.5">
                          <div class="text-[7px] opacity-80">
                            Monthly rent
                          </div>
                          <div class="text-[11px] font-bold leading-none mt-0.5">
                            ₺42,500
                          </div>
                        </div>
                        <div class="mt-1 space-y-1">
                          <div
                            v-for="n in 3"
                            :key="n"
                            class="flex items-center gap-1 rounded bg-white shadow-sm px-1 py-1"
                          >
                            <div class="size-3 rounded bg-emerald-400" />
                            <div class="flex-1">
                              <div class="h-1 w-8 rounded bg-gray-300" />
                              <div class="h-1 w-5 rounded bg-gray-200 mt-0.5" />
                            </div>
                            <div class="h-1 w-3 rounded bg-gray-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </figure>

              <!-- Google Play slide (Android) -->
              <figure class="flex flex-col items-center">
                <figcaption class="mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <UIcon
                    name="i-lucide-play"
                    class="size-3.5"
                  />
                  Google Play · Android
                </figcaption>
                <div class="relative w-full max-w-[220px] aspect-[9/19.5] rounded-[2rem] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-4 shadow-2xl shadow-emerald-900/30 ring-1 ring-black/5">
                  <div class="text-center text-white pt-1">
                    <div class="text-[13px] sm:text-sm font-bold leading-tight tracking-tight">
                      Know your cash flow<br>before month-end.
                    </div>
                    <div class="mt-1 text-[9px] opacity-90 font-medium">
                      Smart-ordered slide · 02
                    </div>
                  </div>
                  <!-- Phone frame (Android — squarer) -->
                  <div class="mt-3 mx-auto w-full aspect-[9/17] rounded-[0.9rem] bg-gray-900 p-1.5 shadow-xl ring-2 ring-white/20">
                    <div class="relative w-full h-full rounded-[0.6rem] bg-white overflow-hidden">
                      <div class="absolute top-1 right-2 size-1.5 rounded-full bg-gray-900 z-10" />
                      <!-- Fake app UI -->
                      <div class="h-full flex flex-col pt-4 px-2 bg-gradient-to-b from-emerald-50 to-white">
                        <div class="flex items-center justify-between px-1">
                          <div class="text-[8px] font-bold text-gray-900">
                            Cash flow
                          </div>
                          <div class="text-[7px] text-emerald-600 font-bold">
                            +12%
                          </div>
                        </div>
                        <!-- Fake chart -->
                        <div class="mt-1.5 h-10 rounded-md bg-white shadow-sm p-1 flex items-end gap-0.5">
                          <div
                            v-for="(h, i) in [30, 45, 35, 60, 50, 75, 90]"
                            :key="i"
                            class="flex-1 rounded-sm bg-gradient-to-t from-emerald-500 to-teal-400"
                            :style="{ height: h + '%' }"
                          />
                        </div>
                        <div class="mt-1 grid grid-cols-2 gap-1">
                          <div
                            v-for="n in 4"
                            :key="n"
                            class="rounded bg-white shadow-sm p-1"
                          >
                            <div class="h-1 w-4 rounded bg-gray-300" />
                            <div class="h-1.5 w-6 rounded bg-gray-800 mt-0.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </figure>
            </div>

            <!-- Caption strip -->
            <div class="mt-6 mx-auto max-w-md flex items-center justify-center gap-2 text-[11px] font-medium text-gray-500">
              <span class="inline-flex items-center gap-1">
                <span class="size-1.5 rounded-full bg-blue-500" />
                1290×2796
              </span>
              <span class="text-gray-300">·</span>
              <span class="inline-flex items-center gap-1">
                <span class="size-1.5 rounded-full bg-emerald-500" />
                1080×1920
              </span>
              <span class="text-gray-300">·</span>
              <span>PNG export · pixel-perfect</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="border-y border-gray-200 bg-gray-50">
      <div class="max-w-7xl mx-auto px-5 sm:px-8 py-10 grid grid-cols-2 sm:grid-cols-5 gap-y-8 gap-x-4">
        <div
          v-for="s in stats"
          :key="s.label"
          class="text-center"
        >
          <div class="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {{ s.value }}
          </div>
          <div class="mt-1 text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
            {{ s.label }}
          </div>
        </div>
      </div>
    </section>

    <!-- What is Storeshots (citability passage) -->
    <section
      id="what"
      class="py-20 sm:py-28"
    >
      <div class="max-w-3xl mx-auto px-5 sm:px-8">
        <span class="text-xs font-bold uppercase tracking-widest text-blue-600">
          Overview
        </span>
        <h2 class="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
          What is Storeshots?
        </h2>
        <div class="mt-6 space-y-5 text-lg text-gray-700 leading-relaxed">
          <p>
            <strong class="text-gray-900">Storeshots is a free, open-source web application</strong> that generates production-ready screenshots for the Apple App Store and Google Play. You upload your app&rsquo;s in-product screenshots, pick a target device &mdash; iPhone, Android phone, iPad, or Android tablet &mdash; and Storeshots wraps each screen in a realistic device mockup on a designed slide template.
          </p>
          <p>
            An AI vision model &mdash; Anthropic Claude directly or any of 300+ models via OpenRouter &mdash; reads each screenshot, writes a context-aware headline, extracts a six-color brand palette from your visual identity, and reorders the slide deck for maximum store-page conversion. Storeshots exports PNGs at the exact resolutions each store requires.
          </p>
          <p>
            It runs entirely in your browser, requires no sign-up, and is released under the <strong class="text-gray-900">AGPL-3.0 license</strong>. Your API keys live only in sessionStorage and are cleared the moment you close the tab.
          </p>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section
      id="features"
      class="py-20 sm:py-28 border-t border-gray-200"
    >
      <div class="max-w-7xl mx-auto px-5 sm:px-8">
        <div class="max-w-2xl mx-auto text-center mb-14">
          <span class="text-xs font-bold uppercase tracking-widest text-blue-600">
            Features
          </span>
          <h2 class="mt-3 text-3xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Everything you need, nothing you don't.
          </h2>
          <p class="mt-4 text-lg text-gray-600">
            No bloated editor, no locked templates, no watermarks. A focused tool for one job — stunning store screenshots.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="f in features"
            :key="f.title"
            class="group relative rounded-2xl border border-gray-200 bg-white p-6 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-900/5 transition"
          >
            <div class="inline-flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 mb-4 group-hover:scale-105 transition-transform">
              <UIcon
                :name="f.icon"
                class="size-5"
              />
            </div>
            <h3 class="text-base font-semibold text-gray-900">
              {{ f.title }}
            </h3>
            <p class="mt-1.5 text-sm text-gray-600 leading-relaxed">
              {{ f.desc }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section
      id="how"
      class="py-20 sm:py-28 bg-gradient-to-b from-gray-50 to-white border-y border-gray-200"
    >
      <div class="max-w-7xl mx-auto px-5 sm:px-8">
        <div class="max-w-2xl mx-auto text-center mb-14">
          <span class="text-xs font-bold uppercase tracking-widest text-blue-600">
            How it works
          </span>
          <h2 class="mt-3 text-3xl sm:text-5xl font-bold tracking-tight text-gray-900">
            From raw screenshots to store-ready — in five steps.
          </h2>
        </div>

        <ol class="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          <li
            v-for="(s, i) in steps"
            :key="s.n"
            class="relative rounded-2xl border border-gray-200 bg-white p-6"
            :class="i === 2 ? 'lg:ring-2 lg:ring-blue-500 lg:ring-offset-2' : ''"
          >
            <div class="font-mono text-xs font-bold text-blue-600 mb-3">
              {{ s.n }}
            </div>
            <h3 class="text-base font-semibold text-gray-900">
              {{ s.title }}
            </h3>
            <p class="mt-2 text-sm text-gray-600 leading-relaxed">
              {{ s.desc }}
            </p>
          </li>
        </ol>

        <div class="mt-10 flex justify-center">
          <UButton
            to="/editor"
            size="lg"
            trailing-icon="i-lucide-arrow-right"
          >
            Try it now
          </UButton>
        </div>
      </div>
    </section>

    <!-- Platforms -->
    <section
      id="platforms"
      class="py-20 sm:py-28"
    >
      <div class="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-blue-600">
            Platforms
          </span>
          <h2 class="mt-3 text-3xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Built for Apple App Store & Google Play.
          </h2>
          <p class="mt-5 text-lg text-gray-600 leading-relaxed">
            Export at exact store resolutions — iPhone 6.7", 6.5", 5.5", iPad 12.9" & 11", Android phones and 7"/10" tablets, plus the Google Play 1024×500 feature graphic.
          </p>

          <ul class="mt-7 space-y-3 text-gray-700">
            <li class="flex items-start gap-3">
              <UIcon
                name="i-lucide-check-circle-2"
                class="size-5 text-emerald-600 mt-0.5 shrink-0"
              />
              <span><strong class="font-semibold text-gray-900">iPhone & iPad</strong> — realistic device frame mockups for every display size Apple accepts.</span>
            </li>
            <li class="flex items-start gap-3">
              <UIcon
                name="i-lucide-check-circle-2"
                class="size-5 text-emerald-600 mt-0.5 shrink-0"
              />
              <span><strong class="font-semibold text-gray-900">Android phones & tablets</strong> — CSS-rendered frames, portrait + landscape, 7" and 10".</span>
            </li>
            <li class="flex items-start gap-3">
              <UIcon
                name="i-lucide-check-circle-2"
                class="size-5 text-emerald-600 mt-0.5 shrink-0"
              />
              <span><strong class="font-semibold text-gray-900">Feature Graphic</strong> — dedicated 1024×500 Google Play banner template.</span>
            </li>
            <li class="flex items-start gap-3">
              <UIcon
                name="i-lucide-check-circle-2"
                class="size-5 text-emerald-600 mt-0.5 shrink-0"
              />
              <span><strong class="font-semibold text-gray-900">Pixel-perfect export</strong> — PNG at the exact resolution each store expects. Upload and ship.</span>
            </li>
          </ul>
        </div>

        <div class="relative">
          <div class="absolute -inset-4 bg-gradient-to-br from-blue-500/15 to-purple-500/15 rounded-3xl blur-2xl" />
          <div class="relative grid grid-cols-2 gap-4">
            <div class="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
              <UIcon
                name="i-lucide-apple"
                class="size-8 mb-3"
              />
              <div class="text-xs font-semibold opacity-60 uppercase tracking-wider">
                Apple
              </div>
              <div class="text-xl font-bold mt-1">
                App Store
              </div>
              <div class="mt-4 space-y-1 text-sm opacity-80">
                <div>iPhone 6.7"</div>
                <div>iPhone 6.5"</div>
                <div>iPhone 5.5"</div>
                <div>iPad 12.9" · 11"</div>
              </div>
            </div>
            <div class="rounded-2xl border border-gray-200 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
              <UIcon
                name="i-lucide-play"
                class="size-8 mb-3"
              />
              <div class="text-xs font-semibold opacity-80 uppercase tracking-wider">
                Google
              </div>
              <div class="text-xl font-bold mt-1">
                Play Store
              </div>
              <div class="mt-4 space-y-1 text-sm opacity-90">
                <div>Android Phone</div>
                <div>Android 7" Tablet</div>
                <div>Android 10" Tablet</div>
                <div>Feature Graphic</div>
              </div>
            </div>
            <div class="col-span-2 rounded-2xl border border-gray-200 bg-white p-5 flex items-center gap-4">
              <div class="flex -space-x-2">
                <div class="size-10 rounded-xl bg-blue-100 border-2 border-white flex items-center justify-center">
                  <UIcon
                    name="i-lucide-smartphone"
                    class="size-5 text-blue-600"
                  />
                </div>
                <div class="size-10 rounded-xl bg-purple-100 border-2 border-white flex items-center justify-center">
                  <UIcon
                    name="i-lucide-tablet"
                    class="size-5 text-purple-600"
                  />
                </div>
                <div class="size-10 rounded-xl bg-pink-100 border-2 border-white flex items-center justify-center">
                  <UIcon
                    name="i-lucide-image"
                    class="size-5 text-pink-600"
                  />
                </div>
              </div>
              <div>
                <div class="text-sm font-semibold text-gray-900">
                  Portrait + Landscape
                </div>
                <div class="text-xs text-gray-500">
                  Every orientation, every resolution — covered.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- AI Providers -->
    <section
      id="ai"
      class="py-20 sm:py-28 bg-gradient-to-b from-gray-50 to-white border-t border-gray-200"
    >
      <div class="max-w-5xl mx-auto px-5 sm:px-8 text-center">
        <span class="text-xs font-bold uppercase tracking-widest text-blue-600">
          AI
        </span>
        <h2 class="mt-3 text-3xl sm:text-5xl font-bold tracking-tight text-gray-900">
          Bring your own model. Any model.
        </h2>
        <p class="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
          Plug in Claude directly, or tap into 300+ models through OpenRouter — including free vision and text-only options. Your API key never leaves the browser.
        </p>

        <div class="mt-12 grid md:grid-cols-2 gap-5">
          <div class="rounded-2xl border border-gray-200 bg-white p-8 text-left">
            <div class="flex items-center gap-3 mb-4">
              <div class="size-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <UIcon
                  name="i-lucide-sparkle"
                  class="size-5 text-orange-600"
                />
              </div>
              <div>
                <div class="font-semibold text-gray-900">
                  Anthropic Claude
                </div>
                <div class="text-xs text-gray-500">
                  Direct API
                </div>
              </div>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">
              Vision-capable by default. Analyzes each screenshot and writes headlines that reference what's actually on the screen.
            </p>
          </div>

          <div class="rounded-2xl border border-gray-200 bg-white p-8 text-left">
            <div class="flex items-center gap-3 mb-4">
              <div class="size-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <UIcon
                  name="i-lucide-network"
                  class="size-5 text-indigo-600"
                />
              </div>
              <div>
                <div class="font-semibold text-gray-900">
                  OpenRouter
                </div>
                <div class="text-xs text-gray-500">
                  300+ models, one key
                </div>
              </div>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">
              GPT-4o, Gemini, Llama, Mistral — swap models freely. Free text-only models work too for generic headlines.
            </p>
          </div>
        </div>

        <div class="mt-8 inline-flex items-center gap-2 text-sm text-gray-500">
          <UIcon
            name="i-lucide-lock"
            class="size-4"
          />
          Keys stored in sessionStorage — cleared when you close the tab.
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section
      id="faq"
      class="py-20 sm:py-28 border-t border-gray-200"
    >
      <div class="max-w-3xl mx-auto px-5 sm:px-8">
        <div class="text-center mb-14">
          <span class="text-xs font-bold uppercase tracking-widest text-blue-600">
            FAQ
          </span>
          <h2 class="mt-3 text-3xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Frequently asked questions
          </h2>
        </div>

        <div class="space-y-4">
          <details
            v-for="item in faq"
            :key="item.q"
            class="group rounded-2xl border border-gray-200 bg-white p-6 open:shadow-sm open:border-gray-300 transition"
          >
            <summary class="flex items-center justify-between cursor-pointer list-none">
              <h3 class="text-base sm:text-lg font-semibold text-gray-900 pr-6">
                {{ item.q }}
              </h3>
              <UIcon
                name="i-lucide-plus"
                class="size-5 text-gray-400 shrink-0 transition-transform group-open:rotate-45"
              />
            </summary>
            <p class="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
              {{ item.a }}
            </p>
          </details>
        </div>

        <p class="mt-10 text-center text-sm text-gray-500">
          Didn't find your answer?
          <a
            :href="`${GH_URL}/issues`"
            target="_blank"
            rel="noopener"
            class="text-blue-600 hover:underline font-medium"
          >Open an issue on GitHub</a>.
        </p>
      </div>
    </section>

    <!-- Open Source CTA -->
    <section class="py-20 sm:py-28">
      <div class="max-w-5xl mx-auto px-5 sm:px-8">
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-10 sm:p-16">
          <div
            aria-hidden="true"
            class="absolute inset-0 opacity-30"
          >
            <div class="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-500 to-purple-500 blur-3xl" />
            <div class="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 blur-3xl" />
          </div>

          <div class="relative text-center max-w-2xl mx-auto">
            <UIcon
              name="i-lucide-github"
              class="size-10 mb-5"
            />
            <h2 class="text-3xl sm:text-5xl font-bold tracking-tight">
              Free and open source. Forever.
            </h2>
            <p class="mt-5 text-lg text-gray-300 leading-relaxed">
              AGPL-3.0 licensed. Self-host it, fork it, contribute new templates — it's yours. Star the repo if Storeshots saved you an afternoon.
            </p>
            <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <UButton
                :to="GH_URL"
                target="_blank"
                size="xl"
                color="neutral"
                icon="i-lucide-star"
                class="bg-white text-gray-900 hover:bg-gray-100"
              >
                Star on GitHub
              </UButton>
              <UButton
                to="/editor"
                size="xl"
                variant="ghost"
                trailing-icon="i-lucide-arrow-right"
                :ui="{ base: 'bg-transparent text-white ring-1 ring-inset ring-white/30 hover:bg-white/10 hover:text-white' }"
              >
                Open the editor
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-gray-200">
      <div class="max-w-7xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Storeshots"
            class="h-7 w-7 rounded-md"
            width="28"
            height="28"
          >
          <span class="font-semibold text-gray-900">Storeshots</span>
          <span class="text-sm text-gray-500">
            · AGPL-3.0 © {{ new Date().getFullYear() }}
          </span>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-500">
          <a
            :href="GH_URL"
            target="_blank"
            rel="noopener"
            class="hover:text-gray-900 flex items-center gap-1.5"
          >
            <UIcon
              name="i-lucide-github"
              class="size-4"
            />
            GitHub
          </a>
          <a
            :href="`${GH_URL}/blob/main/CONTRIBUTING.md`"
            target="_blank"
            rel="noopener"
            class="hover:text-gray-900"
          >
            Contribute
          </a>
          <NuxtLink
            to="/editor"
            class="hover:text-gray-900"
          >
            Editor
          </NuxtLink>
          <NuxtLink
            to="/privacy"
            class="hover:text-gray-900"
          >
            Privacy
          </NuxtLink>
          <NuxtLink
            to="/cookies"
            class="hover:text-gray-900"
          >
            Cookies
          </NuxtLink>
          <NuxtLink
            to="/terms"
            class="hover:text-gray-900"
          >
            Terms
          </NuxtLink>
          <button
            type="button"
            class="hover:text-gray-900 cursor-pointer"
            @click="openSettings"
          >
            Cookie settings
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>
