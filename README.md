# Storeshots

Generate professional, production-ready screenshots for **Apple App Store** and **Google Play** — with device mockups, customizable slide templates, AI-powered copywriting, and smart slide ordering.

> **Built upon** the concepts from [ParthJadhav/app-store-screenshots](https://github.com/ParthJadhav/app-store-screenshots) — an AI skill for generating store screenshots via coding agents. Storeshots takes that foundation and turns it into a **standalone visual application** with real-time preview, multi-device support, AI vision analysis, and one-click export.

![Beta](https://img.shields.io/badge/Status-Beta-orange)
![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js&logoColor=white)
![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)
![Nuxt UI](https://img.shields.io/badge/Nuxt%20UI-4-1173d4)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## Features

- **7 Device Types** — iPhone, Android Phone, Android 7" & 10" Tablet (portrait + landscape), iPad, Feature Graphic
- **10 Slide Templates** — Unique layouts with light/dark themes, gradient backgrounds, decorative elements
- **Device Mockups** — Realistic iPhone frame (PNG), Android & iPad frames (CSS-rendered)
- **AI Vision Analysis** — Upload screenshots, AI analyzes each screen and writes context-aware headlines
- **AI Color Extraction** — Derives brand color palette from your app's visual identity
- **Smart Slide Ordering** — AI reorders slides for maximum App Store conversion (hero → features → trust)
- **Drag & Drop** — Reorder both screenshots and slides with drag & drop
- **Multi-Provider AI** — Claude (Anthropic) or 300+ models via OpenRouter (including free models)
- **Multi-Language** — Generate headlines in 13 languages (English, Turkish, German, French, Spanish, and more)
- **One-Click Export** — Export individual slides or all at once as PNG at exact store resolutions
- **Bulk Upload** — Upload all screenshots at once, auto-fill into slots
- **Feature Graphic** — Dedicated 1024×500 Google Play banner template
- **Secure** — API keys stored in sessionStorage only (cleared when tab closes)

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server (port 3005)
pnpm dev

# Production build
pnpm build
```

Open [http://localhost:3005](http://localhost:3005) and start designing.

---

## How It Works

### 1. Enter App Info

- **App Icon** — Drag & drop or click to upload
- **App Name** — Your app's display name
- **Description** — Brief description (used by AI for context)
- **Features** — Key features, one per line

### 2. Upload Screenshots

Upload your actual app screenshots — these go inside the device mockups.

- **Upload All** — Select multiple files at once, auto-fills slots in order
- **Per-slot upload** — Click any slot to upload, supports multi-select (fills from that slot onward)
- **Drag & drop reorder** — Drag screenshots between slots to rearrange
- iPhone/iPad: up to 10 slides | Android: up to 8 slides

### 3. Generate with AI

Select your **app language** so AI can properly analyze your screenshots, then:

| Button | What it does |
|--------|-------------|
| **✦ Headlines** | Analyzes screenshots → generates matching headlines per slide |
| **✦ Full Design** | Analyzes screenshots → generates headlines + derives brand color palette |

AI will also **reorder your slides** for optimal App Store conversion:
1. **Hero** — Strongest benefit (visible without scrolling)
2. **Primary Feature** — Most-used feature
3. **Differentiator** — What makes your app unique
4. **Supporting Features** — Other features by importance
5. **Trust/Closing** — "Join X users", "Built for..."

> **Tip:** Vision-capable models (Claude, GPT-4o, Gemini) analyze your actual screenshots for much better results. Free text-only models work too but generate generic headlines.

### 4. Fine-tune

- **Drag & drop slides** — Reorder the slide list in the sidebar (copy + image move together)
- **Edit copy** — Manually adjust any label or headline
- **Adjust colors** — Fine-tune the 6-color brand palette

### 5. Export

- **Device tabs** — Switch between iPhone / Android / iPad / Feature Graphic
- **Size selector** — Choose export resolution
- **Export All** — Download all slides as PNGs in one click
- Click any slide card to export individually

---

## AI Providers

| Provider | Vision Support | Free? | How to Get a Key |
|----------|---------------|-------|-----------------|
| **Claude (Anthropic)** | Yes | No (pay-per-use) | [console.anthropic.com](https://console.anthropic.com) |
| **OpenRouter** | Depends on model | Free tier available | [openrouter.ai/keys](https://openrouter.ai/keys) |

### Recommended Vision Models (via OpenRouter)

| Model | Vision | Free? |
|-------|--------|-------|
| `google/gemini-2.0-flash-001` | Yes | No |
| `anthropic/claude-3-5-sonnet` | Yes | No |
| `openai/gpt-4o-mini` | Yes | No |

### Free Text-Only Models (via OpenRouter)

| Model | Vision |
|-------|--------|
| `google/gemini-2.0-flash-exp:free` | No |
| `meta-llama/llama-4-maverick:free` | No |
| `deepseek/deepseek-chat-v3-0324:free` | No |

> API keys are stored in **sessionStorage** — cleared automatically when you close the browser tab. Never persisted to disk.

---

## Export Sizes

### Apple App Store

| Device | Resolution |
|--------|-----------|
| iPhone 6.9" | 1320 × 2868 |
| iPhone 6.5" | 1284 × 2778 |
| iPhone 6.3" | 1206 × 2622 |
| iPhone 6.1" | 1125 × 2436 |
| iPad Pro 12.9" | 2048 × 2732 |
| iPad Pro 11" | 1668 × 2224 |

### Google Play Store

| Device | Resolution |
|--------|-----------|
| Android Phone | 1080 × 1920 |
| Android 7" Tablet (Portrait) | 1200 × 1920 |
| Android 7" Tablet (Landscape) | 1920 × 1200 |
| Android 10" Tablet (Portrait) | 1600 × 2560 |
| Android 10" Tablet (Landscape) | 2560 × 1600 |
| Feature Graphic | 1024 × 500 |

---

## Slide Templates

| # | Background | Layout | Best For |
|---|-----------|--------|----------|
| 1 | Light gradient | Title top, device bottom center | Hero / Main benefit |
| 2 | Light gradient | Title top, 2 devices (depth effect) | Second feature |
| 3 | Light gradient | Title bottom-left, device top-right | Third feature |
| 4 | **Dark gradient** | Title top, device bottom center | Highlight feature |
| 5 | Light gradient | Title top, device bottom center | Fifth feature |
| 6 | Light gradient | Title top, 2 devices (reversed) | Sixth feature |
| 7 | Light gradient | Title top, device bottom center | Seventh feature |
| 8 | Light gradient | Title bottom-left, device top-right | Eighth feature |
| 9 | **Dark gradient** | Title top, device bottom center | Ninth feature |
| 10 | **Dark gradient** | Centered icon + title, no device | Trust / Closing |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 + Vue 3 |
| UI Kit | @nuxt/ui 4 |
| Styling | Tailwind CSS 4 |
| Font | Inter (via @nuxt/fonts) |
| Export | html-to-image |
| AI | Claude API / OpenRouter API (vision + text) |

---

## Project Structure

```
storeshots/
├── app/
│   ├── pages/index.vue              # Main page (toolbar, preview, export)
│   ├── components/
│   │   ├── AppSidebar.vue           # Settings panel (drag & drop, AI generate)
│   │   ├── SlideCard.vue            # Preview card
│   │   └── slides/
│   │       ├── DeviceFrames.vue     # Device frames (iPhone/Android/iPad)
│   │       ├── SlideTemplate.vue    # 10 slide templates
│   │       ├── SlideBlob.vue        # Background decorative blobs
│   │       ├── SlideCaption.vue     # Headline + label
│   │       └── FeatureGraphic.vue   # Google Play feature graphic
│   ├── composables/
│   │   ├── useScreenshots.ts        # State, AI generation, export, reorder
│   │   └── useMockup.ts            # iPhone mockup preload
│   └── utils/
│       ├── types.ts                 # TypeScript types
│       ├── defaults.ts              # Default config + storage
│       └── canvas.ts                # Canvas dimensions + calculations
├── server/api/
│   └── generate-copy.post.ts        # AI endpoint (vision + text, multi-provider)
└── public/
    └── mockup.png                   # iPhone mockup image
```

---

## Security

- API keys → **sessionStorage** (cleared on tab close, never on disk)
- Design settings → **localStorage** (persistent, no sensitive data)
- Screenshots → **session memory** (not persisted)
- Export → **client-side only** via html-to-image (no server upload)

---

## Credits

Built upon the concepts from [ParthJadhav/app-store-screenshots](https://github.com/ParthJadhav/app-store-screenshots) — an AI skill that generates App Store screenshots through coding agents. Storeshots evolves that into a standalone visual application with:

- Real-time preview UI with drag & drop reordering
- AI vision analysis of uploaded screenshots
- Smart slide ordering for App Store conversion optimization
- Multi-device support (7 device types)
- Full Google Play support (Android Phone, Tablets, Feature Graphic)
- Multi-provider AI (Claude + OpenRouter with 300+ models)
- Multi-language headline generation (13 languages)

---

## Contributing

Contributions welcome! Areas of interest:

- New slide templates and layouts
- Additional device frames
- Export quality improvements
- AI prompt refinement
- Multi-language support expansion

---

## License

MIT
