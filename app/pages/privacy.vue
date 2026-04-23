<script setup lang="ts">
definePageMeta({ layout: 'legal' })

useSeoMeta({
  title: 'Privacy Policy — Storeshots',
  description: 'How Storeshots handles your data. Short version: we do not collect it. Everything happens in your browser.',
  robots: 'index, follow',
})

const LAST_UPDATED = '23 April 2026'
const GH_URL = 'https://github.com/eralpozcan/storeshots'

const sections = [
  { id: 'controller', n: '01', title: 'Who is the data controller?', icon: 'i-lucide-building-2' },
  { id: 'process', n: '02', title: 'What data we process', icon: 'i-lucide-database' },
  { id: 'dont-process', n: '03', title: 'What data we do NOT process', icon: 'i-lucide-shield-off' },
  { id: 'cookies', n: '04', title: 'Cookies & browser storage', icon: 'i-lucide-cookie' },
  { id: 'hosting', n: '05', title: 'Hosting and transmission', icon: 'i-lucide-server' },
  { id: 'legal-basis', n: '06', title: 'Legal basis for processing', icon: 'i-lucide-gavel' },
  { id: 'rights', n: '07', title: 'Your rights', icon: 'i-lucide-user-check' },
  { id: 'children', n: '08', title: 'Children', icon: 'i-lucide-baby' },
  { id: 'transfers', n: '09', title: 'International transfers', icon: 'i-lucide-globe' },
  { id: 'changes', n: '10', title: 'Changes to this policy', icon: 'i-lucide-refresh-cw' },
]
</script>

