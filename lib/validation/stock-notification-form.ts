import type { MarketRegion } from '@/lib/settings/market'
import {
  phoneErrorForPolicy,
  type PhonePolicy,
} from '@/lib/settings/market'
import {
  getRecipientUkrPhoneError,
  isValidCyrillicName,
  isValidEmail,
  isValidLatinName,
  sanitizeCheckoutPhoneInput,
  sanitizeCyrillicName,
  sanitizeEmail,
  sanitizeLatinName,
  sanitizeRecipientPhoneInput,
} from '@/lib/validation/register-form'

export {
  formatCheckoutPhoneDisplay,
  formatPhoneDisplay,
  sanitizeEmail,
} from '@/lib/validation/register-form'

export function sanitizeNotifyName(value: string, region: MarketRegion): string {
  return region === 'sk' ? sanitizeLatinName(value) : sanitizeCyrillicName(value)
}

export function isValidNotifyName(value: string, region: MarketRegion): boolean {
  return region === 'sk' ? isValidLatinName(value) : isValidCyrillicName(value)
}

export function sanitizeNotifyPhoneInput(value: string, policy: PhonePolicy): string {
  if (policy === 'ua_e164') return sanitizeRecipientPhoneInput(value)
  return sanitizeCheckoutPhoneInput(value)
}

export function validateNotifyName(
  name: string,
  region: MarketRegion,
  messages: { required: string; invalid: string },
): string | null {
  const trimmed = name.trim()
  if (!trimmed) return messages.required
  if (!isValidNotifyName(trimmed, region)) return messages.invalid
  return null
}

export function validateNotifyEmail(
  email: string,
  messages: { required: string; invalid: string },
): string | null {
  const trimmed = email.trim()
  if (!trimmed) return messages.required
  if (!isValidEmail(trimmed)) return messages.invalid
  return null
}

export function validateNotifyPhone(
  phone: string,
  policy: PhonePolicy,
  messages?: { required?: string; invalid?: string },
): string | null {
  if (policy === 'ua_e164') {
    const err = getRecipientUkrPhoneError(phone)
    if (!err) return null
    if (err.includes('Обов') && messages?.required) return messages.required
    return messages?.invalid ?? err
  }
  const err = phoneErrorForPolicy(phone, policy)
  if (!err) return null
  if (err.includes('Обов') && messages?.required) return messages.required
  return messages?.invalid ?? err
}
