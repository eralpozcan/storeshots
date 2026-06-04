// Typeface system. Built-in fonts are self-hosted by @nuxt/fonts (see
// nuxt.config.ts `fonts.families`) so their @font-face rules live in the
// document and get embedded into PNG exports by getFontEmbedCSS. A custom
// uploaded font is injected as a data-URL @font-face under CUSTOM_FONT_FAMILY,
// which is likewise reachable by getFontEmbedCSS at capture time.

export type FontCategory = 'sans' | 'serif'

export type BuiltinFont = {
  family: string      // token stored in config.fontFamily
  label: string
  category: FontCategory
  stack: string       // CSS font-family value used at render time
}

// Curated free set. Keep in sync with nuxt.config.ts `fonts.families`.
export const BUILTIN_FONTS: BuiltinFont[] = [
  { family: 'Inter',            label: 'Inter',            category: 'sans',  stack: '"Inter", system-ui, sans-serif' },
  { family: 'Poppins',          label: 'Poppins',          category: 'sans',  stack: '"Poppins", system-ui, sans-serif' },
  { family: 'Montserrat',       label: 'Montserrat',       category: 'sans',  stack: '"Montserrat", system-ui, sans-serif' },
  { family: 'DM Sans',          label: 'DM Sans',          category: 'sans',  stack: '"DM Sans", system-ui, sans-serif' },
  { family: 'Space Grotesk',    label: 'Space Grotesk',    category: 'sans',  stack: '"Space Grotesk", system-ui, sans-serif' },
  { family: 'Roboto',           label: 'Roboto',           category: 'sans',  stack: '"Roboto", system-ui, sans-serif' },
  { family: 'Playfair Display', label: 'Playfair Display', category: 'serif', stack: '"Playfair Display", Georgia, serif' },
  { family: 'Lora',             label: 'Lora',             category: 'serif', stack: '"Lora", Georgia, serif' },
]

export const DEFAULT_FONT_FAMILY = 'Inter'

// Sentinel stored in config.fontFamily when the uploaded custom font is active.
export const CUSTOM_FONT_VALUE = 'custom'
// Internal @font-face family name for the uploaded font.
export const CUSTOM_FONT_FAMILY = 'Storeshots Custom'
export const CUSTOM_FONT_STYLE_ID = 'storeshots-custom-font'
export const CUSTOM_FONT_STACK = `"${CUSTOM_FONT_FAMILY}", system-ui, sans-serif`

export const ALLOWED_FONT_EXT = ['ttf', 'otf', 'woff', 'woff2'] as const
// Cap raw upload size. Web fonts are small (woff2 is tens of KB); this guards
// localStorage quota since the data-URL is persisted with the project config.
export const MAX_FONT_BYTES = 2 * 1024 * 1024

const FALLBACK_STACK = BUILTIN_FONTS[0]!.stack

// Resolve config.fontFamily (+ whether a custom font exists) to a CSS stack.
export function resolveFontStack(fontFamily: string | undefined, hasCustom: boolean): string {
  if (fontFamily === CUSTOM_FONT_VALUE) return hasCustom ? CUSTOM_FONT_STACK : FALLBACK_STACK
  return BUILTIN_FONTS.find(f => f.family === fontFamily)?.stack ?? FALLBACK_STACK
}

// CSS `format()` hint from a font filename.
export function fontFormatFromName(name: string): string {
  switch (name.split('.').pop()?.toLowerCase()) {
    case 'woff2': return 'woff2'
    case 'woff':  return 'woff'
    case 'otf':   return 'opentype'
    case 'ttf':
    default:      return 'truetype'
  }
}

export function customFontFaceCss(dataUrl: string, format: string): string {
  return `@font-face{font-family:'${CUSTOM_FONT_FAMILY}';src:url(${dataUrl}) format('${format}');font-weight:100 900;font-style:normal;font-display:swap;}`
}

// Inject (or update / remove when css is null) the custom @font-face <style>.
// Idempotent by id so re-injecting on import/reload never stacks duplicates.
export function injectCustomFont(css: string | null): void {
  if (import.meta.server || typeof document === 'undefined') return
  const existing = document.getElementById(CUSTOM_FONT_STYLE_ID) as HTMLStyleElement | null
  if (!css) { existing?.remove(); return }
  const el = existing ?? document.createElement('style')
  if (!existing) { el.id = CUSTOM_FONT_STYLE_ID; document.head.appendChild(el) }
  el.textContent = css
  // Warm the font so it's ready before document.fonts.ready resolves at export.
  try { (document.fonts as any)?.load?.(`16px "${CUSTOM_FONT_FAMILY}"`) } catch { /* noop */ }
}
