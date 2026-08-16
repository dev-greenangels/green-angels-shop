import type { AppLocale } from '@/i18n/routing'
import { isAppLocale } from '@/i18n/routing'
import { localePath } from '@/lib/locale-path'

export const OG_LOCALE: Record<AppLocale, string> = {
  uk: 'uk_UA',
  en: 'en_GB',
  sk: 'sk_SK',
  hu: 'hu_HU',
  de: 'de_AT',
  cs: 'cs_CZ',
}

function uniqueLocales(locales: AppLocale[]): AppLocale[] {
  const seen = new Set<AppLocale>()
  const result: AppLocale[] = []
  for (const locale of locales) {
    if (seen.has(locale)) continue
    seen.add(locale)
    result.push(locale)
  }
  return result
}

export function normalizeIndexablePath(pathname: string): string {
  const trimmed = pathname.trim() || '/'
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  if (withSlash.length > 1 && withSlash.endsWith('/')) {
    return withSlash.slice(0, -1)
  }
  return withSlash
}

export type PageAlternates = {
  canonical: string
  languages: Record<string, string>
}

/** Intra-host only. Do not pass another country-site origin. */
export function buildPageAlternates(input: {
  origin: string
  locale: string
  pathname: string
  availableLocales: readonly string[]
  xDefaultLocale: string
}): PageAlternates | null {
  const origin = input.origin.replace(/\/$/, '')
  if (!origin || !isAppLocale(input.locale)) return null

  const pathname = normalizeIndexablePath(input.pathname)
  const available = input.availableLocales.filter(isAppLocale)
  const hrefLocales = uniqueLocales([
    input.locale,
    ...available,
  ])

  const xDefault = isAppLocale(input.xDefaultLocale)
    ? hrefLocales.includes(input.xDefaultLocale)
      ? input.xDefaultLocale
      : hrefLocales[0]!
    : hrefLocales[0]!

  const urlFor = (locale: AppLocale) => `${origin}${localePath(pathname, locale)}`

  const languages: Record<string, string> = {}
  for (const locale of hrefLocales) {
    languages[locale] = urlFor(locale)
  }
  languages['x-default'] = urlFor(xDefault)

  return {
    canonical: urlFor(input.locale),
    languages,
  }
}
