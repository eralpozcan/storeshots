// Shared language list for the locale picker and translations manager.
export const LOCALE_OPTIONS = [
  { label: '🇬🇧 English', value: 'en' },
  { label: '🇩🇪 Deutsch', value: 'de' },
  { label: '🇫🇷 Français', value: 'fr' },
  { label: '🇪🇸 Español', value: 'es' },
  { label: '🇧🇷 Português (Brasil)', value: 'pt' },
  { label: '🇵🇹 Português (Portugal)', value: 'pt-PT' },
  { label: '🇮🇹 Italiano', value: 'it' },
  { label: '🇳🇱 Nederlands', value: 'nl' },
  { label: '🇵🇱 Polski', value: 'pl' },
  { label: '🇷🇺 Русский', value: 'ru' },
  { label: '🇺🇦 Українська', value: 'uk' },
  { label: '🇸🇪 Svenska', value: 'sv' },
  { label: '🇩🇰 Dansk', value: 'da' },
  { label: '🇳🇴 Norsk', value: 'no' },
  { label: '🇫🇮 Suomi', value: 'fi' },
  { label: '🇨🇿 Čeština', value: 'cs' },
  { label: '🇷🇴 Română', value: 'ro' },
  { label: '🇭🇺 Magyar', value: 'hu' },
  { label: '🇹🇷 Türkçe', value: 'tr' },
  { label: '🇸🇦 العربية', value: 'ar' },
  { label: '🇮🇳 हिन्दी', value: 'hi' },
  { label: '🇯🇵 日本語', value: 'ja' },
  { label: '🇨🇳 中文 (简体)', value: 'zh' },
  { label: '🇹🇼 中文 (繁體)', value: 'zh-TW' },
  { label: '🇰🇷 한국어', value: 'ko' },
  { label: '🇮🇩 Bahasa Indonesia', value: 'id' },
  { label: '🇻🇳 Tiếng Việt', value: 'vi' },
  { label: '🇹🇭 ภาษาไทย', value: 'th' },
] as const

const LABEL_BY_CODE: Record<string, string> = Object.fromEntries(
  LOCALE_OPTIONS.map(o => [o.value, o.label]),
)

// Human label for a locale code, falling back to the upper-cased code.
export function localeLabel(code: string): string {
  return LABEL_BY_CODE[code] ?? code.toUpperCase()
}
