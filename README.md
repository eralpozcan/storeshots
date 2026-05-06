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
- **Quick-start templates** — Pre-filled tone of voice for SaaS / Game / Finance / Health. Auto-opens on a fresh editor; never overwrites the user's icon, screenshots, or AI key.
- **Inline slide editing** — Pencil button on each slide opens a modal with label + headline fields. No more scrolling the sidebar to find slide N.
- **Caption drag-to-reposition** — A "Move" button enters fine-tune mode where the caption position can be dragged in canvas-pixel space. The offset persists into bundle exports.
- **App Store preview** — A "Store preview" mode renders the first three slides in a simulated iOS App Store row so you can sanity-check what users see above the fold.
- **Sticky thumbnails strip** — Quick visual index of all 10 slides; click to scroll-jump to the one you care about.
- **Drag-to-reorder slides** — Reorder either screenshots or slide copy from the sidebar (copy + image move together).
- **Empty-state hints + keyboard shortcuts** — `⌘/Ctrl + E` exports all, `⌘/Ctrl + G` generates copy, `Esc` closes modals. Skips while typing.

### AI generation
- **Multi-provider** — Claude (Anthropic) with a model picker (Opus 4.7 / Sonnet 4.6 / Haiku 4.5 / older 3.5 Sonnet & Haiku), or 300+ models via OpenRouter (including free options).
- **Vision analysis** — Upload screenshots, AI analyses each screen and writes context-aware headlines. Free text-only models work too but generate generic copy.
- **Smart slide ordering** — AI reorders slides for maximum App Store conversion (hero → primary feature → differentiator → trust).
- **Copy variants** — Generate three tone-of-voice alternatives (confident · warm · punchy) to A/B test direction without rerunning the vision pipeline. Picking a variant preserves any per-slide position fine-tunes.
- **Multi-language** — Generate headlines in 13 locales (EN, TR, DE, FR, ES, IT, PT, NL, JA, KO, ZH, RU, AR).

### Style
- **Auto palette from screenshots** — A wand button on the Style step extracts a brand palette (primary + accent + bg gradient) via a tiny client-side colour quantiser. **No AI key required.** Skips near-white / near-black / near-grey buckets so the result reflects real brand colour, not background.
- **Manual brand palette** — 6-colour grid (primary, accent, dark/light text, bg gradient endpoints) with hex inputs and colour pickers.
- **10 slide templates** — Unique layouts with light / dark themes, gradient backgrounds, decorative blobs, single + dual-device compositions, and a centred "trust" closing slide.
- **Realistic device frames** — iPhone (PNG), Android phones, Android 7"/10" tablets (portrait + landscape), iPad (CSS-rendered).

### Export
- **One-click bundle export** — A "Bundle" dropdown produces every size a target store accepts in a single ZIP, organised by device-size folders. Three presets:
  - **App Store** — iPhone 6.9", 6.5", 6.3", 6.1" + iPad Pro 12.9", 11"
  - **Play Store** — Android Phone, 7" Tablet, 10" Tablet
  - **Everything** — union of both
- **Single-size export** — Per-slide PNG download via the explicit ⬇ Download button on each slide card. Card body is intentionally not a click target so users can't trigger downloads by accident.
- **Feature Graphic** — Dedicated 1024×500 Google Play banner template with its own download button.
- **Project save / load** — Versioned `.storeshots.json` snapshots include the full project state. The exported file strips the API key so a shared snapshot never leaks credentials.

### Privacy & security
- **Cookieless analytics** — [Umami](https://umami.is) (MIT-licensed, GDPR-safe) gated behind the analytics cookie-consent toggle via `useScriptTriggerConsent`. No third-party tracking.
- **API keys never leave the browser** — Held in `sessionStorage` for the current tab only, cleared on tab close, never written to localStorage or sent to anyone but the AI provider.
- **Hardened CSP** — Per-request nonce via `nuxt-security`, no `'unsafe-inline'` for scripts, narrow allowlist for the analytics origin.
- **Server-side input validation** — `/api/generate-copy`, `/api/copy-variants`, `/api/translate-copy` all enforce body size caps, field length limits, provider whitelist, and max-image checks.
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

Pick a provider (Claude / OpenRouter), paste a key, choose a model and language, then run one of:

| Button | What it does |
|--------|-------------|
| **✦ Headlines** | Analyses screenshots → generates matching headlines per slide |
| **✦ Full design** | Analyses screenshots → generates headlines + derives brand colour palette |

AI reorders slides for optimal App Store conversion: hero → primary feature → differentiator → supporting features → trust.

### 4. Headlines

Review and edit the generated copy. Drag rows to reorder. Or click the pencil icon on any preview slide to edit inline.

### 5. Style

Tweak the brand palette manually, or hit **Auto** to derive it from your uploaded screenshots client-side.

### Bundle and export

The toolbar's **Bundle** dropdown produces every size a target store accepts in a single ZIP. The **Project** dropdown saves / loads `.storeshots.json` snapshots so you never lose work.

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
| `claude-3-5-sonnet-20241022` | Older but still strong, vision-ready |
| `claude-3-5-haiku-20241022` | Older, cheap |

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

The **Bundle** dropdown produces every relevant size at once and packages the result as a ZIP.

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
| Font | Inter (via @nuxt/fonts) |
| SEO | @nuxtjs/seo (sitemap, robots, OG, schema.org) |
| Security | nuxt-security (CSP nonce, rate limiting) |
| Analytics | Umami via @nuxt/scripts (cookieless, consent-gated) |
| Markdown sanitiser | jagajs (zero-dep, serverless-safe) |
| Bundle export | jszip (client-side ZIP packaging) |
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
│   │   ├── CookieBanner.vue         # Granular cookie consent banner
│   │   ├── UpdateBanner.vue         # New-deploy refresh prompt
│   │   └── slides/
│   │       ├── DeviceFrames.vue     # iPhone / Android / iPad frames
│   │       ├── SlideTemplate.vue    # 10 slide templates with caption transform
│   │       ├── SlideBlob.vue        # Decorative blobs
│   │       ├── SlideCaption.vue     # Headline + label
│   │       └── FeatureGraphic.vue   # Google Play feature graphic
│   ├── composables/
│   │   ├── useScreenshots.ts        # Editor state, AI calls, export, project I/O
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
│       ├── color-extract.ts         # Client-side palette quantiser
│       └── analytics.ts             # Shared scriptsConsent trigger
├── server/api/
│   ├── generate-copy.post.ts        # Vision + text → slides + colours
│   ├── copy-variants.post.ts        # Three tone-of-voice alternatives
│   ├── translate-copy.post.ts       # Multi-locale translation
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
- AI vision analysis, copy variants, and smart slide ordering
- Caption drag-to-reposition fine-tuning
- One-click bundle exports for every store size
- Project save / load via portable `.storeshots.json` files
- Privacy-first analytics (Umami, cookieless, consent-gated)
- Per-deploy update detection with a Refresh prompt
- Multi-provider AI (Claude with model picker + OpenRouter with 300+ models)
- Multi-language headline generation (13 locales)

---

## License

[GNU Affero General Public License v3.0 or later](LICENSE) (AGPL-3.0-or-later).

Storeshots is free software. If you modify and run Storeshots as a network service (SaaS), the AGPL requires you to make the source code of your modified version available to your users. Self-hosting for your own team or customers is fine — forking it to run a competing hosted service requires you to open-source your changes.
