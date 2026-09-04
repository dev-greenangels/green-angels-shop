import type { AppLocale } from '@/i18n/routing'
import type { CountrySiteCode } from '@/lib/country-sites/types'
import { originForCountrySite } from '@/lib/seo/market-hosts'

export const MERCHANT_FEED_CODES = ['sk', 'cz', 'de', 'hu'] as const

export type MerchantFeedCode = (typeof MERCHANT_FEED_CODES)[number]

export type MerchantFeedConfig = {
  code: MerchantFeedCode
  /** XML file segment, e.g. sk.xml */
  fileName: `${MerchantFeedCode}.xml`
  locale: AppLocale
  /** Host profile for origin + shelf overlay (CZ uses SK host/price). */
  countrySite: CountrySiteCode
  channelTitle: string
  gmcTargets: string[]
}

export const MERCHANT_FEEDS: Record<MerchantFeedCode, MerchantFeedConfig> = {
  sk: {
    code: 'sk',
    fileName: 'sk.xml',
    locale: 'sk',
    countrySite: 'sk',
    channelTitle: 'Green Angels Slovakia',
    gmcTargets: ['SK'],
  },
  cz: {
    code: 'cz',
    fileName: 'cz.xml',
    locale: 'cs',
    countrySite: 'sk',
    channelTitle: 'Green Angels Czech Republic',
    gmcTargets: ['CZ'],
  },
  de: {
    code: 'de',
    fileName: 'de.xml',
    locale: 'de',
    countrySite: 'at',
    channelTitle: 'Green Angels Austria / Germany',
    gmcTargets: ['AT', 'DE'],
  },
  hu: {
    code: 'hu',
    fileName: 'hu.xml',
    locale: 'hu',
    countrySite: 'hu',
    channelTitle: 'Green Angels Hungary',
    gmcTargets: ['HU'],
  },
}

export function parseMerchantFeedParam(raw: string | undefined | null): MerchantFeedConfig | null {
  const value = (raw ?? '').trim().toLowerCase()
  const code = value.replace(/\.xml$/, '') as MerchantFeedCode
  if (!MERCHANT_FEED_CODES.includes(code)) return null
  return MERCHANT_FEEDS[code]
}

/** Google taxonomy ID: Home & Garden > Plants */
export const GOOGLE_PRODUCT_CATEGORY_PLANTS = '985'

export const MERCHANT_BRAND = 'Green Angels'

export const MERCHANT_FEED_CACHE_CONTROL =
  'public, s-maxage=3600, stale-while-revalidate=86400'

export const MERCHANT_PRODUCT_PAGE_SIZE = 200
export const MERCHANT_MAX_PRODUCT_PAGES = 100

/** Production apex origins when `GA_COUNTRY_HOSTS` is unset (Merchant links must be public). */
export const MERCHANT_PRODUCTION_ORIGINS: Record<CountrySiteCode, string> = {
  sk: 'https://green-angels.sk',
  at: 'https://green-angels.at',
  hu: 'https://green-angels.hu',
}

export function resolveMerchantFeedOrigin(
  countrySite: CountrySiteCode,
  input?: { countryHostsEnv?: string | null; siteUrl?: string | null },
): string {
  return originForCountrySite(countrySite, input) ?? MERCHANT_PRODUCTION_ORIGINS[countrySite]
}
