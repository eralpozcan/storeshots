# Changelog

All notable changes to Storeshots are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project loosely
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.10.0] — 2026-06-04

### Added
- **Typeface picker with custom font upload**. Brand style now has a Typeface
  section with eight built-in fonts — Inter, Poppins, Montserrat, DM Sans,
  Space Grotesk, Roboto, Playfair Display, Lora — each previewed in its own
  typeface, plus an Upload button for your own `.ttf`/`.otf`/`.woff`/`.woff2`
  (max 2 MB, extension + size validated). The chosen font applies to every
  slide's text and is embedded into PNG exports; a custom font is saved with the
  project and travels inside the exported `.storeshots.json`.

### Changed
- **Cookie consent is now stored in a small first-party cookie**
  (`storeshots_consent`, ~120 bytes) instead of localStorage, so it travels with
  the request (readable during SSR) and stays minimal. A returning visitor's
  existing localStorage consent is migrated into the cookie once and the old key
  is cleared, so nobody is re-prompted.

### Fixed
- **Android phone mockup now matches modern devices**. The frame borrowed the
  iPhone's aspect ratio (≈9:18) and painted its own fake camera punch-hole on
  top of the one already in the uploaded screenshot, so captures looked like a
  different/older device and the cutouts never lined up. The frame now uses a
  ~9:20 ratio (Pixel/Galaxy) and the painted punch-hole is gone, so the
  screenshot's real status bar and cutout show through.

## [0.9.0] — 2026-06-04

### Added
- **Per-language editing in the editor**. Generated languages are now kept in
  state (`copyByLocale`) instead of being produced and discarded at export
  time. A language tab bar above the canvas (shown when 2+ languages are
  selected) lets you switch between languages, see how each one reads, and
  edit copy inline — every edit is saved per language. A green dot marks
  languages that already have copy.
- **Configurable export dialog**. A single **Export** button opens a panel to
  pick any combination of languages × devices × sizes and download them as one
  ZIP, nested as `<language>/<device>/<size>/NN-label.png` (the language folder
  is omitted when only one language is selected). Store presets (App Store,
  Play Store, Everything) act as one-click quick-fills for the device/size
  checkboxes.
- **Parallel slide capture**. Slides within a single device/size frame are now
  captured concurrently (capped at 3) to speed up large multi-target exports.

### Changed
- **Language generation is centralized in the sidebar**. The sidebar's
  ✦ Headlines / ✦ Full design buttons now generate copy for *every* selected
  language at once (previously only the active one), filling the editor's
  language tabs. This removes the earlier duplicate "Translate all" trigger and
  unifies generation under one mental model.
- **Export is unified**. The separate "Export All", "Bundle", and "Locales"
  buttons are replaced by the single language-aware Export dialog above.

### Fixed
- **AI generation no longer fails with `Bad escaped character in JSON`**.
  Model responses that contain invalid backslash escapes or raw control
  characters are now repaired before parsing, across `/api/generate-copy` and
  `/api/copy-variants`. Valid `\n` line breaks are preserved.
- **iPhone 6.1″ export size corrected** from the retired `1125×2436` to
  `1179×2556`, which App Store Connect accepts. All four iPhone sizes now match
  the store's accepted dimensions.
- **Exports are now the exact selected pixel size**. Capture used a 2× pixel
  ratio, producing double-sized images (e.g. `1320×2868` → `2640×5736`) that
  the store rejected; it now renders at 1×.
- **Uploaded screenshots are no longer dropped on AI generate**. When the AI
  returned a partial, duplicate, or out-of-range `imageIndex` set, some
  screenshots were reordered to `null`. Reordering is now lossless — any
  uploaded image the AI didn't place is re-homed into a free slot.
- **Editor no longer crashes after layout/variant edits across languages**.
  Editing a slide beyond a shorter language's copy length left a sparse array
  with `undefined` entries (`Cannot read properties of undefined (reading
  'label')`); copy is now densified on every write.

## [0.8.1] — 2026-06-03

### Fixed
- **AI generation no longer fails with `413 Payload Too Large`**. Uploaded
  screenshots are now downscaled client-side to a ~1024px JPEG before being
  sent to `/api/generate-copy`, cutting the request body ~10–20×. Full-res
  base64 images previously exceeded the hosting proxy's body limit, so the
  request was rejected before reaching the handler. Falls back to the
  original data URL if a canvas resize fails.
