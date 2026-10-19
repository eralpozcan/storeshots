import type { AppleArtwork, Device, ImagesKey, Orientation } from './types'

export const APPLE_IMAGE_KEYS = ['duoOuter', 'duoOuterLandscape', 'duoInner', 'duoInnerLandscape', 'appleHeader', 'appleSearch'] as const

export function artworkStyle(artwork?: AppleArtwork) {
  return { objectFit: artwork?.fit ?? 'contain', objectPosition: `${artwork?.x ?? 50}% ${artwork?.y ?? 50}%` }
}

export const APPLE_TARGETS = [
  { label: 'iPhone Duo · Outer display', value: 'iphone-duo-outer' },
  { label: 'iPhone Duo · Inner display', value: 'iphone-duo-inner' },
  { label: 'App Store · Product page header', value: 'apple-header' },
  { label: 'App Store · Search results', value: 'apple-search' },
] as const

// Apple specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/
export function appleAssetSpec(device: Device, orientation: Orientation): {
  label: string; w: number; h: number; imageKey: ImagesKey; kind: 'duo' | 'creative'
} | undefined {
  if (device === 'apple-header') return { label: 'Product page header', w: 3840, h: 1646, imageKey: 'appleHeader', kind: 'creative' }
  if (device === 'apple-search') return { label: 'Search results', w: 1920, h: 1280, imageKey: 'appleSearch', kind: 'creative' }
  const landscape = orientation === 'landscape'
  if (device === 'iphone-duo-outer') return {
    label: 'iPhone Duo · Outer display', w: landscape ? 2034 : 1398, h: landscape ? 1398 : 2034,
    imageKey: landscape ? 'duoOuterLandscape' : 'duoOuter', kind: 'duo',
  }
  if (device === 'iphone-duo-inner') return {
    label: 'iPhone Duo · Inner display', w: landscape ? 2853 : 2007, h: landscape ? 2007 : 2853,
    imageKey: landscape ? 'duoInnerLandscape' : 'duoInner', kind: 'duo',
  }
}
