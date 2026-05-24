import type { Device, Orientation, SlideElement } from './types'

// Canvas dimensions per device
export const W = 1320;        export const H = 2868
export const AW = 1080;       export const AH = 1920
export const AT7P_W = 1200;   export const AT7P_H = 1920
export const AT7L_W = 1920;   export const AT7L_H = 1200
export const AT10P_W = 1600;  export const AT10P_H = 2560
export const AT10L_W = 2560;  export const AT10L_H = 1600
export const IPAD_W = 2048;   export const IPAD_H = 2732
export const FGW = 1024;      export const FGH = 500

// iPhone mockup values
export const MK_W = 1022; export const MK_H = 2082
export const MK_RATIO = MK_W / MK_H
export const SC_L  = (52   / MK_W) * 100
export const SC_T  = (46   / MK_H) * 100
export const SC_W  = (918  / MK_W) * 100
export const SC_H  = (1990 / MK_H) * 100
export const SC_RX = (126  / 918)  * 100
export const SC_RY = (126  / 1990) * 100

// Frame ratios
export const TAB_P_RATIO = 0.667
export const TAB_L_RATIO = 1.5
export const IPAD_RATIO  = 0.770

// Export sizes
export const IPHONE_SIZES = [
  { label: '6.9"', w: 1320, h: 2868 }, { label: '6.5"', w: 1284, h: 2778 },
  { label: '6.3"', w: 1206, h: 2622 }, { label: '6.1"', w: 1125, h: 2436 },
] as const
export const ANDROID_SIZES     = [{ label: 'Phone',          w: 1080, h: 1920 }] as const
export const ANDROID_7P_SIZES  = [{ label: '7" Portrait',    w: 1200, h: 1920 }] as const
export const ANDROID_7L_SIZES  = [{ label: '7" Landscape',   w: 1920, h: 1200 }] as const
export const ANDROID_10P_SIZES = [{ label: '10" Portrait',   w: 1600, h: 2560 }] as const
export const ANDROID_10L_SIZES = [{ label: '10" Landscape',  w: 2560, h: 1600 }] as const
export const IPAD_SIZES = [
  { label: 'iPad Pro 12.9"', w: 2048, h: 2732 },
  { label: 'iPad Pro 11"',   w: 1668, h: 2224 },
] as const
export const FG_SIZES = [{ label: 'Feature Graphic', w: FGW, h: FGH }] as const

// Store-bundle export presets — one click to produce every size a store accepts.
export type PresetTarget = {
  device: Device
  orientation: Orientation
  sizes: readonly { label: string; w: number; h: number }[]
}

export type StorePreset = {
  key: string
  label: string
  description: string
  targets: PresetTarget[]
}

export const STORE_PRESETS: StorePreset[] = [
  {
    key: 'app-store',
    label: 'App Store',
    description: 'iPhone 6.9", 6.5", 6.3", 6.1" + iPad Pro 12.9", 11"',
    targets: [
      { device: 'iphone', orientation: 'portrait', sizes: IPHONE_SIZES },
      { device: 'ipad', orientation: 'portrait', sizes: IPAD_SIZES },
    ],
  },
  {
    key: 'play-store',
    label: 'Play Store',
    description: 'Android Phone, 7" Tablet, 10" Tablet',
    targets: [
      { device: 'android', orientation: 'portrait', sizes: ANDROID_SIZES },
      { device: 'android-7', orientation: 'portrait', sizes: ANDROID_7P_SIZES },
      { device: 'android-10', orientation: 'portrait', sizes: ANDROID_10P_SIZES },
    ],
  },
  {
    key: 'everything',
    label: 'Everything',
    description: 'App Store + Play Store, all sizes',
    targets: [
      { device: 'iphone', orientation: 'portrait', sizes: IPHONE_SIZES },
      { device: 'ipad', orientation: 'portrait', sizes: IPAD_SIZES },
      { device: 'android', orientation: 'portrait', sizes: ANDROID_SIZES },
      { device: 'android-7', orientation: 'portrait', sizes: ANDROID_7P_SIZES },
      { device: 'android-10', orientation: 'portrait', sizes: ANDROID_10P_SIZES },
    ],
  },
]

