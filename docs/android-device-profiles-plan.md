# Plan: Android Device Profile System

> Status: **PLAN** (not implemented). A minimal fix already landed on `main`;
> this plan is the follow-up. Verify the minimal fix looks good in production
> first, then pick this up.

## Problem (summary)

App-store screenshot generator. Today every Android phone renders through a
**single generic CSS frame** (`DeviceFrames.vue` `android-phone`). Result: a user
captures on a Pixel 10, the output looks like a different device, and the camera
cutout / status-bar position never lines up across devices.

What the minimal fix solved:
- Frame body ratio → `ANDROID_RATIO` (~9:20) instead of the iPhone ratio.
- Removed the fake CSS punch-hole → no more double cutout; the screenshot's own
  cutout shows.
- Added `androidW` / `androidW2` width formulas.

What the minimal fix did **not** solve (the point of this plan):
- Still a single profile. No Pixel vs Galaxy vs tablet-curve distinction.
- Single frame style (corner radius, button placement, body color) — not
  brand/device specific.
- The user can't pick a target device; the ratio is one fixed value.

## Goal

A system where the user picks a **canonical Android profile**, each profile
carrying its own ratio + frame geometry, with no PNG assets required. Improve
accuracy **without** going down the iPhone PNG-mockup path.

Success criteria:
1. Selecting Android in the editor shows a "Device profile" dropdown (Pixel /
   Galaxy / Generic).
2. The selected profile changes the frame ratio, corner radius, side-button
   positions, and screen inset.
3. The export output renders per the selected profile (preview = export, single
   render chain preserved).
4. Adding a profile = adding one data object (not a new component branch).

## Architecture

### 1. Profile data model — `app/utils/androidProfiles.ts` (new)

```ts
export type AndroidProfile = {
  key: string            // 'pixel' | 'galaxy' | 'generic'
  label: string          // "Pixel (9:20)"
  ratio: number          // frame body aspect (w/h), e.g. 0.47
  screen: {              // screen area inside the body, in %
    left: number; top: number; width: number; height: number
    rx: number; ry: number  // corner radius %
  }
  body: {
    rx: number; ry: number          // body corner radius (elliptical) %
    gradient: string                // CSS linear-gradient
  }
  buttons: { side: 'left'|'right'; top: number; height: number }[]
}

export const ANDROID_PROFILES: Record<string, AndroidProfile> = { ... }
export const DEFAULT_ANDROID_PROFILE = 'pixel'
```

Starter profiles (researched real ratios):
| key | example device | screen ratio | body ratio |
|---|---|---|---|
| `pixel` | Pixel 8/9/10 | 20:9 (9:20 portrait) | ~0.47 |
| `galaxy` | Galaxy S24 | 19.5:9 | ~0.475 |
| `generic` | default | 9:20 | 0.47 |

> Note: the camera cutout is deliberately ABSENT (minimal-fix decision). The
> screenshot carries its own cutout. If wanted later, add an optional
> `punchHole?: {...}` field + a status-bar crop/normalize pass (separate, risky
> work — out of scope here).

### 2. State — `editor.vue`

- `const androidProfile = ref(DEFAULT_ANDROID_PROFILE)` + add to project
  import/export.
- Show in the UI only when `device === 'android'`.
- Add to the project JSON schema (back-compat: default when absent).

### 3. Render — `DeviceFrames.vue`

- Feed the `android-phone` branch from the profile: `aspectRatio`,
  `borderRadius`, `background`, screen inset, and side buttons come from the
  profile values (currently hardcoded).
- New prop: `profile?: AndroidProfile`. Thread it through the existing
  editor → SlideTemplate → SlideElementRenderer → DeviceFrames prop chain.
- One branch remains; geometry comes from data (no new `v-else-if`).

### 4. Width formula — `canvas.ts`

- `androidW` already uses `ANDROID_RATIO`. For a profile-dependent ratio, the
  profile's `ratio` should flow into `DEVICE_WIDTH_FNS['android-phone'].ratio`.
- Option A (simple): the profiles' ratios are very close (0.47–0.475) → a single
  `androidW` is enough, the visual difference is negligible. Don't couple width
  to the profile.
- Option B (full): inject the profile ratio into the `deviceWidthPct` calc.
- **Recommendation: A** — YAGNI; the ratios are close, the extra complexity
  isn't worth it.

### 5. UI

- When `device === 'android'`, add a `USelect` (profile dropdown) to the toolbar.
- Tablets (`android-7/10`) are out of scope — separate frames; this plan is
  phone-only.

## Steps (with verify)

1. `androidProfiles.ts` data model + 3 profiles → verify: types compile,
   constants correct.
2. Feed the `DeviceFrames.vue` `android-phone` branch from the profile → verify:
   with a single profile (pixel), the output looks identical to the minimal fix
   (no regression).
3. Prop chain (`editor → SlideTemplate → SlideElementRenderer → DeviceFrames`) →
   verify: changing the profile updates the live preview.
4. `editor.vue` dropdown + state + project import/export → verify: the profile
   choice is saved, old projects open with DEFAULT.
5. Export → verify: the selected profile is reflected in the PNG (preview =
   export).

## Out of scope (deliberate)

- Real per-device PNG mockups (most accurate but asset + maintenance burden).
  Separate decision.
- Status-bar auto-crop / camera-cutout normalization (fragile; separate work).
- Tablet profiles.
- Play "longer side ≤ 2× shorter" limit: a 9:20 output is 2.22× → technically
  over the limit. Handle in the output preset (canvas/ANDROID_SIZES),
  independent of this plan.
