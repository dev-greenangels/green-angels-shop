/**
 * Single source of truth for customer-facing public support email.
 * Priority: active country-site supportEmail → labeled store email → first store email.
 * Never hardcodes domain emails (e.g. info@green-angels.sk).
 */

import type { CountrySiteCode } from '@/lib/country-sites/types'
import type { MarketSettings } from '@/lib/settings/market'
import { resolveCountrySiteProfile } from '@/lib/settings/store-contact-country'
import type { StoreContactSettings } from '@/lib/settings/types'

const SUPPORT_LABELS = ['підтримка', 'support', 'kontakt', 'contact'] as const

function pickLabeledStoreEmail(store: Pick<StoreContactSettings, 'emails'>): string {
  const emails = (store.emails ?? []).filter((item) => item.email?.trim())
  if (emails.length === 0) return ''
  const normalized = SUPPORT_LABELS.map((l) => l.toLowerCase())
  const byLabel = emails.find((item) =>
    normalized.includes(item.label.trim().toLowerCase()),
  )
  return (byLabel ?? emails[0])?.email.trim() ?? ''
}

export type PublicSupportEmailInput = {
  store: Pick<StoreContactSettings, 'emails'>
  market: Pick<MarketSettings, 'region' | 'countrySites'>
  countrySiteCode?: CountrySiteCode | null
}

/**
 * Customer-facing support email for the active country host / market.
 * On SK multi-domain: countrySites.{sk|hu|at}.supportEmail wins when set.
 */
export function resolvePublicSupportEmail(input: PublicSupportEmailInput): string {
  const profile = resolveCountrySiteProfile(
    input.market as MarketSettings,
    input.countrySiteCode,
  )
  const fromSite = profile?.supportEmail?.trim() || ''
  if (fromSite) return fromSite
  return pickLabeledStoreEmail(input.store)
}
