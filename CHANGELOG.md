# Changelog

All notable changes to Storeshots are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project loosely
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/eralpozcan/storeshots/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/eralpozcan/storeshots/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/eralpozcan/storeshots/releases/tag/v0.1.0
