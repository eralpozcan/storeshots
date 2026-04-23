<script setup lang="ts">
definePageMeta({ layout: 'legal' })

useSeoMeta({
  title: 'Cookie Policy — Storeshots',
  description: 'What browser storage Storeshots uses, why, and how you can control it. No advertising cookies, no third-party trackers.',
  robots: 'index, follow',
})

const { openSettings } = useCookieConsent()

const LAST_UPDATED = '23 April 2026'
const GH_URL = 'https://github.com/eralpozcan/storeshots'

const sections = [
  { id: 'what', n: '01', title: 'What are cookies?' },
  { id: 'categories', n: '02', title: 'Categories we use' },
  { id: 'third-parties', n: '03', title: 'Third parties' },
  { id: 'dnt', n: '04', title: 'Do Not Track' },
  { id: 'self-hosted', n: '05', title: 'Self-hosted deployments' },
  { id: 'clear', n: '06', title: 'How to clear cookies' },
  { id: 'changes', n: '07', title: 'Changes to this policy' },
]

const necessaryCookies = [
  {
    name: 'storeshots:*',
    type: 'localStorage',
    purpose: 'Editor configuration: selected device, orientation, slide copy, palette, slide ordering.',
    retention: 'Until cleared by you',
  },
  {
    name: 'storeshots:apiKey:*',
    type: 'sessionStorage',
    purpose: 'Your AI provider API key, held only for the current browser tab so you don\'t have to paste it repeatedly.',
    retention: 'Cleared when you close the tab',
  },
  {
    name: 'storeshots:cookie-consent',
    type: 'localStorage',
    purpose: 'Remembers which categories you have accepted or rejected so we don\'t ask again on every visit.',
    retention: 'Until policy version changes or you revoke consent',
  },
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
          name="i-lucide-cookie"
          class="size-3.5 text-blue-600"
        />
        First-party only · No ad tracking
      </div>

      <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-gray-900">
        <span class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Cookie
        </span>
        Policy
      </h1>

      <p class="mt-5 max-w-2xl mx-auto text-lg text-gray-600 leading-relaxed">
        Storeshots runs in your browser. We use minimal, first-party storage to keep the editor usable — nothing else. Here is the full breakdown.
      </p>

      <div class="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
        <UButton
          trailing-icon="i-lucide-settings"
          size="lg"
          @click="openSettings"
        >
          Manage preferences
        </UButton>
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
          <UIcon
            name="i-lucide-clock"
            class="size-3.5"
          />
          Last updated: {{ LAST_UPDATED }}
        </div>
      </div>
    </div>
  </section>

  <!-- Content with TOC -->
  <section class="max-w-7xl mx-auto px-5 sm:px-8 mt-16 sm:mt-20 grid lg:grid-cols-[220px_1fr] gap-10 lg:gap-16">
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

    <article class="max-w-3xl space-y-12 sm:space-y-16 pb-12">
      <p class="text-lg text-gray-700 leading-relaxed">
        This page explains what <strong class="font-semibold text-gray-900">cookies and similar browser storage</strong> Storeshots uses, why we use them, and how you can control or remove them. Storeshots is designed to do as much as possible on your own device — so there is very little to disclose, but we want to be fully transparent.
      </p>

      <!-- 01 -->
      <div
        id="what"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            01
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            What are cookies?
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed">
          Cookies are small text files a website can place on your device. Browsers also offer related mechanisms — <code class="font-mono text-sm bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">localStorage</code>, <code class="font-mono text-sm bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">sessionStorage</code>, and <code class="font-mono text-sm bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">IndexedDB</code> — which behave similarly. In this policy, the word "cookies" covers all of them.
        </p>
      </div>

      <!-- 02 -->
      <div
        id="categories"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            02
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Categories we use
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed mb-6">
          Storeshots groups storage into four categories. You can toggle the non-essential ones any time via the
          <button
            type="button"
            class="text-blue-600 hover:underline font-medium cursor-pointer"
            @click="openSettings"
          >
            Cookie settings
          </button>
          link in the footer.
        </p>

        <!-- Strictly necessary -->
        <div class="rounded-2xl border border-gray-200 bg-white overflow-hidden mb-5">
          <div class="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200 bg-gray-50">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-shield-check"
                class="size-5 text-emerald-600"
              />
              <div>
                <h3 class="font-semibold text-gray-900">
                  Strictly necessary
                </h3>
                <p class="text-xs text-gray-500">
                  Always on — required for the editor to work. No opt-out needed under GDPR/ePrivacy.
                </p>
              </div>
            </div>
            <span class="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded bg-emerald-100 text-emerald-700">
              Always on
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-white">
                <tr>
                  <th class="text-left font-semibold text-gray-900 px-5 py-3 border-b border-gray-200">
                    Name
                  </th>
                  <th class="text-left font-semibold text-gray-900 px-5 py-3 border-b border-gray-200">
                    Type
                  </th>
                  <th class="text-left font-semibold text-gray-900 px-5 py-3 border-b border-gray-200">
                    Purpose
                  </th>
                  <th class="text-left font-semibold text-gray-900 px-5 py-3 border-b border-gray-200">
                    Retention
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(c, i) in necessaryCookies"
                  :key="c.name"
                  :class="i < necessaryCookies.length - 1 ? 'border-b border-gray-100' : ''"
                >
                  <td class="px-5 py-4 align-top">
                    <code class="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">{{ c.name }}</code>
                  </td>
                  <td class="px-5 py-4 align-top text-gray-700">
                    {{ c.type }}
                  </td>
                  <td class="px-5 py-4 align-top text-gray-700">
                    {{ c.purpose }}
                  </td>
                  <td class="px-5 py-4 align-top text-gray-700">
                    {{ c.retention }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Functional -->
        <div class="rounded-2xl border border-gray-200 bg-white p-5 mb-3">
          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-sliders-horizontal"
              class="size-5 text-blue-600 shrink-0 mt-0.5"
            />
            <div>
              <h3 class="font-semibold text-gray-900">
                Functional <span class="text-xs font-normal text-gray-500">· optional</span>
              </h3>
              <p class="text-sm text-gray-600 mt-1.5 leading-relaxed">
                Non-essential preferences we would like to remember across visits — for example the last device you designed for, UI language, or a dark-mode toggle. Disabling this category will not break the editor.
              </p>
            </div>
          </div>
        </div>

        <!-- Analytics -->
        <div class="rounded-2xl border border-gray-200 bg-white p-5 mb-3">
          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-bar-chart-3"
              class="size-5 text-indigo-600 shrink-0 mt-0.5"
            />
            <div>
              <h3 class="font-semibold text-gray-900">
                Analytics <span class="text-xs font-normal text-gray-500">· optional</span>
              </h3>
              <p class="text-sm text-gray-600 mt-1.5 leading-relaxed">
                Anonymous, aggregated usage data. We do not currently load any analytics script; when we do, it will be privacy-first (for example Plausible or a self-hosted equivalent) and gated behind this category.
              </p>
            </div>
          </div>
        </div>

        <!-- Marketing -->
        <div class="rounded-2xl border border-gray-200 bg-white p-5">
          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-megaphone"
              class="size-5 text-pink-600 shrink-0 mt-0.5"
            />
            <div>
              <h3 class="font-semibold text-gray-900">
                Marketing <span class="text-xs font-normal text-gray-500">· optional</span>
              </h3>
              <p class="text-sm text-gray-600 mt-1.5 leading-relaxed">
                Reserved for future use — for example referral attribution for Pro announcements. <strong class="font-semibold text-gray-900">We will never share data with ad networks</strong> and we will never set third-party advertising cookies.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 03 -->
      <div
        id="third-parties"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            03
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Third parties
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed mb-5">
          Storeshots sends requests directly from your browser to the AI provider whose API key you entered (Anthropic or OpenRouter). Those providers may set their own cookies on their own domains:
        </p>
        <div class="grid sm:grid-cols-2 gap-3">
          <a
            href="https://www.anthropic.com/legal/privacy"
            target="_blank"
            rel="noopener"
            class="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 hover:shadow-sm transition"
          >
            <span class="font-medium text-gray-900">Anthropic Privacy Policy</span>
            <UIcon
              name="i-lucide-arrow-up-right"
              class="size-4 text-gray-400 group-hover:text-gray-900 transition-colors"
            />
          </a>
          <a
            href="https://openrouter.ai/privacy"
            target="_blank"
            rel="noopener"
            class="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 hover:shadow-sm transition"
          >
            <span class="font-medium text-gray-900">OpenRouter Privacy Policy</span>
            <UIcon
              name="i-lucide-arrow-up-right"
              class="size-4 text-gray-400 group-hover:text-gray-900 transition-colors"
            />
          </a>
        </div>
        <p class="text-sm text-gray-600 mt-4">
          Storeshots does not share any identifier with these providers beyond the API request you initiate.
        </p>
      </div>

      <!-- 04 -->
      <div
        id="dnt"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-mono text-sm font-bold shadow-lg shadow-emerald-500/20">
            04
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Do Not Track
          </h2>
        </div>
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 flex gap-3">
          <UIcon
            name="i-lucide-shield"
            class="size-5 text-emerald-600 shrink-0 mt-0.5"
          />
          <p class="text-base text-emerald-900 leading-relaxed">
            If your browser sends a <code class="font-mono text-sm bg-white/70 px-1.5 py-0.5 rounded">DNT: 1</code> signal, Storeshots pre-selects <strong class="font-semibold">Reject all</strong> for the Analytics and Marketing categories. You can still opt back in from the settings panel if you want.
          </p>
        </div>
      </div>

      <!-- 05 -->
      <div
        id="self-hosted"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            05
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Self-hosted deployments
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed">
          Because Storeshots is released under the
          <a
            :href="`${GH_URL}/blob/main/LICENSE`"
            target="_blank"
            rel="noopener"
            class="text-blue-600 hover:underline font-medium"
          >AGPL-3.0</a>
          license, anyone can self-host a copy. If you are visiting a self-hosted instance, the operator of that instance is responsible for its cookie policy and any additional tracking they may have added. This policy describes the official site at <code class="font-mono text-sm bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">storeshots.org</code> only.
        </p>
      </div>

      <!-- 06 -->
      <div
        id="clear"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            06
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            How to clear cookies
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed">
          You can remove all Storeshots storage any time through your browser's privacy settings, or by clicking <strong class="font-semibold text-gray-900">Clear site data</strong> in the developer tools. You can also revoke your consent via the
          <button
            type="button"
            class="text-blue-600 hover:underline font-medium cursor-pointer"
            @click="openSettings"
          >
            Cookie settings
          </button>
          link in the footer.
        </p>
      </div>

      <!-- 07 -->
      <div
        id="changes"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            07
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Changes to this policy
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed">
          If we materially change this policy we will bump the internal policy version, which invalidates your previous consent and prompts you to review the new categories. The "Last updated" date above always reflects the current version.
        </p>
      </div>

    </article>
  </section>
</template>
