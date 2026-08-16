import { headers } from 'next/headers'

import { defaultLocale, isAppLocale, type AppLocale } from '@/i18n/routing'
import { applyCountrySiteOverlay } from '@/lib/country-sites/apply-overlay'
import { resolveCountryFromHost } from '@/lib/country-sites/resolve-country-host'
import { GA_COUNTRY_HEADER, isCountrySiteCode, type CountrySiteCode } from '@/lib/country-sites/types'
import { hostnameFromSiteUrl, resolvePublicOrigin } from '@/lib/seo/public-origin'
import { buildPageAlternates, type PageAlternates } from '@/lib/seo/page-alternates'
import { fetchPublicSiteSettings, getLocalizationSettings, getMarketSettings } from '@/lib/settings/fetch'

export type SeoRequestContext = {
  locale: AppLocale
  origin: string
  availableLocales: AppLocale[]
  xDefaultLocale: AppLocale
  countryCode: CountrySiteCode | null
}

export async function resolveSeoRequestContext(locale: string): Promise<SeoRequestContext> {
  const appLocale = isAppLocale(locale) ? locale : defaultLocale
  const headerStore = await headers()
  const requestHost =
    headerStore.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    headerStore.get('host')
  const requestProto = headerStore.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const { origin } = resolvePublicOrigin({ requestHost, requestProto })

  const settings = await fetchPublicSiteSettings()
  const market = getMarketSettings(settings)
  const localization = getLocalizationSettings(settings)
  const countryHeader = headerStore.get(GA_COUNTRY_HEADER)
  const countryFromHeader =
    countryHeader && isCountrySiteCode(countryHeader) ? countryHeader : null
  const originHost = hostnameFromSiteUrl(origin)
  const countryFromHost = originHost ? resolveCountryFromHost(originHost) : null
  const countryCode = countryFromHeader ?? countryFromHost
  const overlay = applyCountrySiteOverlay(market, countryCode)

  const availableLocales = (overlay?.availableLocales?.length
    ? overlay.availableLocales
    : localization.availableLocales) as AppLocale[]

  const xDefaultLocale: AppLocale = overlay
    ? overlay.defaultLocale
    : availableLocales.includes(defaultLocale)
      ? defaultLocale
      : (availableLocales[0] ?? defaultLocale)

  return {
    locale: appLocale,
    origin,
    availableLocales,
    xDefaultLocale,
    countryCode,
  }
}

export async function resolvePageAlternates(
  locale: string,
  pathname: string,
): Promise<PageAlternates | null> {
  const ctx = await resolveSeoRequestContext(locale)
  return buildPageAlternates({
    origin: ctx.origin,
    locale: ctx.locale,
    pathname,
    availableLocales: ctx.availableLocales,
    xDefaultLocale: ctx.xDefaultLocale,
  })
}

export async function resolvePublicOriginFromRequest(): Promise<string> {
  const headerStore = await headers()
  const requestHost =
    headerStore.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    headerStore.get('host')
  const requestProto = headerStore.get('x-forwarded-proto')?.split(',')[0]?.trim()
  return resolvePublicOrigin({ requestHost, requestProto }).origin
}
