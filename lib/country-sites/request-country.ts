import { headers } from 'next/headers'

import { resolveCountryFromHost } from '@/lib/country-sites/resolve-country-host'
import { GA_COUNTRY_HEADER, isCountrySiteCode, type CountrySiteCode } from '@/lib/country-sites/types'

/**
 * Resolve SK country-site code for the current request (proxy header, then Host).
 * Returns null on UA / unmapped hosts without a GA_COUNTRY_HOSTS map.
 */
export async function getRequestCountrySiteCode(): Promise<CountrySiteCode | null> {
  const headerStore = await headers()
  const countryHeader = headerStore.get(GA_COUNTRY_HEADER)
  if (countryHeader && isCountrySiteCode(countryHeader)) return countryHeader

  const requestHost =
    headerStore.get('x-forwarded-host')?.split(',')[0]?.trim() || headerStore.get('host')
  const host = requestHost?.split(':')[0]?.trim()
  if (!host) return null
  return resolveCountryFromHost(host)
}
