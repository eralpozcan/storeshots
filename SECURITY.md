# Security Policy

Thanks for taking the time to make Storeshots safer.

## Supported versions

Storeshots is in **beta** (`0.x`). Only the latest minor release line receives
security fixes. The live deployment at [storeshots.org](https://storeshots.org)
tracks `main` and is updated whenever a new release lands.

| Version | Supported |
|---------|-----------|
| `0.6.x` | ✅ |
| `0.5.x` and earlier | ❌ — please upgrade |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security reports.**

Use the **GitHub private security advisory** form — closed by default and
visible only to the maintainer:

<https://github.com/eralpozcan/storeshots/security/advisories/new>

Include where possible:

- A description of the issue and the impact you observed.
- Steps to reproduce, ideally a minimal proof of concept.
- The Storeshots version (or commit SHA) and the browser / runtime you
  tested in.
- Any logs, screenshots, or HTTP traces that help confirm the issue.

You'll get an acknowledgement within **3 business days**. We aim to ship a
fix or a mitigation for confirmed vulnerabilities within **14 days**, faster
for anything that exposes user data or allows remote code execution. If we
need longer we'll explain why and keep you in the loop.

## Scope

In scope:

- The Storeshots web app at <https://storeshots.org>.
- The source code in this repository (Nuxt frontend + Nitro server routes).
- The Nitro server endpoints under `server/api/*`.

Out of scope:

- Third-party services we integrate with — please report issues to them
  directly:
  - Anthropic API → <https://www.anthropic.com/security>
  - OpenRouter → <https://openrouter.ai>
  - Umami Cloud → <https://umami.is>
  - Netlify → <https://www.netlify.com/security>
- Issues that require attacker-controlled local browser extensions or a
  compromised end-user device.
- Best-practice findings without a concrete impact (e.g. a missing optional
  HTTP header). Feel free to open a regular issue for those.
- Findings that depend on an outdated Storeshots release that's already
  patched on `main`.

## Coordinated disclosure

We follow a coordinated disclosure model. Please give us a reasonable
window to ship a fix before publishing technical details. Once a release
that addresses the issue is live we're happy to credit you in the
[`CHANGELOG.md`](CHANGELOG.md) or the GitHub advisory if you want public
recognition. Storeshots has no paid bug bounty program at the moment.

## Known security posture

For context on the controls already in place, see the **Privacy & security**
section of the [`README.md`](README.md). Highlights:

- API keys are held in `sessionStorage` only — never persisted to disk and
  never sent to any party other than the AI provider the user configured.
- CSP runs with a per-request nonce and no `'unsafe-inline'` for scripts.
- Server endpoints (`/api/generate-copy`, `/api/copy-variants`,
  `/api/translate-copy`) enforce body size caps, per-field length limits,
  provider whitelists, and content-type checks.
- Analytics are cookieless, MIT-licensed Umami, gated behind explicit
  cookie consent via `useScriptTriggerConsent`.
