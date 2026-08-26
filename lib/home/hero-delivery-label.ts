import type { CountrySiteCode } from '@/lib/country-sites/types'
import type { MarketSettings } from '@/lib/settings/market'
import { allowedDeliveryCountriesForHost } from '@/lib/settings/market'

/** Primary delivery country code for hero highlight on SK multi-domain hosts. */
export function resolveHeroDeliveryCountryCode(
  market: MarketSettings,
  hostCountry: CountrySiteCode | null | undefined,
): string {
  if (market.region !== 'sk') return 'ua'
  if (hostCountry) {
    const allowed = allowedDeliveryCountriesForHost(market, hostCountry)
    if (allowed.includes(hostCountry)) return hostCountry
    if (allowed[0]) return allowed[0]
    return hostCountry
  }
  return 'sk'
}
