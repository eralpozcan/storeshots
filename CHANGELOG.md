# Changelog

All notable changes to Storeshots are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project loosely
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.3.0]: https://github.com/eralpozcan/storeshots/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/eralpozcan/storeshots/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/eralpozcan/storeshots/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/eralpozcan/storeshots/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/eralpozcan/storeshots/releases/tag/v0.1.0
