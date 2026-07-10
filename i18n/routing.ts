import { defineRouting } from 'next-intl/routing'

import { SUPPORTED_LOCALES } from '@/lib/i18n/locales'

export const locales = SUPPORTED_LOCALES

export type AppLocale = (typeof locales)[number]

export const defaultLocale: AppLocale = 'uk'

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value)
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
})
