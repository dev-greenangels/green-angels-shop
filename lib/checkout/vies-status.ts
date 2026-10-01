/**
 * Shop-side canonical VIES state — mirrors backend `resolveViesStatus`.
 * UI and Backstage should use this instead of guessing from `valid` alone.
 */

export type ViesStatus = 'VALID' | 'INVALID' | 'ERROR' | 'NOT_CHECKED'

export type ViesSource = 'format' | 'vies_rest' | 'vies_rest_audit' | 'unavailable'

export function resolveViesStatus(input: {
  companyVatId?: string | null
  viesCheck?: {
    valid: boolean | null
    source?: string | null
  } | null
}): ViesStatus {
  const check = input.viesCheck
  if (!check) return 'NOT_CHECKED'
  if (check.valid === true) return 'VALID'
  if (check.valid === false) return 'INVALID'
  return 'ERROR'
}

/** Derive checkout display state from a live VIES API result (+ loading/empty). */
export function resolveCheckoutViesUiState(input: {
  vatDigits: string
  loading: boolean
  result: {
    valid: boolean | null
    source?: string | null
  } | null
}): 'EMPTY' | 'CHECKING' | 'VALID' | 'INVALID' | 'ERROR' | 'FORMAT' {
  const digits = input.vatDigits.replace(/\D/g, '').trim()
  if (!digits) return 'EMPTY'
  if (input.loading) return 'CHECKING'
  if (!input.result) {
    return digits.length > 0 && digits.length < 4 ? 'FORMAT' : 'EMPTY'
  }
  if (input.result.source === 'format') return 'FORMAT'
  if (input.result.valid === true) return 'VALID'
  if (input.result.valid === false) return 'INVALID'
  if (input.result.valid === null) return 'ERROR'
  return 'EMPTY'
}

export function viesRequestKey(countryCode: string, vatNumber: string): string {
  return `${countryCode.trim().toUpperCase()}:${vatNumber.replace(/\D/g, '').trim()}`
}
