/**
 * Shop-side mirror of backend intra-EU B2B goods eligibility.
 * Backend resolveCheckoutTax remains authoritative for quotes/orders.
 */

import {
  isEuMemberStateIso,
  normalizeEuMemberStateIso,
  normalizeEuViesVatCountry,
} from '@/lib/checkout/eu-member-states'

export function isIntraEuB2bGoodsEligible(input: {
  buyerType?: 'individual' | 'company' | null
  viesValid?: boolean | null
  vatCountryCode?: string | null
  deliveryCountryCode?: string | null
}): boolean {
  if (input.buyerType !== 'company') return false
  if (input.viesValid !== true) return false

  const vatCc = normalizeEuViesVatCountry(input.vatCountryCode)
  if (!vatCc || vatCc === 'SK') return false

  const shipIso = normalizeEuMemberStateIso(input.deliveryCountryCode)
  if (!shipIso || shipIso === 'sk') return false
  if (!isEuMemberStateIso(shipIso)) return false

  return true
}

/** Stable key for one-shot VIES autofill: COUNTRY:digits */
export function viesAutofillKey(
  countryCode: string | null | undefined,
  vatNumber: string | null | undefined,
): string | null {
  const cc = normalizeEuViesVatCountry(countryCode)
  const digits = (vatNumber ?? '').replace(/\D/g, '').trim()
  if (!cc || digits.length < 4) return null
  return `${cc}:${digits}`
}

/** VIES sometimes returns "---" / "." as placeholder name. */
export function isMeaningfulViesRegisteredName(name: string | null | undefined): boolean {
  const trimmed = (name ?? '').trim()
  if (trimmed.length < 2) return false
  if (/^[-–—._\s]+$/.test(trimmed)) return false
  return true
}
