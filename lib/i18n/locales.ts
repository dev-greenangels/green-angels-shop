export const SUPPORTED_LOCALES = ['uk', 'en', 'sk'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export type LocalizationMessageOverrides = Partial<Record<AppLocale, Record<string, unknown>>>

export type LocalizationSettings = {
  showLanguageSwitcher: boolean
  /** Locales shown in the storefront language switcher */
  availableLocales: AppLocale[]
  messageOverrides: LocalizationMessageOverrides
}

export const DEFAULT_AVAILABLE_LOCALES: AppLocale[] = ['uk', 'en']

export const DEFAULT_LOCALIZATION_SETTINGS: LocalizationSettings = {
  showLanguageSwitcher: true,
  availableLocales: [...DEFAULT_AVAILABLE_LOCALES],
  messageOverrides: {
    uk: {},
    en: {},
    sk: {},
  },
}

export function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export const LOCALE_LABELS: Record<AppLocale, string> = {
  uk: 'Українська',
  en: 'English',
  sk: 'Slovenčina',
}

export const LOCALE_SHORT_LABELS: Record<AppLocale, string> = {
  uk: 'UA',
  en: 'EN',
  sk: 'SK',
}

/** Emoji flags for language switcher UI */
export const LOCALE_FLAGS: Record<AppLocale, string> = {
  uk: '🇺🇦',
  en: '🇬🇧',
  sk: '🇸🇰',
}

export const BACKSTAGE_CONTENT_LOCALE_STORAGE_KEY = 'ga-backstage-content-locale'
export const BACKSTAGE_UI_LOCALE_STORAGE_KEY = 'ga-backstage-ui-locale'
