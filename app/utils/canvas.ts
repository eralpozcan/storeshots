import type { Device, Orientation } from './types'

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

const PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BHgAIggN/PzmliQAAAABJRU5ErkJggg=='

export function imgSrc(v: string | null | undefined) { return v || PLACEHOLDER }