// Width formulas
export function phoneW(cW: number, cH: number, clamp = 0.84)  { return Math.min(clamp, 0.72 * (cH / cW) * MK_RATIO) }
export function phoneW2(cW: number, cH: number)                { return phoneW(cW, cH, 0.66) }
export function tabletPW(cW: number, cH: number, clamp = 0.80) { return Math.min(clamp, 0.72 * (cH / cW) * TAB_P_RATIO) }
export function tabletPW2(cW: number, cH: number)              { return tabletPW(cW, cH, 0.64) }
export function tabletLW(cW: number, cH: number, clamp = 0.62) { return Math.min(clamp, 0.75 * (cH / cW) * TAB_L_RATIO) }
export function ipadW(cW: number, cH: number, clamp = 0.75)    { return Math.min(clamp, 0.72 * (cH / cW) * IPAD_RATIO) }
export function ipadW2(cW: number, cH: number)                 { return ipadW(cW, cH, 0.60) }

export type DeviceFrame = 'iphone' | 'android-phone' | 'android-tablet-p' | 'android-tablet-l' | 'ipad'

// Width-formula map per device frame. Used by SlideElement to resolve a
// device element's widthRole ('primary'/'secondary') into a % of canvas.
// 'android-phone' shares the iPhone formulas because the canvas dims for the
// android device match the iPhone aspect ratio and the existing variants
// rendered identically with phoneW/phoneW2 for both.
export const DEVICE_WIDTH_FNS: Record<DeviceFrame, {
  primary: (cW: number, cH: number) => number
  secondary: (cW: number, cH: number) => number
  ratio: number
}> = {
  'iphone':           { primary: phoneW,   secondary: phoneW2,  ratio: MK_RATIO },
  'android-phone':    { primary: phoneW,   secondary: phoneW2,  ratio: MK_RATIO },
  'android-tablet-p': { primary: tabletPW, secondary: tabletPW2, ratio: TAB_P_RATIO },
  'android-tablet-l': { primary: tabletLW, secondary: tabletLW,  ratio: TAB_L_RATIO },
  'ipad':             { primary: ipadW,    secondary: ipadW2,    ratio: IPAD_RATIO },
}

const PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BHgAIggN/PzmliQAAAABJRU5ErkJggg=='

export function imgSrc(v: string | null | undefined) { return v || PLACEHOLDER }

// VARIANT_PRESETS — interactive-element compositions (device/caption/icon)
// reproducing the original 10 hardcoded variants from SlideTemplate.vue. Used
// as the fallback when SlideCopy.elements is absent.
//
// Blobs and slide backgrounds remain handled inline in SlideTemplate.vue at
// this phase. They are decorative-only with no per-element user controls
// planned in 2b/2c, so the variant % math stays in one place. Phase 2d can
// promote them to elements if/when blob drag-drop becomes a feature.
//
// Element coordinate model:
// - x/y are % of canvas (cW/cH). anchor picks which corner of the ELEMENT
//   lands on the (x, y) canvas point.
//   E.g. {x: 50, y: -4, anchor: 'bc'} = element's bottom-center sits 4%
//   past the bottom edge, horizontally centered.
// - Device widthRole resolves at render time via the active deviceFrame's
//   width formula ('primary' = phoneW/tabletPW/..., 'secondary' = phoneW2/...).
//
// Slide 10 (trust) stays separate in SlideTemplate — no device frame, app
// icon + centered caption, distinct background. Kept off this map for clarity.

const captionTop: SlideElement = {
  id: 'caption',
  type: 'caption',
  x: 10, y: 6, anchor: 'tl',
  widthPct: 80,
  zIndex: 10,
}

const captionBottomLeft: SlideElement = {
  id: 'caption',
  type: 'caption',
  x: 8, y: 8, anchor: 'bl',
  widthPct: 46,
  zIndex: 10,
}

// Variant 1: caption top, device[0] centered bottom, soft primary shadow.
const variant1: SlideElement[] = [
  captionTop,
  {
    id: 'device', type: 'device', imageIdx: 0, widthRole: 'primary',
    x: 50, y: -4, anchor: 'bc',
    shadow: { color: 'primary', alpha: 0x44 / 255 },
    zIndex: 5,
  },
]

