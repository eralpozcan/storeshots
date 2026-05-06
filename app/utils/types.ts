export type SlideCopy = {
  label: string
  headline: string // use \n for line breaks
  // Optional caption translation in canvas pixels, relative to the slide's
  // default caption position. Set via the in-card "Adjust position" mode.
  position?: { dx: number, dy: number }
}

export type BrandColors = {
  primary: string
  accent: string
  textDark: string
  textLight: string
  bgFrom: string
  bgTo: string
}

export type DeviceImages = (string | null)[]

export type UserConfig = {
  appName: string
  appDescription: string
  features: string[]
  appIcon: string | null
  colors: BrandColors
  copy: SlideCopy[]
  images: {
    iphone: DeviceImages
    ipad: DeviceImages
    androidPhone: DeviceImages
    androidTablet7P: DeviceImages
    androidTablet7L: DeviceImages
    androidTablet10P: DeviceImages
    androidTablet10L: DeviceImages
  }
  locale: string
  ai: {
    provider: 'claude' | 'openrouter'
    apiKey: string
    openrouterModel: string
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
}
