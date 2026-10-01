/**
 * Billing / seat country helpers — independent of delivery allowlists.
 * Canonical codes: ISO 3166-1 alpha-2 (lowercase).
 */

import {
  ISO_3166_1_ALPHA2_CODES,
  isIso31661Alpha2,
  normalizeIso31661Alpha2,
} from '@/lib/checkout/iso-3166-1-alpha2'

export {
  ISO_3166_1_ALPHA2_CODES,
  isIso31661Alpha2,
  normalizeIso31661Alpha2,
}

/** Map UI locale → BCP 47 for Intl.DisplayNames. */
export function billingCountryDisplayLocale(uiLocale: string): string {
  const base = uiLocale.trim().toLowerCase().split('-')[0] || 'en'
  // next-intl: uk = Ukrainian
  if (base === 'uk') return 'uk'
  if (base === 'cs') return 'cs'
  if (base === 'sk') return 'sk'
  if (base === 'hu') return 'hu'
  if (base === 'de') return 'de'
  return 'en'
}

/** Localized region name; falls back to uppercase ISO code. */
export function billingCountryDisplayName(code: string, uiLocale: string): string {
  const normalized = normalizeIso31661Alpha2(code)
  if (!normalized) {
    const raw = code.trim()
    return raw ? raw.toUpperCase() : ''
  }
  const upper = normalized.toUpperCase()
  try {
    const dn = new Intl.DisplayNames([billingCountryDisplayLocale(uiLocale), 'en'], {
      type: 'region',
    })
    return dn.of(upper) ?? upper
  } catch {
    return upper
  }
}

/** Unicode regional-indicator flag emoji for any ISO alpha-2. */
export function billingCountryFlagEmoji(code: string): string {
  const normalized = normalizeIso31661Alpha2(code)
  if (!normalized) return '🏳️'
  const a = normalized.toUpperCase().codePointAt(0)
  const b = normalized.toUpperCase().codePointAt(1)
  if (a == null || b == null) return '🏳️'
  return String.fromCodePoint(0x1f1e6 + (a - 65), 0x1f1e6 + (b - 65))
}

export type BillingCountryOption = {
  code: string
  label: string
}

/**
 * Full billing country list, sorted by localized label.
 * Optional `preferFirst` codes (e.g. host market) appear first when present.
 */
export function sortedBillingCountryOptions(
  uiLocale: string,
  preferFirst: string[] = [],
): BillingCountryOption[] {
  const prefer = preferFirst
    .map((c) => normalizeIso31661Alpha2(c))
    .filter((c): c is string => Boolean(c))
  const preferSet = new Set(prefer)

  const rest = ISO_3166_1_ALPHA2_CODES.filter((c) => !preferSet.has(c))
    .map((code) => ({
      code,
      label: billingCountryDisplayName(code, uiLocale),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, billingCountryDisplayLocale(uiLocale), {
      sensitivity: 'base',
    }))

  const head = prefer.map((code) => ({
    code,
    label: billingCountryDisplayName(code, uiLocale),
  }))

  return [...head, ...rest]
}

/**
 * True when billing country may be copied into courier delivery
 * (must be in the storefront delivery allowlist).
 */
export function isBillingCountryDeliverable(
  billingCountryCode: string,
  enabledDeliveryCountries: readonly string[] | null | undefined,
): boolean {
  const code = normalizeIso31661Alpha2(billingCountryCode)
  if (!code) return false
  if (!enabledDeliveryCountries || enabledDeliveryCountries.length === 0) {
    // No allowlist (e.g. UA) — copying is not restricted by delivery countries.
    return true
  }
  return enabledDeliveryCountries.some((c) => c.trim().toLowerCase() === code)
}
