export const SUPPORTED_LOCALES = ['uk', 'en', 'sk', 'hu', 'de', 'cs'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

/** Locales available for backstage UI chrome (sidebar, buttons, toasts). */
export const BACKSTAGE_UI_LOCALES = ['uk', 'en', 'sk'] as const

export type BackstageUiLocale = (typeof BACKSTAGE_UI_LOCALES)[number]

export function isBackstageUiLocale(value: string): value is BackstageUiLocale {
  return (BACKSTAGE_UI_LOCALES as readonly string[]).includes(value)
}

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
    hu: {},
    de: {},
    cs: {},
  },
}

export function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export const LOCALE_LABELS: Record<AppLocale, string> = {
  uk: 'Українська',
  en: 'English',
  sk: 'Slovenčina',
  hu: 'Magyar',
  de: 'Deutsch (AT)',
  cs: 'Čeština',
}

export const LOCALE_SHORT_LABELS: Record<AppLocale, string> = {
  uk: 'UA',
  en: 'EN',
  sk: 'SK',
  hu: 'HU',
  de: 'DE',
  cs: 'CZ',
}

/** Emoji flags for language switcher UI */
export const LOCALE_FLAGS: Record<AppLocale, string> = {
  uk: '🇺🇦',
  en: '🇬🇧',
  sk: '🇸🇰',
  hu: '🇭🇺',
  de: '🇦🇹',
  cs: '🇨🇿',
}

export const BACKSTAGE_CONTENT_LOCALE_STORAGE_KEY = 'ga-backstage-content-locale'
export const BACKSTAGE_UI_LOCALE_STORAGE_KEY = 'ga-backstage-ui-locale'
