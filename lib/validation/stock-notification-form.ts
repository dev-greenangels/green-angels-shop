import {
  getRecipientUkrPhoneError,
  isValidCyrillicName,
  isValidEmail,
  sanitizeCyrillicName,
  sanitizeEmail,
  sanitizeRecipientPhoneInput,
} from '@/lib/validation/register-form'

export {
  formatPhoneDisplay,
  sanitizeCyrillicName,
  sanitizeEmail,
  sanitizeRecipientPhoneInput,
} from '@/lib/validation/register-form'

export function validateNotifyName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Вкажіть ваше імʼя.'
  if (!isValidCyrillicName(trimmed)) {
    return 'Імʼя має містити лише літери (мінімум 2 символи).'
  }
  return null
}

export function validateNotifyEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return 'Вкажіть email.'
  if (!isValidEmail(trimmed)) return 'Невірний формат email.'
  return null
}

export function validateNotifyPhone(phone: string): string | null {
  return getRecipientUkrPhoneError(phone)
}
