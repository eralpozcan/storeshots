# Storeshots

Generate professional, production-ready screenshots for **Apple App Store** and **Google Play** — with device mockups, customisable slide templates, AI-powered copywriting, smart slide ordering, and one-click bundle export for every store size.

> Live: **[storeshots.org](https://storeshots.org)** · Open source · Free to use · Bring your own AI key.

> **Built upon** the concepts from [ParthJadhav/app-store-screenshots](https://github.com/ParthJadhav/app-store-screenshots) — an AI skill for generating store screenshots via coding agents. Storeshots takes that foundation and turns it into a **standalone visual application** with a guided editor, real-time preview, drag-to-reposition fine-tuning, project files, store bundle exports, and a privacy-first analytics stack.

[![Netlify Status](https://api.netlify.com/api/v1/badges/dff75e51-1b94-45d2-b6f5-97f0149f5c80/deploy-status)](https://app.netlify.com/projects/storeshots/deploys)
![Beta](https://img.shields.io/badge/Status-Beta-orange)
![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js&logoColor=white)
![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)
![Nuxt UI](https://img.shields.io/badge/Nuxt%20UI-4-1173d4)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-AGPL--3.0-blue)

See the full [`CHANGELOG.md`](CHANGELOG.md) or the [`/changelog` page](https://storeshots.org/changelog) on the live site for release history.

---

## Features

### Editor
- **Guided 5-step wizard sidebar** — Basics · Screenshots · AI · Headlines · Style. Single-open accordion with step-completion hints so a new user always knows what to do next.
- **Quick-start templates** — Pre-filled tone of voice for SaaS / Game / Finance / Health, and each seeds the AI brief with an audience/tone hint for its vertical. Auto-opens on a fresh editor; never overwrites the user's icon, screenshots, or AI key.
- **Focused canvas editing** — Open any slide in focused mode to drag, resize, and rotate individual elements (caption, device, icon, chips) directly on the canvas. Layout is stored per element, persists into exports, and rides along in the project file.
- **Per-device screenshot picker for paired layouts** — Two-phone layouts (V2/V6) let you pick a different uploaded screenshot per frame, each with its own delete button — no more automatic "next slide" reuse and the collisions it caused.
- **Apply layout to all languages** — Layout stays per-language by default (different word lengths need different placement), but one action copies the current slide's layout into every language at once, leaving text untouched.
- **Inline slide editing** — Pencil button on each slide opens a modal with label + headline fields. No more scrolling the sidebar to find slide N.
- **Headline ASO guidance** — Live word/line counter warns when a headline exceeds the ASO limit (≤5 words/line, ≤2 lines), plus a "Fold" badge on slides 1–3 to flag what shows above the fold.
- **Store preview** — A "Store preview" mode renders the leading slides in a simulated store row (platform-aware App Store / Play Store labels) for every device except the feature graphic.
- **Per-language editing** — Generated languages are kept in state (`copyByLocale`); a language tab bar above the canvas lets you switch and edit copy per language, with a green dot marking languages that already have copy.
- **Sticky thumbnails strip** — Quick visual index of all 10 slides; click to scroll-jump to the one you care about.
- **Drag-to-reorder slides** — Reorder either screenshots or slide copy from the sidebar (copy + image move together).
- **Empty-state hints + keyboard shortcuts** — `⌘/Ctrl + E` exports all, `⌘/Ctrl + G` generates copy, `Esc` closes modals. Skips while typing.

### AI generation
- **Multi-provider** — Claude (Anthropic) with a model picker (Opus 4.7 / Sonnet 4.6 / Haiku 4.5), or 300+ models via OpenRouter (including free options).
- **Vision analysis** — Upload screenshots, AI analyses each screen and writes context-aware headlines. Free text-only models work too but generate generic copy.
- **AI brief** — An optional free-text box steers copy generation (audience, tone, keywords, differentiators) on top of the app name, description, and screenshots. Fed into ✦ Headlines, ✦ Full design, and multi-language generation.
- **Smart slide ordering** — AI reorders slides for maximum App Store conversion (hero → primary feature → differentiator → trust).
- **AI-suggested feature chips** — ✦ Full design returns a prioritised feature list that fills the feature-graphic chips and the Key features field, ready to revise.
- **Copy variants** — Generate three tone-of-voice alternatives (confident · warm · punchy) to A/B test direction without rerunning the vision pipeline. Picking a variant preserves any per-slide position fine-tunes.
- **Multi-language** — Generate headlines in 28 locales (EN, DE, FR, ES, PT, PT-PT, IT, NL, PL, RU, UK, SV, DA, NO, FI, CS, RO, HU, TR, AR, HI, JA, ZH, ZH-TW, KO, ID, VI, TH).
- **Translations manager** — A side-by-side table of every selected language. Edit any label/headline inline, **import** a language from JSON (`[{label, headline}]`) or CSV, **export** a language's copy as JSON, and **AI-translate** from one source language into the others (translates the copy you already have instead of re-deriving it from screenshots).

### Style
- **Auto palette from screenshots** — A wand button on the Style step extracts a brand palette (primary + accent + bg gradient) via a tiny client-side colour quantiser. **No AI key required.** Reads the active device's screenshots, skipping near-white / near-black / near-grey buckets so the result reflects real brand colour, not background.
- **Manual brand palette** — 6-colour grid (primary, accent, dark/light text, bg gradient endpoints) with hex inputs and colour pickers.
- **Typeface picker** — Eight built-in fonts (Inter, Poppins, Montserrat, DM Sans, Space Grotesk, Roboto, Playfair Display, Lora) each previewed in its own typeface, plus upload of your own `.ttf`/`.otf`/`.woff`/`.woff2` (max 2 MB). The chosen font applies to every slide, embeds into PNG exports, and travels inside the exported `.storeshots.json`.
- **10 slide templates** — Unique layouts with light / dark themes, gradient backgrounds, decorative blobs, single + dual-device compositions, and a centred "trust" closing slide.
- **Realistic device frames** — iPhone (PNG), Android phones, Android 7"/10" tablets (portrait + landscape), iPad (CSS-rendered).

### Export
- **Configurable export dialog** — A single **Export** button opens a panel to pick any combination of languages × devices × sizes and download them as one ZIP, nested as `<language>/<device>/<size>/NN-label.png` (the language folder is omitted when only one language is selected). Three store presets act as one-click quick-fills:
  - **App Store** — iPhone 6.9", 6.5", 6.3", 6.1" + iPad Pro 12.9", 11"
  - **Play Store** — Android Phone, 7" Tablet, 10" Tablet
  - **Everything** — union of both
- **Single-size export** — Per-slide PNG download via the explicit ⬇ Download button on each slide card. Card body is intentionally not a click target so users can't trigger downloads by accident.
- **Editable Feature Graphic** — The 1024×500 Google Play banner is fully editable: drag, resize, and rotate the app icon, text, and feature chips; add or remove elements; reset to default. Custom layouts ride along in the project file.
- **Project save / load** — Versioned `.storeshots.json` snapshots include the full project state. The exported file strips the API key so a shared snapshot never leaks credentials.

### Privacy & security
- **Cookieless analytics** — [Umami](https://umami.is) (MIT-licensed, GDPR-safe) gated behind the analytics cookie-consent toggle via `useScriptTriggerConsent`. No third-party tracking.
- **API keys never leave the browser** — Held in `sessionStorage` for the current tab only, cleared on tab close, never written to localStorage or sent to anyone but the AI provider.
- **Hardened CSP** — Per-request nonce via `nuxt-security`, no `'unsafe-inline'` for scripts, narrow allowlist for the analytics origin.
- **Server-side input validation** — `/api/generate-copy`, `/api/copy-variants`, `/api/translate` all enforce body size caps, field length limits, provider whitelist, and max-image checks.
- **Update banner** — When a new deploy goes live, open tabs detect the change by polling `/api/version` (every 5 min and on tab focus) and surface a "Refresh" prompt instead of silently 404-ing on stale hashed asset URLs.

---

## Quick start

```bash
# Install dependencies
pnpm install

# Start dev server (port 3005)
pnpm dev

# Production build
pnpm build
```

Open [http://localhost:3005](http://localhost:3005) and start designing.

### Environment variables

Copy `.env.example` to `.env` and fill in the values you need:

```bash
# Optional — Umami analytics (cookieless, GDPR-safe)
NUXT_PUBLIC_UMAMI_WEBSITE_ID=
NUXT_PUBLIC_UMAMI_HOST=https://cloud.umami.is
```

The editor itself works without any environment variables. Analytics and AI are entirely opt-in.

---

## How it works

The editor is a five-step wizard. The sidebar nav at the top of every panel marks completed steps with a green dot.

### 1. Basics

App icon (drag-and-drop dropzone), app name, description (with a 600-character counter), and key features as a chip input. The description and features feed AI prompts.

### 2. Screenshots

Upload your actual app screenshots — these go inside the device mockups. Up to 10 per device. Drag thumbnails to reorder. "Upload All" picks multiple files at once and fills slots in order.

### 3. AI

Pick a provider (Claude / OpenRouter), paste a key, choose a model and language, optionally write an AI brief, then run one of:

| Button | What it does |
|--------|-------------|
| **✦ Headlines** | Analyses screenshots → generates matching headlines per slide |
| **✦ Full design** | Analyses screenshots → generates headlines + feature chips + derives brand colour palette |

AI reorders slides for optimal App Store conversion: hero → primary feature → differentiator → supporting features → trust.

### 4. Headlines

Review and edit the generated copy. Drag rows to reorder, or click the pencil icon on any preview slide to edit inline. Open the **Translations** dialog to manage every selected language side by side — edit, import/export, or AI-translate.

### 5. Style

Tweak the brand palette manually, hit **Auto** to derive it from your uploaded screenshots client-side, and pick a typeface (built-in or your own uploaded font).

### Export

The toolbar's **Export** button opens a dialog to pick any combination of languages × devices × sizes and download them as one ZIP. The **Project** dropdown saves / loads `.storeshots.json` snapshots so you never lose work.

---

## AI providers

| Provider | Vision | Free? | How to get a key |
|----------|--------|-------|------------------|
| **Claude (Anthropic)** | Yes (every model) | No (pay-per-use) | [console.anthropic.com](https://console.anthropic.com) |
| **OpenRouter** | Depends on model | Free tier available | [openrouter.ai/keys](https://openrouter.ai/keys) |

### Claude models exposed in the picker

| Model | Best for |
|-------|----------|
| `claude-opus-4-7` | Highest quality, most nuanced copy |
| `claude-sonnet-4-6` | Balanced (default) |
| `claude-haiku-4-5-20251001` | Fast and cheap |

### Recommended OpenRouter models

| Model | Vision | Free? |
|-------|--------|-------|
| `google/gemini-2.0-flash-001` | Yes | No |
| `anthropic/claude-3-5-sonnet` | Yes | No |
| `openai/gpt-4o-mini` | Yes | No |
| `google/gemini-2.0-flash-exp:free` | No | Yes |
| `meta-llama/llama-4-maverick:free` | No | Yes |
| `deepseek/deepseek-chat-v3-0324:free` | No | Yes |

> API keys are stored in **sessionStorage** — cleared automatically when you close the tab. Never persisted to disk, never sent to anyone but the AI provider.

---

## Export sizes

### Apple App Store

| Device | Resolution |
|--------|-----------|
| iPhone 6.9" | 1320 × 2868 |
| iPhone 6.5" | 1284 × 2778 |
| iPhone 6.3" | 1206 × 2622 |
| iPhone 6.1" | 1125 × 2436 |
| iPad Pro 12.9" | 2048 × 2732 |
| iPad Pro 11"  | 1668 × 2224 |

### Google Play Store

| Device | Resolution |
|--------|-----------|
| Android Phone | 1080 × 1920 |
| Android 7" Tablet (Portrait) | 1200 × 1920 |
| Android 7" Tablet (Landscape) | 1920 × 1200 |
| Android 10" Tablet (Portrait) | 1600 × 2560 |
| Android 10" Tablet (Landscape) | 2560 × 1600 |
| Feature Graphic | 1024 × 500 |

The **Export** dialog produces every selected size at once and packages the result as a ZIP.

---

## Slide templates

| # | Background | Layout | Best for |
|---|-----------|--------|----------|
| 1 | Light gradient | Title top, device bottom centre | Hero / main benefit |
| 2 | Light gradient | Title top, two devices (depth) | Second feature |
| 3 | Light gradient | Title bottom-left, device top-right | Third feature |
| 4 | **Dark gradient** | Title top, device bottom centre | Highlight feature |
| 5 | Light gradient | Title top, device bottom centre | Fifth feature |
| 6 | Light gradient | Title top, two devices (reversed) | Sixth feature |
| 7 | Light gradient | Title top, device bottom centre | Seventh feature |
| 8 | Light gradient | Title bottom-left, device top-right | Eighth feature |
| 9 | **Dark gradient** | Title top, device bottom centre | Ninth feature |
| 10 | **Dark gradient** | Centred icon + title, no device | Trust / closing |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Nuxt 4 + Vue 3 |
| UI kit | @nuxt/ui 4 |
| Styling | Tailwind CSS 4 |
| Fonts | @nuxt/fonts + 8 built-in typefaces + custom font upload |
| SEO | @nuxtjs/seo (sitemap, robots, OG, schema.org) |
| Security | nuxt-security (CSP nonce, rate limiting) |
| Analytics | Umami via @nuxt/scripts (cookieless, consent-gated) |
| Markdown | marked (render) + jagajs/sanitize (zero-dep, serverless-safe) |
| ZIP export | jszip (client-side packaging) |
| PNG capture | html-to-image |
| AI | Anthropic Messages API · OpenRouter Chat Completions |

---

## Project structure

```
storeshots/
├── app/
│   ├── pages/
│   │   ├── index.vue                # Marketing landing
│   │   ├── editor.vue               # Editor (toolbar, preview, modals)
│   │   ├── changelog.vue            # Release notes (rendered from CHANGELOG.md)
│   │   ├── cookies.vue              # Cookie policy
│   │   ├── privacy.vue              # Privacy policy
│   │   └── terms.vue                # Terms of service
│   ├── components/
│   │   ├── AppSidebar.vue           # 5-step wizard sidebar
│   │   ├── SlideCard.vue            # Preview card (edit / move / download buttons)
│   │   ├── TranslationsManager.vue  # Side-by-side per-language copy table
│   │   ├── CookieBanner.vue         # Granular cookie consent banner
│   │   ├── UpdateBanner.vue         # New-deploy refresh prompt
│   │   └── slides/
│   │       ├── DeviceFrames.vue     # iPhone / Android / iPad frames
│   │       ├── SlideTemplate.vue    # 10 slide templates with caption transform
│   │       ├── SlideElementRenderer.vue # Draggable per-element renderer
│   │       ├── SlideTransformOverlay.vue # Drag / resize / rotate handles
│   │       ├── SlideBlob.vue        # Decorative blobs
│   │       ├── SlideCaption.vue     # Headline + label
│   │       └── FeatureGraphic.vue   # Editable Google Play feature graphic
│   ├── composables/
│   │   ├── useScreenshots.ts        # Editor state, AI calls, export, project I/O
│   │   ├── useElementOverride.ts    # Per-element layout overrides
│   │   ├── useCookieConsent.ts      # Versioned consent state + DNT respect
│   │   ├── useUpdateAvailable.ts    # /api/version polling + visibility check
│   │   └── useMockup.ts             # iPhone PNG preload
│   ├── layouts/
│   │   └── legal.vue                # Shared header/footer for legal & changelog
│   └── utils/
│       ├── types.ts                 # UserConfig, SlideCopy, BrandColors
│       ├── defaults.ts              # DEFAULT_CONFIG + load/save
│       ├── canvas.ts                # Canvas dims + STORE_PRESETS
│       ├── templates.ts             # Quick-start templates (SaaS / Game / Finance / Health)
│       ├── locales.ts              # Language list for picker + translations
│       ├── fonts.ts                # Built-in typefaces + custom font handling
│       ├── anchor.ts               # Element anchor / transform math
│       ├── color-extract.ts         # Client-side palette quantiser
│       └── analytics.ts             # Shared scriptsConsent trigger
├── server/api/
│   ├── generate-copy.post.ts        # Vision + text → slides + colours
│   ├── copy-variants.post.ts        # Three tone-of-voice alternatives
│   ├── translate.post.ts            # Multi-locale translation
│   └── version.get.ts               # Build id used by the update banner
├── public/
│   ├── mockup.png                   # iPhone mockup image
│   ├── llms.txt                     # AI engine discovery file
│   └── favicons / icons             # PWA icons + OG images
├── CHANGELOG.md                     # Release notes (rendered into /changelog)
├── netlify.toml                     # Build config + cache headers
└── nuxt.config.ts                   # Modules, security, SEO, runtime config
```

---

## Security

- **API keys** → `sessionStorage` (cleared on tab close, never on disk).
- **Project state** → `localStorage` (no credentials, image data lives in memory only and is included in `.storeshots.json` exports).
- **Export** → 100% client-side via `html-to-image`; no server upload.
- **CSP** → per-request nonce, no `'unsafe-inline'` for scripts, narrow `connect-src` allowlist.
- **Server endpoints** → body size caps, per-field length limits, provider whitelist, content-type checks.
- **Cookie consent** → versioned state, respects Do Not Track, banner gates analytics until the user accepts.

See [`SECURITY.md`](SECURITY.md) (if present) for vulnerability disclosure.

---

## Contributing

Contributions welcome! Read the **[Contributing Guide](CONTRIBUTING.md)** before submitting a PR.

Areas of interest:

- New slide templates and layouts
- Additional device frames (foldables, smartwatch, etc.)
- AI lifestyle scenes (pre-rendered backgrounds with screen placeholders)
- Export quality improvements
- AI prompt refinement
- Multi-language support expansion
- ASO content hub articles

---

## Credits

Built upon the concepts from [ParthJadhav/app-store-screenshots](https://github.com/ParthJadhav/app-store-screenshots) — an AI skill that generates App Store screenshots through coding agents. Storeshots evolves that into a standalone visual application with:

- A guided 5-step wizard editor with quick-start templates
- AI vision analysis, an AI brief, copy variants, and smart slide ordering
- Focused per-element canvas editing (drag / resize / rotate) plus an editable feature graphic
- A typeface picker with custom font upload
- Configurable exports (languages × devices × sizes) for every store size
- Project save / load via portable `.storeshots.json` files
- Privacy-first analytics (Umami, cookieless, consent-gated)
- Per-deploy update detection with a Refresh prompt
- Multi-provider AI (Claude with model picker + OpenRouter with 300+ models)
- Multi-language headline generation (28 locales) with a translations manager

---

## License

[GNU Affero General Public License v3.0 or later](LICENSE) (AGPL-3.0-or-later).

Storeshots is free software. If you modify and run Storeshots as a network service (SaaS), the AGPL requires you to make the source code of your modified version available to your users. Self-hosting for your own team or customers is fine — forking it to run a competing hosted service requires you to open-source your changes.
