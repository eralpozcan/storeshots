<script setup lang="ts">
definePageMeta({ layout: 'legal' })

useSeoMeta({
  title: 'Terms of Service — Storeshots',
  description: 'Terms governing your use of storeshots.org and the open-source Storeshots software.',
  robots: 'index, follow',
})

const LAST_UPDATED = '23 April 2026'
const GH_URL = 'https://github.com/eralpozcan/storeshots'

const sections = [
  { id: 'agpl', n: '01', title: 'The Software is AGPL-3.0' },
  { id: 'pro', n: '02', title: 'Pro templates & commercial add-ons' },
  { id: 'service', n: '03', title: 'Use of the hosted Service' },
  { id: 'ip', n: '04', title: 'Generated content & IP' },
  { id: 'no-account', n: '05', title: 'No account, no data retention' },
  { id: 'availability', n: '06', title: 'Availability' },
  { id: 'third-party', n: '07', title: 'Third-party services' },
  { id: 'warranty', n: '08', title: 'Disclaimer of warranty' },
  { id: 'liability', n: '09', title: 'Limitation of liability' },
  { id: 'law', n: '10', title: 'Governing law' },
  { id: 'changes', n: '11', title: 'Changes to these terms' },
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
      <div class="absolute top-[10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-200/30 to-transparent blur-3xl" />
    </div>

    <div class="max-w-5xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-16 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white/70 backdrop-blur text-xs font-medium text-gray-700 mb-6">
        <UIcon
          name="i-lucide-scale"
          class="size-3.5 text-blue-600"
        />
        Plain-language terms
      </div>

      <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-gray-900">
        <span class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Terms
        </span>
        of Service
      </h1>

      <p class="mt-5 max-w-2xl mx-auto text-lg text-gray-600 leading-relaxed">
        Terms that govern your use of <code class="font-mono text-base bg-gray-100 px-1.5 py-0.5 rounded">storeshots.org</code> and the open-source Storeshots software.
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

  <!-- Key points -->
  <section class="max-w-5xl mx-auto px-5 sm:px-8 -mt-8 relative z-10">
    <div class="grid md:grid-cols-3 gap-3">
      <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <UIcon
            name="i-lucide-gift"
            class="size-4 text-blue-600"
          />
          Free forever
        </div>
        <p class="mt-1.5 text-sm text-gray-600 leading-relaxed">
          The core editor is free, open source, and AGPL-3.0 licensed.
        </p>
      </div>
      <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <UIcon
            name="i-lucide-crown"
            class="size-4 text-purple-600"
          />
          You own your output
        </div>
        <p class="mt-1.5 text-sm text-gray-600 leading-relaxed">
          Generated screenshots belong to you. No watermark, no licensing strings.
        </p>
      </div>
      <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <UIcon
            name="i-lucide-box"
            class="size-4 text-indigo-600"
          />
          Self-host friendly
        </div>
        <p class="mt-1.5 text-sm text-gray-600 leading-relaxed">
          Fork it, deploy it anywhere. AGPL copyleft applies to your fork too.
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
      <p class="text-lg text-gray-700 leading-relaxed">
        These terms govern your use of the hosted Storeshots service at <code class="font-mono text-base bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">storeshots.org</code> (the "Service") and, separately, the open-source Storeshots software (the "Software"). By using either, you agree to these terms. If you do not agree, please don't use the Service.
      </p>

      <!-- 01 -->
      <div
        id="agpl"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            01
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            The Software is AGPL-3.0
          </h2>
        </div>
        <div class="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-transparent p-6">
          <p class="text-base text-gray-700 leading-relaxed">
            The Storeshots source code is licensed under the
            <a
              :href="`${GH_URL}/blob/main/LICENSE`"
              target="_blank"
              rel="noopener"
              class="text-blue-600 hover:underline font-medium"
            >GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)</a>. That license — not these terms — governs your right to use, modify, and redistribute the source code.
          </p>
          <p class="mt-3 text-base text-gray-700 leading-relaxed">
            In particular, if you run a modified version of the Software as a network service, the AGPL requires you to make the modified source available to your users.
          </p>
        </div>
      </div>

      <!-- 02 -->
      <div
        id="pro"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            02
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Pro templates and commercial add-ons
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed">
          Separate "Pro" template packs, premium features, or support offerings may be released from time to time under a separate commercial license. Those offerings are <strong class="font-semibold text-gray-900">not</strong> covered by the AGPL-3.0 license of the core editor and are governed by the specific license that ships with each product.
        </p>
      </div>

      <!-- 03 -->
      <div
        id="service"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            03
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Use of the hosted Service
          </h2>
        </div>
        <div class="space-y-3">
          <div
            v-for="item in [
              { t: 'Free', d: 'The Service is provided free of charge, as is, without warranty of any kind. See the disclaimer in the AGPL-3.0 license.' },
              { t: 'Your content', d: 'You are responsible for the screenshots and content you upload and for ensuring you have the rights to process them with a third-party AI provider.' },
              { t: 'Your AI fees', d: 'You are responsible for any fees charged by the AI provider whose API key you supply. Storeshots does not bill you directly and does not receive a share of those fees.' },
              { t: 'Acceptable use', d: 'You must not use the Service to generate unlawful, infringing, defamatory, or harmful content, or attempt to circumvent AI provider safety mechanisms.' },
              { t: 'No abuse', d: 'You must not attempt to overload, disrupt, or reverse-engineer the Service\'s security controls.' },
            ]"
            :key="item.t"
            class="flex gap-4 rounded-xl border border-gray-200 bg-white p-5"
          >
            <div class="flex items-center justify-center size-8 rounded-lg bg-gray-100 text-gray-700 shrink-0">
              <UIcon
                name="i-lucide-check"
                class="size-4"
              />
            </div>
            <div>
              <div class="font-semibold text-gray-900 mb-1">
                {{ item.t }}
              </div>
              <p class="text-sm text-gray-600 leading-relaxed">
                {{ item.d }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 04 -->
      <div
        id="ip"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-mono text-sm font-bold shadow-lg shadow-emerald-500/20">
            04
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Intellectual property in generated content
          </h2>
        </div>
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
          <div class="flex gap-3">
            <UIcon
              name="i-lucide-crown"
              class="size-5 text-emerald-600 shrink-0 mt-0.5"
            />
            <div>
              <div class="font-semibold text-emerald-900 mb-1.5">
                Your outputs belong to you.
              </div>
              <p class="text-sm text-emerald-900/90 leading-relaxed">
                The PNG screenshots and text you produce with Storeshots are yours, subject to any restrictions imposed by the AI provider whose model generated the headlines (for example Anthropic's and OpenRouter's usage policies). Storeshots claims no ownership over your outputs and does not watermark them.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 05 -->
      <div
        id="no-account"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            05
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            No account, no data retention
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed">
          The Service does not require an account. We do not retain your uploaded screenshots, API keys, or generated text on any server we control. See the
          <NuxtLink
            to="/privacy"
            class="text-blue-600 hover:underline font-medium"
          >
            Privacy Policy
          </NuxtLink>
          for details.
        </p>
      </div>

      <!-- 06 -->
      <div
        id="availability"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            06
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Availability
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed">
          We aim to keep the Service available, but we offer no uptime guarantee. The Service may be suspended, modified, or discontinued at any time without notice — in which case the AGPL-3.0 Software remains available, and you are free to self-host it.
        </p>
      </div>

      <!-- 07 -->
      <div
        id="third-party"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            07
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Third-party services
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed">
          Storeshots integrates with AI providers (Anthropic, OpenRouter, and others you may add) and is served via Netlify + Cloudflare. Your use of those third parties is governed by their own terms. Storeshots is not responsible for their availability, pricing, or content policies.
        </p>
      </div>

      <!-- 08 -->
      <div
        id="warranty"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-mono text-sm font-bold shadow-lg shadow-amber-500/20">
            08
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Disclaimer of warranty
          </h2>
        </div>
        <div class="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 flex gap-3">
          <UIcon
            name="i-lucide-alert-triangle"
            class="size-5 text-amber-600 shrink-0 mt-0.5"
          />
          <p class="text-base text-amber-900 leading-relaxed">
            The Service and the Software are provided <strong class="font-semibold">"as is" and "as available", without warranty of any kind</strong>, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, non-infringement, or availability. See section 15 of the AGPL-3.0 license for the full disclaimer.
          </p>
        </div>
      </div>

      <!-- 09 -->
      <div
        id="liability"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-mono text-sm font-bold shadow-lg shadow-amber-500/20">
            09
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Limitation of liability
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed">
          To the maximum extent permitted by applicable law, Eralp Ozcan and any contributors to the Software shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, arising out of or in connection with your use of the Service or the Software. See section 16 of the AGPL-3.0 license.
        </p>
      </div>

      <!-- 10 -->
      <div
        id="law"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            10
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Governing law
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed">
          These terms are governed by the laws of the <strong class="font-semibold text-gray-900">Republic of Turkey</strong>, without regard to its conflict-of-law rules. Any dispute arising out of or related to the Service shall be brought exclusively in the courts of Istanbul, Turkey, subject to any non-waivable consumer protections granted by the law of your place of residence.
        </p>
      </div>

      <!-- 11 -->
      <div
        id="changes"
        class="scroll-mt-24"
      >
        <div class="flex items-center gap-4 mb-5">
          <div class="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono text-sm font-bold shadow-lg shadow-blue-500/20">
            11
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Changes to these terms
          </h2>
        </div>
        <p class="text-base text-gray-700 leading-relaxed">
          We may update these terms from time to time. Material changes will be announced by updating the "Last updated" date and, where appropriate, a notice on the home page. Your continued use of the Service after the update constitutes acceptance of the revised terms.
        </p>
      </div>

    </article>
  </section>
</template>
