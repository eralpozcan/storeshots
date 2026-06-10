export type SlideCopy = {
  label: string
  headline: string // use \n for line breaks
  // Optional caption translation in canvas pixels, relative to the slide's
  // default caption position. Set via the in-card "Adjust position" mode.
  // Deprecated — kept for backwards compat with pre-elements user configs.
  position?: { dx: number, dy: number }
  // Layout override. When present, replaces the variant's default element
  // composition. When absent, the slide falls back to VARIANT_PRESETS[variant].
  elements?: SlideElement[]
  // Layout variant override for this slide. When absent, the slide uses the
  // positional default from slideVariants. Switching variants drops any
  // existing elements/position override since they belong to the old layout.
  variant?: number
}

// Anchor on the slide canvas. First letter = vertical (t/c/b),
// second letter = horizontal (l/c/r). 'c' alone = dead center.
export type Anchor = 'tl' | 'tc' | 'tr' | 'cl' | 'c' | 'cr' | 'bl' | 'bc' | 'br'

export type BaseElement = {
  id: string
  // % of canvas. With anchor, defines the element's reference point.
  // Negative values (e.g. y: -4 with anchor 'bc') push past the edge for
  // the "device peeks out of the bottom" effect.
  x: number
  y: number
  anchor: Anchor
  zIndex: number
  rotate?: number // degrees
  opacity?: number // 0-1
}

// Drop-shadow descriptor. Resolved at render time against BrandColors.
// black uses #000000 with the given alpha.
export type ElementShadow = {
  color: 'primary' | 'accent' | 'black'
  alpha: number // 0-1
  y?: number // px, default 40
  blur?: number // px, default 80
}

export type DeviceElement = BaseElement & {
  type: 'device'
  imageIdx: number // which index in cfg.images to render
  // Width selector. 'primary' = main device width formula, 'secondary' =
  // narrower companion (paired-device layouts). Actual pixels resolved
  // at render time from the active deviceFrame's ratio.
  widthRole: 'primary' | 'secondary'
  // Optional fixed % override that bypasses the deviceFrame width formulas.
  widthPct?: number
  // Some paired-device variants render the secondary at a fraction of pw2
  // (e.g. 0.82). Stored explicitly here so the preset stays declarative.
  widthMul?: number
  shadow?: ElementShadow
}

export type CaptionElement = BaseElement & {
  type: 'caption'
  // Caption box width as % of canvas (default 80).
  widthPct?: number
  // Text alignment within the caption box.
  align?: 'left' | 'center' | 'right'
}

export type BlobElement = BaseElement & {
  type: 'blob'
  // Blob colour pulled from BrandColors at render time.
  color: 'primary' | 'accent'
  blobOpacity: number
  widthPct: number
  heightPct: number
}

export type IconElement = BaseElement & {
  type: 'icon'
  // App icon size as % of canvas width.
  sizePct: number
}

// Free-form text element (used by the Feature Graphic). Content is either the
// literal `text`, or — when `bind` is set — pulled live from the config so the
// app name / headline stay in sync with the rest of the project.
export type TextElement = BaseElement & {
  type: 'text'
  text?: string
  bind?: 'appName' | 'headline'
  sizePct: number   // font size as % of canvas width
  weight: number    // 400 / 600 / 700
  color: 'primary' | 'accent' | 'textDark' | 'textLight'
  uppercase?: boolean
  letterSpacing?: number // em
  widthPct?: number      // wrap width as % of canvas; absent = no wrap
  align?: 'left' | 'center' | 'right'
}

// Feature-chip group (Feature Graphic). Renders cfg.features as pills; the
// element controls position and wrap width, content stays driven by features.
export type ChipsElement = BaseElement & {
  type: 'chips'
  widthPct: number // max wrap width as % of canvas
}

export type SlideElement =
  | DeviceElement | CaptionElement | BlobElement | IconElement | TextElement | ChipsElement

export type BrandColors = {
  primary: string
  accent: string
  textDark: string
  textLight: string
  bgFrom: string
  bgTo: string
}

export type DeviceImages = (string | null)[]

// Uploaded custom font. dataUrl is a base64 font data-URL; format is the CSS
// `format()` hint (woff2/woff/opentype/truetype).
export type CustomFont = {
  name: string
  dataUrl: string
  format: string
}

export type UserConfig = {
  appName: string
  appDescription: string
  // Free-form extra context/brief fed to the AI (audience, tone, keywords,
  // differentiators) on top of name + description + features.
  aiBrief: string
  features: string[]
  appIcon: string | null
  colors: BrandColors
  // Active typeface token: a BUILTIN_FONTS family or CUSTOM_FONT_VALUE.
  fontFamily: string
  customFont: CustomFont | null
  // Feature Graphic element layout (icon / text / chips). Absent → FG_PRESET.
  fgElements: SlideElement[]
  copy: SlideCopy[]
  // Per-locale copy store. `copy` always mirrors the active locale
  // (`locale`); copyByLocale holds the saved copy for every generated /
  // edited language so the editor can switch between them without losing work.
  copyByLocale: Record<string, SlideCopy[]>
  images: {
    iphone: DeviceImages
    ipad: DeviceImages
    ipadLandscape: DeviceImages
    androidPhone: DeviceImages
    androidTablet7P: DeviceImages
    androidTablet7L: DeviceImages
    androidTablet10P: DeviceImages
    androidTablet10L: DeviceImages
  }
  locale: string
  selectedLocales: string[]
  batchLocaleGenerate: boolean
  ai: {
    provider: 'claude' | 'openrouter'
    apiKey: string
    openrouterModel: string
    claudeModel: string
  }
}

export type Device =
  | 'iphone'
  | 'android'
  | 'android-7'
  | 'android-10'
  | 'ipad'
  | 'feature-graphic'

export type Orientation = 'portrait' | 'landscape'

export type ImagesKey = keyof UserConfig['images']

export type SlideConfig = {
  images: (string | null)[]
  copy: SlideCopy[]
  colors: BrandColors
  appIcon: string | null
  appName: string
  features: string[]
  // Resolved CSS font-family stack for all slide text.
  fontFamily: string
}