// Variant 2: caption top, two phones — back rotated -5° left, front right.
const variant2: SlideElement[] = [
  captionTop,
  {
    id: 'device-bg', type: 'device', imageIdx: 0, widthRole: 'secondary', widthMul: 0.82,
    x: -5, y: -3, anchor: 'bl', rotate: -5, opacity: 0.45,
    shadow: { color: 'black', alpha: 0.12, y: 20, blur: 40 },
    zIndex: 3,
  },
  {
    id: 'device-fg', type: 'device', imageIdx: 1, widthRole: 'secondary',
    x: -3, y: -3, anchor: 'br',
    shadow: { color: 'primary', alpha: 0x38 / 255 },
    zIndex: 5,
  },
]

// Variant 3: caption bottom-left, device top-right.
const variant3: SlideElement[] = [
  captionBottomLeft,
  {
    id: 'device', type: 'device', imageIdx: 2, widthRole: 'primary',
    x: -6, y: 5, anchor: 'tr',
    shadow: { color: 'primary', alpha: 0x38 / 255, y: 30, blur: 70 },
    zIndex: 5,
  },
]

// Variant 4: dark bg, caption top, device centered bottom with hard shadow.
const variant4: SlideElement[] = [
  captionTop,
  {
    id: 'device', type: 'device', imageIdx: 3, widthRole: 'primary',
    x: 50, y: -4, anchor: 'bc',
    shadow: { color: 'black', alpha: 0.55 },
    zIndex: 5,
  },
]

// Variant 5: caption top, device centered bottom with accent shadow.
const variant5: SlideElement[] = [
  captionTop,
  {
    id: 'device', type: 'device', imageIdx: 4, widthRole: 'primary',
    x: 50, y: -4, anchor: 'bc',
    shadow: { color: 'accent', alpha: 0x40 / 255 },
    zIndex: 5,
  },
]

// Variant 6: caption top, two phones — back rotated 4° right, front left.
const variant6: SlideElement[] = [
  captionTop,
  {
    id: 'device-bg', type: 'device', imageIdx: 5, widthRole: 'secondary', widthMul: 0.80,
    x: -5, y: -2, anchor: 'br', rotate: 4, opacity: 0.45,
    shadow: { color: 'black', alpha: 0.10, y: 15, blur: 30 },
    zIndex: 3,
  },
  {
    id: 'device-fg', type: 'device', imageIdx: 6, widthRole: 'secondary',
    x: -3, y: -3, anchor: 'bl',
    shadow: { color: 'primary', alpha: 0x33 / 255 },
    zIndex: 5,
  },
]

// Variant 7: caption top, device[6] centered bottom.
const variant7: SlideElement[] = [
  captionTop,
  {
    id: 'device', type: 'device', imageIdx: 6, widthRole: 'primary',
    x: 50, y: -4, anchor: 'bc',
    shadow: { color: 'primary', alpha: 0x38 / 255 },
    zIndex: 5,
  },
]

// Variant 8: caption bottom-left, device top-right.
const variant8: SlideElement[] = [
  captionBottomLeft,
  {
    id: 'device', type: 'device', imageIdx: 7, widthRole: 'primary',
    x: -6, y: 5, anchor: 'tr',
    shadow: { color: 'primary', alpha: 0x38 / 255, y: 30, blur: 70 },
    zIndex: 5,
  },
]

// Variant 9: dark bg, caption top, device centered bottom with hard shadow.
const variant9: SlideElement[] = [
  captionTop,
  {
    id: 'device', type: 'device', imageIdx: 8, widthRole: 'primary',
    x: 50, y: -4, anchor: 'bc',
    shadow: { color: 'black', alpha: 0.50 },
    zIndex: 5,
  },
]

export const VARIANT_PRESETS: Record<number, SlideElement[]> = {
  1: variant1, 2: variant2, 3: variant3, 4: variant4, 5: variant5,
  6: variant6, 7: variant7, 8: variant8, 9: variant9,
}
