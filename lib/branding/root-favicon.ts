import { resolveCountryFromHostWithFallback } from '@/lib/country-sites/resolve-country-host'
import type { MarketRegion } from '@/lib/settings/market'

/**
 * Root `/favicon.ico` rewrite target. Browsers still request this path even when
 * metadata icons point at `/branding/{ua|sk}/favicon.ico`.
 *
 * - EU country-site hosts (or SK deploy host map present) → SK branding
 * - UA deploy (no country host map) → UA branding
 */
export function resolveRootFaviconBrandingRegion(hostname: string): MarketRegion {
  const country = resolveCountryFromHostWithFallback(hostname)
  return country ? 'sk' : 'ua'
}

export function resolveRootFaviconRewritePath(hostname: string): string {
  return `/branding/${resolveRootFaviconBrandingRegion(hostname)}/favicon.ico`
}
