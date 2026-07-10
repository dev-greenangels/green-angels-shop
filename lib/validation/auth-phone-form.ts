import {
  getCheckoutContactFieldError,
  isContactStepValid,
  isValidInternationalPhone,
  isValidUkrPhone,
  type CheckoutContactFieldKey,
  type CheckoutFormValues,
  type CheckoutIdentificationState,
} from '@/lib/validation/checkout-form'
import { getCheckoutPhoneLookupKind, isValidEmail } from '@/lib/validation/register-form'

export type AuthPhoneFormValues = Pick<
  CheckoutFormValues,
  'phone' | 'firstName' | 'lastName' | 'email'
>

export type AuthPhoneFieldKey = CheckoutContactFieldKey

export function isInternationalAuthPhone(phone: string): boolean {
  return getCheckoutPhoneLookupKind(phone) === 'international'
}

export function needsAuthEmail(phone: string): boolean {
  return Boolean(phone.trim()) && !isValidUkrPhone(phone)
}

export function getAuthPhoneFieldError(
  field: AuthPhoneFieldKey,
  values: AuthPhoneFormValues
): string | null {
  return getCheckoutContactFieldError(field, values as CheckoutFormValues)
}

export function isAuthPhoneFormValid(
  values: AuthPhoneFormValues,
  identification: CheckoutIdentificationState
): boolean {
  return isContactStepValid(values as CheckoutFormValues, identification)
}

export function isAuthProfileFieldsValid(values: AuthPhoneFormValues): boolean {
  const v = values as CheckoutFormValues
  if (!v.firstName.trim() || !v.lastName.trim()) return false
  if (getAuthPhoneFieldError('firstName', values)) return false
  if (getAuthPhoneFieldError('lastName', values)) return false
  if (needsAuthEmail(v.phone)) {
    if (!v.email.trim() || !isValidEmail(v.email)) return false
  }
  if (!v.phone.trim() || !isValidInternationalPhone(v.phone)) return false
  return true
}

export {
  formatPhoneDisplay,
  getCheckoutPhoneLookupDelayMs,
  getCheckoutPhoneLookupKind,
  isCheckoutPhoneReadyForLookup,
  sanitizeCheckoutPhoneInput,
  sanitizeCyrillicName,
  sanitizeEmail,
} from '@/lib/validation/checkout-form'