- **AI generation no longer fails with `404 "No endpoints found"`**. The
  OpenRouter model slugs `anthropic/claude-3-5-sonnet` and
  `google/gemini-2.0-flash-001`, plus the free quick-pick chips
  (`gemini-2.0-flash-exp:free`, `llama-4-maverick:free`,
  `deepseek-chat-v3-0324:free`), had been retired by OpenRouter. Replaced
  the default model, server fallbacks, and sidebar quick-picks with current
  slugs (`anthropic/claude-sonnet-4.6`, `google/gemini-2.5-flash`, and live
  free vision models `gemma-4:free`, `nemotron-vl:free`, `kimi-k2:free`).
  Removed the retired Claude 3.5 entries from the Claude model picker.

### Added
- **Comma-separated feature input** — the sidebar feature field now accepts
  several comma-separated features at once, de-duplicating against existing
  ones, instead of one entry per submit.

### Changed
- pnpm build-script allowlist moved from `package.json`'s `pnpm` field to
  `pnpm-workspace.yaml` (`onlyBuiltDependencies`), the canonical location for
  pnpm 11. Fixes `ERR_PNPM_IGNORED_BUILDS` aborting `nuxt dev`'s pre-dev
  install check.

## [0.8.0] — 2026-05-24

### Added
- **Layout customization — focused canvas with full transform controls**.
  Each slide can now be repositioned, resized, and rotated freely instead
  of being locked to a fixed template. Closes the most-asked feature
  request (issue #5).
  - **Focused canvas mode** — clicking the new ✥ "Edit layout" button on
    any slide opens a single-slide editor that takes over the canvas
    area. Thumb strip at the bottom for quick jumping between slides;
    ESC or the Close button returns to the grid.
  - **Move drag** — grab any device frame or caption to reposition it.
    Holding Shift locks motion to the dominant axis; release within 2%
    of canvas center, edges, or the element's original position to snap
    magnetically. Alt suppresses snap for fine positioning.
  - **Figma-style resize** — devices get 4 aspect-locked corner handles,
    captions get E/W edge handles. The opposite corner stays fixed
    while the grabbed handle follows the cursor (the element's anchor
    migrates on pointerdown so subsequent renders inherit the new
    pinning). Widths snap to 25/50/75/100% and the original value.
  - **Free rotation** — a ⟳ handle above each element rotates around
    its center. Holding Shift snaps to 15° increments for clean
    angles. Available on devices and captions.
  - **Layout variant picker** — focused header has a dropdown of all
    10 baseline variants with one-line descriptions. Switching variant
    drops any element/position overrides since they belong to the old
    layout.
  - **Add and remove elements** — focused header's "+ Add" dropdown
    inserts a Device frame, Caption text, or App icon centered on the
    canvas. Each element gets a red × button on hover to remove it.
  - **Reset Layout** — single header button wipes elements + variant +
    position back to the slide's default. Always rendered (disabled
    when there's nothing to reset) so the escape hatch is discoverable.

### Internal
- Replaced the 10 hardcoded variant branches in `SlideTemplate.vue`
  with a data-driven iteration over a `SlideElement[]` discriminated
  union (device / caption / blob / icon). The original variants live
  on as `VARIANT_PRESETS` in `canvas.ts` for backwards compatibility;
  blobs and backgrounds stay slide-level for this phase since they
  have no planned per-element UI.
- New `useElementOverride` composable centralizes the read/write
  bookkeeping: clones the preset on first edit, drops overrides
  cleanly when they match the preset again, and handles the
  variant-change cascade.
- New `app/utils/anchor.ts` exposes the anchor → CSS-sides /
  transform math shared between the renderer and the transform
  overlay so positioning stays bit-identical.

## [0.7.0] — 2026-05-24

### Added
- **Locale matrix — multi-language export** — new "Locales" button in the
  toolbar generates AI copy in every selected language and exports each as
  a separate folder inside a single ZIP (`/en/`, `/tr/`, `/ja/`, …).
  No extra server work needed: the existing `/api/generate-copy` locale
  param is called once per language in sequence.
- **28-language support** — expanded from 13 to 28 languages across AI
  copy generation, variant generation, and the sidebar language picker.
  New additions: Hindi, Indonesian, Polish, Swedish, Danish, Norwegian,
  Finnish, Czech, Romanian, Ukrainian, Vietnamese, Thai, Hungarian,
  Brazilian Portuguese (`pt`) / European Portuguese (`pt-PT`),
  Traditional Chinese (`zh-TW`).
- **Unified "Languages" selector** — replaced the separate "App language"
  (single-select) and "Export languages" (multi-select) fields with a
  single multi-select. First selected language drives the editor preview
  and AI generate; all selected languages are included in the Locale
  bundle export.

### Fixed
- **Dark mode bleed on light-forced sites** — inputs and textareas were
  rendered with dark backgrounds for OS-dark-mode users even though
  `colorMode.preference: 'light'` was set. Root cause: Tailwind v4 defaults
  dark variant to `@media (prefers-color-scheme: dark)` regardless of the
  `@nuxtjs/color-mode` class strategy. Fixed by adding
  `@variant dark (&:is(.dark, .dark *))` in `main.css` so dark utilities
  only activate when the `.dark` class is explicitly present.

### Improved
- **`copy-variants` locale handling** — variant endpoint now maps locale
  codes to full language names (same `LOCALE_NAMES` table as
  `generate-copy`) and injects an explicit "ALL output MUST be in
  [language]" constraint into both system and user prompts, preventing
  mixed-language output on non-Latin locales.

### Internal
- TypeScript strictness fixes in `AppSidebar.vue`: array index accesses
  guarded with `!` / `?? null`, `FileList` index assertions, and
  `setSsRef` parameter typed as `Element | ComponentPublicInstance | null`
  instead of implicit `any`.

## [0.6.3] — 2026-05-07

### Added
- **Skip empty slides on bulk export** — "Export all" and preset ZIP
  bundles now skip slides with no screenshot uploaded for the current
  device, so users no longer ship blank template PNGs to the stores.
  The trust slide stays in by design (it's intentionally text-only).
  Single-slide download from a card is unchanged.
- **"No screenshot" badge** on slide cards so empty slides are visible
  at a glance before bulk export.
- Toast feedback after bulk runs: how many slides exported, how many
  skipped, or a clear warning when nothing was eligible.

## [0.6.2] — 2026-05-07

### Improved
- **Cross-origin font safety on export** — fonts are now inlined via
  `getFontEmbedCSS` before capture, removing canvas taint as a failure
  mode for blank exports.
- **Transparent and dark designs preserved** — the export pipeline no
  longer forces a white background.
- **Sharper exports** — `pixelRatio: 2` for store-ready resolution.
- **No more full-screen flash during download** — the offscreen capture
  container now sits off-viewport instead of on top of the page.
- **Faster, more reliable capture** — 1200ms blanket sleep replaced with
  `document.fonts.ready` + `requestAnimationFrame` + a small layout
  settle. `try/finally` guarantees cleanup even when capture throws.

### Fixed
- Removed `allowTaint` / `useCORS` opts (those belong to `html2canvas`,
  `html-to-image` ignores them).
- Restored `cacheBust: true` so stale assets can't re-introduce blank
  frames.
- Reverted the temporary CSP `base-uri` `blob:` addition — it wasn't a
  meaningful base href source and the underlying console warning is a
  separate concern.

## [0.6.1] — 2026-05-07

### Fixed
- **Blank screenshot exports** — downloaded PNGs were sometimes empty.
  Capture pipeline rebuilt to clone the export node into a dedicated
  offscreen container, wait for fonts, force reflow, and run a robust
  warm-up + try/catch with a fallback path. Inter font is preloaded
  with `display: swap` and Google Fonts get `preconnect` hints for
  faster, more reliable availability. Huge thanks to **@wolfhongkong**
  for diagnosing and fixing this in
  [#2](https://github.com/eralpozcan/storeshots/pull/2).

## [0.6.0] — 2026-05-06

### Added
- **Copy variants generator** — new "Variants" button in the toolbar
  produces three tone-of-voice alternatives of the current slides
  (confident · warm · punchy) so the user can A/B test direction
  without re-running the vision pipeline. Picking a variant preserves
  any per-slide position fine-tunes. Backed by `/api/copy-variants`.
- **Auto palette from screenshots** — "Auto" wand button on the Style
  step extracts a brand palette (primary + accent + bg gradient) from
  the uploaded screenshots via a tiny client-side colour quantiser. No
  AI key required. Skips near-white / near-black / near-grey buckets
  so the result reflects real brand colour, not background.
- **Claude model picker** — Provider step now exposes a model dropdown
  when Claude is selected: Opus 4.7, Sonnet 4.6, Haiku 4.5, plus the
  older 3.5 Sonnet / 3.5 Haiku. Choice persists per project and is
  passed through to every AI endpoint.

### Changed
- **Sidebar layout unified across every step.** Each wizard step now
  follows the same shape: a `<header>` with a title, optional right
  action, and a one-sentence description; field blocks with a
  consistent `text-xs font-semibold` label and `text-[10px]` helper;
  every input forced to `w-full` so widths line up flush with the
  4 px section padding.
- AI step's two stacked sub-panels (Generate + Settings) now read as
  one cohesive section with a clear "AI generation" intro followed
  by a "Provider & key" sub-section.

## [0.5.0] — 2026-05-06

### Added
- **Quick-start templates** — a chooser auto-opens on a fresh editor and is
  reachable any time from the new "Templates" button. Four presets (SaaS,
  Game, Finance, Health) pre-fill colours, slide copy, and key features.
  User assets (icon, screenshots, AI key) are never overwritten.
- **App Store preview** — a "Store preview" button (active on iPhone)
  opens a modal that simulates the listing row users see first: app
  icon + name + tagline + the first 3 slides at iOS-row aspect ratio.
- **Sticky thumbnails strip** above the slide grid, one chip per slide.
  Click a chip to jump the preview to that slide.
- **Empty-state hint** — when no screenshots have been uploaded yet,
  a banner above the slide grid points the user back to the Screenshots
  step instead of leaving them confused by placeholder previews.
- **Keyboard shortcuts** — `⌘/Ctrl + E` exports all, `⌘/Ctrl + G`
  generates copy via AI, `Esc` closes the slide-edit modal. All
  shortcuts skip while typing in form fields.

## [0.4.0] — 2026-05-06

### Added
- **Wizard sidebar** — sticky 5-step nav (Basics · Screenshots · AI ·
  Headlines · Style) replaces the single-scroll dense sidebar. Only the
  active step renders; a green dot marks completion per step heuristically.
- **Basics step polish** — full-width icon dropzone with hover/preview/✕,
  consistent inputs, description character counter (/600), and features as
  a chip input (press Enter or comma to add, ✕ to remove).
- **Inline slide edit** — pencil button on each preview card opens a modal
  with label + headline fields. No more scrolling the sidebar to find slide N.
- **Caption fine-tune drag** — new "Adjust" button on each slide enters a
  drag-to-reposition mode. Pointer deltas are divided by the preview scale
  to produce true canvas-pixel offsets, so the adjustment carries through
  to bundle exports. Save / Reset / Cancel toolbar inside the card.

### Changed
- **Toolbar split into two rows** — Row 1: Home · App name · Project ·
  Export · Bundle. Row 2: Device tabs · Orientation · Size. Frees the
  action area, removes overflow on narrow viewports.
- **Slide cards no longer click-to-download** — the entire card was a
  download trigger, which produced accidental downloads when clicking
  near the slide. Three explicit hover buttons now: ✏ Edit, ✥ Adjust,
  ⬇ Download. The Feature Graphic preview gets an explicit Download
  button too instead of being a giant click target.

## [0.3.0] — 2026-05-06

### Added
- **Export bundles** — a new "Bundle" dropdown next to Export All produces
  every size a target store accepts in a single ZIP. Three presets:
  - **App Store**: iPhone 6.9", 6.5", 6.3", 6.1" + iPad Pro 12.9", 11"
  - **Play Store**: Android Phone, 7" Tablet, 10" Tablet
  - **Everything**: union of both
  The flow walks each device + size, captures every slide, and downloads a
  ZIP organised by `device-size` folders. Original device state is restored
  after the run.
- **Project save / load** — a "Project" dropdown with two actions:
  - Save project → downloads a versioned `.storeshots.json` snapshot.
    The file format is versioned (`__storeshots: 1`) so a future schema
    change can refuse incompatible files cleanly.
  - Load project → restores the editor from a snapshot. The exported file
    strips the API key so a shared snapshot can never leak credentials;
    on import the in-memory key is preserved so the user doesn't re-paste.

## [0.2.2] — 2026-05-06

### Fixed
- `/changelog` was crashing on Netlify Functions with
  `require() of ES Module @exodus/bytes/encoding-lite.js not supported`,
  bubbling up from `isomorphic-dompurify`'s JSDOM dependency. Replaced
  the sanitiser with [jagajs](https://github.com/dgknbtl/jaga) — zero
  dependencies, dual ESM/CJS exports, serverless-safe.
- The page is now prerendered at build time (`routeRules: { '/changelog':
  { prerender: true } }`), so Netlify serves it as static HTML and the
  Functions runtime never touches it.

## [0.2.1] — 2026-05-05

### Added
- **Update banner** — when a new deploy goes live, open tabs detect the change
  by polling `/api/version` (every 5 min and on tab focus) and surface a
  "Refresh" prompt instead of silently running stale assets that 404.
- Explicit Netlify cache headers: `_nuxt/*` is `immutable` for a year, HTML is
  always revalidated. Prevents the previous failure mode where a cached HTML
  pointed at a hashed CSS file that the new deploy had already invalidated.
- `buildId` now prefers Netlify's `COMMIT_REF` (git SHA) over a build-time
  timestamp, so the same commit redeployed produces the same id and won't
  trigger a spurious refresh prompt.

### Security
- **CSP hardened**: enabled per-request nonce via `nuxt-security` and removed
  `'unsafe-inline'` from `script-src`. Hydration scripts now carry an explicit
  nonce; `'strict-dynamic'` allows scripts loaded by trusted entry chunks
  (e.g. Umami) without widening the host allowlist. `'unsafe-eval'` remains
  pending a vendor audit.
- **Changelog page** sanitises rendered Markdown with `isomorphic-dompurify`
  as a defence-in-depth layer, so a malicious PR landing HTML in
  `CHANGELOG.md` cannot escalate to stored XSS.
- **`/api/generate-copy` input hardening**: enforced an 8MB body cap, typed
  and length-bounded every field (provider must be `claude` or `openrouter`,
  `slideCount` 1–12, max 12 images, 1.5MB per image), and rejected
  unrecognised payloads early with `413`/`400`. `features` is correctly typed
  as `string[]` (was briefly mis-typed during development).

### Fixed
- AI generation surfaced silent console errors when API keys were missing or
  the upstream provider rejected the request. Errors now appear as user-facing
  toasts via `useToast()` (Nuxt UI 4), backed by an `<UApp>` root wrapper.

## [0.2.0] — 2026-05-05

### Added
- Public changelog: `CHANGELOG.md` at the repo root and a rendered `/changelog`
  page on the site, both kept in sync. Linked from the landing page header,
  landing footer, and the legal layout footer.
- **Umami analytics** — privacy-first, cookieless, MIT-licensed, GDPR-safe by
  default. Gated behind the `analytics` cookie-consent toggle via
  `useScriptTriggerConsent()` (the canonical @nuxt/scripts v1 consent
  primitive), so opting out blocks any third-party request. Configured via
  `NUXT_PUBLIC_UMAMI_WEBSITE_ID` / `NUXT_PUBLIC_UMAMI_HOST` (defaults to Umami
  Cloud, override for self-host).

### Changed
- **Replaced Google Analytics 4 + Google Tag Manager with Umami.** The earlier
  GA/GTM integration (added and removed in this same release window) was
  inconsistent with Storeshots' privacy stance: an open-source tool that holds
  API keys in `sessionStorage` and respects Do Not Track shouldn't ship its
  visitors' page views to Google. Umami is cookieless and stores no personal
  data, so the analytics flow is now fully aligned with the rest of the product.
- CSP narrowed: removed `googletagmanager.com` and `google-analytics.com`,
  added only `cloud.umami.is` and Umami's API gateway.
- Cookie banner copy for the "Analytics" category updated to reflect the new
  cookieless reality.

### Fixed
- Screenshot export coming out blank in production. The CSP `base-uri 'none'`
  default blocked the `<base>` tag that `html-to-image` injects into its cloned
  DOM; relaxed to `'self'`. ([#1](https://github.com/eralpozcan/storeshots/issues/1))

## [0.1.0] — 2026-04-23

Initial public beta.

### Added
- Marketing landing page with dual-platform (App Store + Google Play) hero preview.
- Editor at `/editor` for composing slides with device mockups.
- AI-assisted copywriting via OpenRouter (key held in sessionStorage only).
- Smart slide ordering and export through `html-to-image`.
- Legal pages: Privacy, Cookies, Terms; cookie consent banner with granular
  categories (necessary, functional, analytics, marketing).
- SEO scaffold via `@nuxtjs/seo`: sitemap, robots.txt with AI-crawler allow/deny
  lists, Open Graph and Twitter cards, schema.org Organization markup.
- Security headers via `nuxt-security` with a tight CSP and rate limiting on
  server routes.
- Mobile warning overlay for screen widths the editor does not yet support.
- AGPL-3.0-or-later license.

[0.10.0]: https://github.com/eralpozcan/storeshots/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/eralpozcan/storeshots/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/eralpozcan/storeshots/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/eralpozcan/storeshots/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/eralpozcan/storeshots/compare/v0.6.3...v0.7.0
[0.6.3]: https://github.com/eralpozcan/storeshots/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/eralpozcan/storeshots/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/eralpozcan/storeshots/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/eralpozcan/storeshots/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/eralpozcan/storeshots/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/eralpozcan/storeshots/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/eralpozcan/storeshots/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/eralpozcan/storeshots/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/eralpozcan/storeshots/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/eralpozcan/storeshots/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/eralpozcan/storeshots/releases/tag/v0.1.0
