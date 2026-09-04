import type { CountrySiteCode } from '@/lib/country-sites/types'
import {
  parseCountryHostMap,
  resolveCountryFromHost,
} from '@/lib/country-sites/resolve-country-host'
import { normalizeHostname } from '@/lib/seo/public-origin'

import {
  MERCHANT_FEED_CODES,
  MERCHANT_FEEDS,
  type MerchantFeedCode,
  type MerchantFeedConfig,
} from './feeds'

/** Which Merchant XML files each country-site host may serve. */
export const MERCHANT_FEEDS_BY_HOST_COUNTRY: Record<CountrySiteCode, readonly MerchantFeedCode[]> = {
  sk: ['sk', 'cz'],
  at: ['de'],
  hu: ['hu'],
}

function isLocalDevHostname(host: string): boolean {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.endsWith('.localhost')
  )
}

/**
 * Feed codes enabled for the request Host.
 * - Mapped production hosts: only that site’s feeds
 * - localhost / empty GA_COUNTRY_HOSTS: all feeds (local DX)
 * - Unknown host on a mapped deploy: none (404)
 */
export function merchantFeedsEnabledForHostname(
  hostname: string,
  input?: { countryHostsEnv?: string | null },
): MerchantFeedCode[] {
  const host = normalizeHostname(hostname)
  if (!host) return []

  if (isLocalDevHostname(host)) {
    return [...MERCHANT_FEED_CODES]
  }

  const hostMap = parseCountryHostMap(
    input?.countryHostsEnv ?? process.env.GA_COUNTRY_HOSTS,
  )
  if (hostMap.size === 0) {
    return [...MERCHANT_FEED_CODES]
  }

  const country = resolveCountryFromHost(host, hostMap)
  if (!country) return []
  return [...MERCHANT_FEEDS_BY_HOST_COUNTRY[country]]
}

export function isMerchantFeedEnabledOnHost(
  feedCode: MerchantFeedCode,
  hostname: string,
  input?: { countryHostsEnv?: string | null },
): boolean {
  return merchantFeedsEnabledForHostname(hostname, input).includes(feedCode)
}

export function merchantFeedConfigsForHostname(
  hostname: string,
  input?: { countryHostsEnv?: string | null },
): MerchantFeedConfig[] {
  return merchantFeedsEnabledForHostname(hostname, input).map((code) => MERCHANT_FEEDS[code])
}

export function requestHostnameFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = headers.get('host')?.trim()
  return normalizeHostname(forwarded || host || '')
}