<template>
  <!-- Hero -->
  <section class="relative overflow-hidden border-b border-gray-200">
    <div
      aria-hidden="true"
      class="absolute inset-0 -z-10 pointer-events-none"
    >
      <div class="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-br from-blue-200/40 via-indigo-200/30 to-transparent blur-3xl" />
      <div class="absolute top-[10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-200/30 to-transparent blur-3xl" />
    </div>

    <div class="max-w-5xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-16 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white/70 backdrop-blur text-xs font-medium text-gray-700 mb-6">
        <UIcon
          name="i-lucide-shield-check"
          class="size-3.5 text-emerald-600"
        />
        GDPR & KVKK compliant
      </div>

      <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-gray-900">
        <span class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Privacy
        </span>
        Policy
      </h1>

      <p class="mt-5 max-w-2xl mx-auto text-lg text-gray-600 leading-relaxed">
        Short version: we don't collect your data. Storeshots runs entirely in your browser — no accounts, no server-side storage, no tracking.
      </p>

      <div class="mt-7 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
        <UIcon
          name="i-lucide-clock"
          class="size-3.5"
        />
        Last updated: {{ LAST_UPDATED }}
      </div>
    </div>
  </section>

  <!-- TLDR callout -->
  <section class="max-w-5xl mx-auto px-5 sm:px-8 -mt-8 relative z-10">
    <div class="grid md:grid-cols-3 gap-3">
      <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <UIcon
            name="i-lucide-user-x"
            class="size-4 text-emerald-600"
          />
          No accounts
        </div>
        <p class="mt-1.5 text-sm text-gray-600 leading-relaxed">
          We don't ask for your name, email, or phone. Nothing to sign up for.
        </p>
      </div>
      <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <UIcon
            name="i-lucide-server-off"
            class="size-4 text-emerald-600"
          />
          No server storage
        </div>
        <p class="mt-1.5 text-sm text-gray-600 leading-relaxed">
          Your screenshots and API keys never touch our servers — period.
        </p>
      </div>
      <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <UIcon
            name="i-lucide-eye-off"
            class="size-4 text-emerald-600"
          />
          No tracking
        </div>
        <p class="mt-1.5 text-sm text-gray-600 leading-relaxed">
          No ads, no analytics pixels, no session replay, no data brokers.
        </p>
      </div>
    </div>
  </section>

  <!-- Content with sticky TOC -->
  <section class="max-w-7xl mx-auto px-5 sm:px-8 mt-16 sm:mt-20 grid lg:grid-cols-[220px_1fr] gap-10 lg:gap-16">
    <!-- TOC -->
    <aside class="hidden lg:block">
      <div class="sticky top-24">
        <div class="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">
          On this page
        </div>
        <ol class="space-y-2 text-sm">
          <li
            v-for="s in sections"
            :key="s.id"
          >
            <a
              :href="`#${s.id}`"
              class="flex items-start gap-2 text-gray-600 hover:text-gray-900 transition-colors leading-snug py-1"
            >
              <span class="font-mono text-[10px] text-gray-400 pt-0.5">{{ s.n }}</span>
              <span>{{ s.title }}</span>
            </a>
          </li>
        </ol>
      </div>
    </aside>

    <!-- Body -->
    <article class="max-w-3xl space-y-12 sm:space-y-16 pb-12">
      <!-- Intro -->
      <p class="text-lg text-gray-700 leading-relaxed">
        This policy explains what personal data Storeshots processes, why, and the rights you have under the <strong class="font-semibold text-gray-900">EU General Data Protection Regulation (GDPR)</strong> and <strong class="font-semibold text-gray-900">Turkey's Personal Data Protection Law (KVKK, Law No. 6698)</strong>. The short version: Storeshots runs in your browser, we do not operate user accounts, and we do not collect your screenshots or your API keys on any server we control.
      </p>

      <!-- 01 -->
      <div
        id="controller"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            01
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Who is the data controller?
          </h2>
        </div>
        <div class="space-y-4 text-base text-gray-700 leading-relaxed">
          <p>
            The official Storeshots site at <code class="font-mono text-sm bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">storeshots.org</code> is operated by <strong class="font-semibold text-gray-900">Eralp Ozcan</strong>. You can reach the author through the
            <a
              :href="GH_URL"
              target="_blank"
              rel="noopener"
              class="text-blue-600 hover:underline font-medium"
            >GitHub repository</a>.
          </p>
          <div class="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 flex gap-3">
            <UIcon
              name="i-lucide-info"
              class="size-5 text-amber-600 shrink-0 mt-0.5"
            />
            <p class="text-sm text-amber-900 leading-relaxed">
              If you are using a <strong>self-hosted</strong> copy of Storeshots, the operator of that instance is the controller for their deployment, and this policy may not apply — check the privacy page on that site.
            </p>
          </div>
        </div>
      </div>

      <!-- 02 -->
      <div
        id="process"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            02
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            What data we process
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed mb-5">
          Because Storeshots is a client-side application, the following is the exhaustive list of data that leaves your browser:
        </p>
        <div class="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left font-semibold text-gray-900 px-5 py-3 border-b border-gray-200">
                  Data
                </th>
                <th class="text-left font-semibold text-gray-900 px-5 py-3 border-b border-gray-200">
                  When
                </th>
                <th class="text-left font-semibold text-gray-900 px-5 py-3 border-b border-gray-200">
                  Who receives it
                </th>
                <th class="text-left font-semibold text-gray-900 px-5 py-3 border-b border-gray-200">
                  Why
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="px-5 py-4 border-b border-gray-100 align-top text-gray-700">
                  HTTP request metadata (IP, user agent, referer)
                </td>
                <td class="px-5 py-4 border-b border-gray-100 align-top text-gray-700">
                  Every page load
                </td>
                <td class="px-5 py-4 border-b border-gray-100 align-top text-gray-700">
                  Netlify + Cloudflare
                </td>
                <td class="px-5 py-4 border-b border-gray-100 align-top text-gray-700">
                  Serving the page, security, rate limiting, DDoS protection
                </td>
              </tr>
              <tr>
                <td class="px-5 py-4 align-top text-gray-700">
                  Your uploaded screenshots, your prompts, your API key
                </td>
                <td class="px-5 py-4 align-top text-gray-700">
                  When you click "Generate"
                </td>
                <td class="px-5 py-4 align-top text-gray-700">
                  Your chosen AI provider (Anthropic or OpenRouter) — <strong class="font-semibold text-gray-900">directly from your browser</strong>
                </td>
                <td class="px-5 py-4 align-top text-gray-700">
                  Generating headlines and extracting colors. Storeshots servers never see this data.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 03 -->
      <div
        id="dont-process"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-mono text-sm font-bold shadow-lg shadow-emerald-500/20">
            03
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            What data we do NOT process
          </h2>
        </div>
        <div class="rounded-2xl border border-gray-200 bg-gradient-to-br from-emerald-50/50 to-transparent p-6 space-y-3">
          <div
            v-for="item in [
              'We do not collect names, email addresses, phone numbers, or other identifiers — there is no account system.',
              'We do not upload your screenshots to our servers.',
              'We do not store your AI provider API keys. They live only in your browser\'s sessionStorage and are wiped when you close the tab.',
              'We do not sell, rent, or share any data with advertisers or data brokers.',
              'We do not use third-party tracking pixels, heatmap tools, or session replay.',
            ]"
            :key="item"
            class="flex items-start gap-3 text-base text-gray-700 leading-relaxed"
          >
            <UIcon
              name="i-lucide-check"
              class="size-5 text-emerald-600 shrink-0 mt-0.5"
            />
            <span>{{ item }}</span>
          </div>
        </div>
      </div>

      <!-- 04 -->
      <div
        id="cookies"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            04
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Cookies and browser storage
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed">
          See the dedicated
          <NuxtLink
            to="/cookies"
            class="text-blue-600 hover:underline font-medium"
          >
            Cookie Policy
          </NuxtLink>
          for a full breakdown. In summary: only strictly necessary, first-party storage is used by default. Analytics and marketing categories are opt-in and currently unused.
        </p>
      </div>

      <!-- 05 -->
      <div
        id="hosting"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            05
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Hosting and transmission
          </h2>
        </div>
        <div class="space-y-4 text-base text-gray-700 leading-relaxed">
          <p>
            The official site is served by <strong class="font-semibold text-gray-900">Netlify</strong> (United States) fronted by <strong class="font-semibold text-gray-900">Cloudflare</strong>. Connection logs typically include your IP address and request time and are retained according to each provider's own policies:
          </p>
          <div class="grid sm:grid-cols-2 gap-3">
            <a
              href="https://www.netlify.com/privacy/"
              target="_blank"
              rel="noopener"
              class="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 hover:shadow-sm transition"
            >
              <span class="font-medium text-gray-900">Netlify Privacy Notice</span>
              <UIcon
                name="i-lucide-arrow-up-right"
                class="size-4 text-gray-400 group-hover:text-gray-900 transition-colors"
              />
            </a>
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener"
              class="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 hover:shadow-sm transition"
            >
              <span class="font-medium text-gray-900">Cloudflare Privacy Policy</span>
              <UIcon
                name="i-lucide-arrow-up-right"
                class="size-4 text-gray-400 group-hover:text-gray-900 transition-colors"
              />
            </a>
          </div>
          <p>
            All traffic is encrypted with TLS (HTTPS). We do not operate an application database, so there is no user data at rest on our side.
          </p>
        </div>
      </div>

      <!-- 06 -->
      <div
        id="legal-basis"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            06
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Legal basis for processing
          </h2>
        </div>
        <div class="grid gap-3">
          <div class="rounded-2xl border border-gray-200 bg-white p-5">
            <div class="text-xs font-mono text-gray-500 mb-1">
              GDPR Art. 6(1)(f)
            </div>
            <div class="font-semibold text-gray-900">
              Legitimate interest
            </div>
            <p class="text-sm text-gray-600 mt-1">
              Serving the site and basic security logging.
            </p>
          </div>
          <div class="rounded-2xl border border-gray-200 bg-white p-5">
            <div class="text-xs font-mono text-gray-500 mb-1">
              GDPR Art. 6(1)(a)
            </div>
            <div class="font-semibold text-gray-900">
              Consent
            </div>
            <p class="text-sm text-gray-600 mt-1">
              Any optional analytics or marketing storage — off by default.
            </p>
          </div>
          <div class="rounded-2xl border border-gray-200 bg-white p-5">
            <div class="text-xs font-mono text-gray-500 mb-1">
              GDPR Art. 6(1)(b)
            </div>
            <div class="font-semibold text-gray-900">
              Contract / pre-contract
            </div>
            <p class="text-sm text-gray-600 mt-1">
              The request you initiate to Anthropic or OpenRouter when you click Generate. You decide when to send it.
            </p>
          </div>
        </div>
      </div>

      <!-- 07 -->
      <div
        id="rights"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            07
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Your rights
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed mb-5">
          Under the GDPR and KVKK, you have the right to:
        </p>
        <div class="grid sm:grid-cols-2 gap-3">
          <div
            v-for="r in [
              'Be informed about what we process (this page).',
              'Access any personal data we hold about you — we hold none in an identifiable form.',
              'Request rectification, erasure, or restriction of processing.',
              'Object to processing based on legitimate interest.',
              'Data portability.',
              'Withdraw consent at any time.',
            ]"
            :key="r"
            class="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 leading-relaxed"
          >
            <UIcon
              name="i-lucide-check-circle-2"
              class="size-4 text-emerald-600 shrink-0 mt-0.5"
            />
            <span>{{ r }}</span>
          </div>
        </div>
        <p class="text-sm text-gray-600 mt-5">
          You may also lodge a complaint with your supervisory authority — for Turkey, the
          <a
            href="https://www.kvkk.gov.tr/"
            target="_blank"
            rel="noopener"
            class="text-blue-600 hover:underline font-medium"
          >Kişisel Verileri Koruma Kurumu (KVKK)</a>; for the EU, your national data protection authority.
        </p>
      </div>

      <!-- 08 -->
      <div
        id="children"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            08
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Children
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed">
          Storeshots is not directed at children under 16. We do not knowingly process data from children. If you believe a child has used the service, contact us and we will help you remove any local data on your device.
        </p>
      </div>

      <!-- 09 -->
      <div
        id="transfers"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            09
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            International transfers
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed">
          The hosting and AI providers listed above are based in the United States. When you use Storeshots, data you send (including images you upload and prompts) is transferred to those providers under their own standard contractual clauses and privacy frameworks.
        </p>
      </div>

      <!-- 10 -->
      <div
        id="changes"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            10
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Changes to this policy
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed">
          We will announce material changes by updating the "Last updated" date above and, where consent is affected, re-prompting for consent via the cookie banner.
        </p>
      </div>

    </article>
  </section>
</template>
