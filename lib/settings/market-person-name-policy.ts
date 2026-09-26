/**
 * Deploy-market person-name usability (NOT UI locale).
 *
 * Current SK policy: Latin script only.
 * Current UA policy: Cyrillic script only.
 *
 * To allow Cyrillic on SK later: add `'cyrillic'` to
 * `PERSON_NAME_POLICY_BY_MARKET.sk.allowedScripts` here AND in the backend twin
 * (`green-angels-backend/src/orders/market-person-name-policy.ts`), then update
 * the matching contract tests. Checkout / profile-fill call sites must not change.
 */

import type { MarketRegion } from '@/lib/settings/market'
import {
  containsCyrillicLetters,
  containsLatinLetters,
  isValidCyrillicName,
  isValidLatinName,
  sanitizeCyrillicName,
  sanitizeLatinName,
} from '@/lib/validation/register-form'

export type PersonNameScript = 'latin' | 'cyrillic'

export type PersonNameMarketPolicy = {
  /** Scripts accepted as a usable person name for this market deploy. */
  allowedScripts: readonly PersonNameScript[]
}

/**
 * Single place to flip SK Cyrillic acceptance (Shop runtime).
 * Keep identical to backend `PERSON_NAME_POLICY_BY_MARKET`.
 */
export const PERSON_NAME_POLICY_BY_MARKET: Record<MarketRegion, PersonNameMarketPolicy> =
  {
    sk: { allowedScripts: ['latin'] },
    ua: { allowedScripts: ['cyrillic'] },
  }

function policyFor(region: MarketRegion): PersonNameMarketPolicy {
  return PERSON_NAME_POLICY_BY_MARKET[region] ?? PERSON_NAME_POLICY_BY_MARKET.ua
}

function matchesScript(value: string, script: PersonNameScript): boolean {
  if (script === 'latin') return isValidLatinName(value)
  return isValidCyrillicName(value)
}

/** True when the name is usable under the deploy-market person-name policy. */
export function isPersonNameUsableForMarket(
  value: string | null | undefined,
  region: MarketRegion,
): boolean {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return false
  const { allowedScripts } = policyFor(region)
  return allowedScripts.some((script) => matchesScript(trimmed, script))
}

export function arePersonNamesUsableForMarket(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  region: MarketRegion,
): boolean {
  return (
    isPersonNameUsableForMarket(firstName, region) &&
    isPersonNameUsableForMarket(lastName, region)
  )
}

/**
 * Wrong-script signal for hydrate display / one-shot clear.
 * Preserves current SK=Cyrillic-blocked / UA=Latin-blocked UX without call sites
 * hardcoding alphabet checks.
 */
export function personNameHasDisallowedScriptForMarket(
  value: string | null | undefined,
  region: MarketRegion,
): boolean {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return false
  const { allowedScripts } = policyFor(region)
  if (allowedScripts.includes('latin') && !allowedScripts.includes('cyrillic')) {
    return containsCyrillicLetters(trimmed)
  }
  if (allowedScripts.includes('cyrillic') && !allowedScripts.includes('latin')) {
    return containsLatinLetters(trimmed)
  }
  // Dual-script markets: no single script is globally disallowed.
  return false
}

/** Input sanitize filter for live typing (primary allowed script). */
export function sanitizePersonNameForMarket(
  value: string,
  region: MarketRegion,
): string {
  const { allowedScripts } = policyFor(region)
  if (allowedScripts.includes('latin') && !allowedScripts.includes('cyrillic')) {
    return sanitizeLatinName(value)
  }
  if (allowedScripts.includes('cyrillic') && !allowedScripts.includes('latin')) {
    return sanitizeCyrillicName(value)
  }
  // Dual-script: keep characters allowed by either filter.
  const latin = sanitizeLatinName(value)
  const cyr = sanitizeCyrillicName(value)
  // Prefer union of kept chars in original order
  let out = ''
  for (const ch of value) {
    if (latin.includes(ch) || cyr.includes(ch) || ch === ' ') out += ch
  }
  return out
}

export type PersonNameMarketErrorCode =
  | 'latinCharactersRequired'
  | 'minLatinLetters'
  | 'cyrillicFirstName'
  | 'cyrillicLastName'
  | 'cyrillicNameMin'

/**
 * Field-error codes matching current checkout copy.
 * Empty values: returns null (caller emits `required`).
 */
export function getPersonNameMarketFieldError(
  value: string,
  region: MarketRegion,
  field: 'firstName' | 'lastName' | 'generic' = 'generic',
): PersonNameMarketErrorCode | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (isPersonNameUsableForMarket(trimmed, region)) return null

  const { allowedScripts } = policyFor(region)

  if (allowedScripts.includes('latin') && !allowedScripts.includes('cyrillic')) {
    if (containsCyrillicLetters(trimmed)) return 'latinCharactersRequired'
    return 'minLatinLetters'
  }

  if (allowedScripts.includes('cyrillic') && !allowedScripts.includes('latin')) {
    if (containsLatinLetters(trimmed)) {
      if (field === 'firstName') return 'cyrillicFirstName'
      if (field === 'lastName') return 'cyrillicLastName'
      return 'cyrillicNameMin'
    }
    return 'cyrillicNameMin'
  }

  // Dual-script future: generic unusable
  return allowedScripts.includes('latin') ? 'minLatinLetters' : 'cyrillicNameMin'
}
