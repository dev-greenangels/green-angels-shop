import {
  getRecipientUkrPhoneError,
  isValidCyrillicName,
  isValidEmail,
  sanitizeCyrillicName,
  sanitizeEmail,
  sanitizeRecipientPhoneInput,
} from '@/lib/validation/register-form'
import { REVIEW_IMAGE_PATH_REGEX } from '@/lib/review-image'

const FULL_NAME_FILTER = /[^А-Яа-яІіЇїЄєҐґ'ʼ\s.-]/g

export function sanitizeReviewFullName(value: string): string {
  return value.replace(FULL_NAME_FILTER, '').replace(/\s+/g, ' ').trimStart()
}

export function isValidReviewFullName(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length < 2 || trimmed.length > 120) return false
  if (!/[А-Яа-яІіЇїЄєҐґ'ʼ]/.test(trimmed)) return false
  return /^[А-Яа-яІіЇїЄєҐґ'ʼ\s.-]+$/.test(trimmed)
}

export function sanitizeReviewText(value: string): string {
  return value.replace(/[<>]/g, '').slice(0, 2000)
}

export function validateReviewFullName(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Вкажіть ПІБ.'
  if (!isValidReviewFullName(trimmed)) {
    return 'ПІБ має містити лише літери, пробіли та дефіс (2–120 символів).'
  }
  return null
}

export function validateReviewEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return null
  if (!isValidEmail(trimmed)) return 'Невірний формат email.'
  return null
}

export function validateReviewPhone(phone: string): string | null {
  const trimmed = phone.trim()
  if (!trimmed) return null
  return getRecipientUkrPhoneError(trimmed)
}

export function validateReviewContact(email: string, phone: string): string | null {
  const hasEmail = email.trim().length > 0
  const hasPhone = phone.trim().length > 0
  if (!hasEmail && !hasPhone) return 'Вкажіть email або телефон.'
  if (hasEmail && validateReviewEmail(email)) return validateReviewEmail(email)
  if (hasPhone && validateReviewPhone(phone)) return validateReviewPhone(phone)
  return null
}

export function validateReviewText(text: string): string | null {
  const trimmed = text.trim()
  if (trimmed.length < 10) return 'Текст відгуку має містити щонайменше 10 символів.'
  if (trimmed.length > 2000) return 'Текст відгуку занадто довгий.'
  if (/[<>]/.test(trimmed)) return 'Текст не може містити HTML-теги.'
  return null
}

export function validateReviewImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl?.trim()) return null
  if (!REVIEW_IMAGE_PATH_REGEX.test(imageUrl.trim())) {
    return 'Некоректне зображення.'
  }
  return null
}

export function validateReviewRating(rating: number): string | null {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return 'Оберіть оцінку від 1 до 5 зірок.'
  }
  return null
}

export function validateReviewImages(imageUrls: string[]): string | null {
  if (imageUrls.length > 3) return 'Можна додати не більше 3 фото.'
  for (const url of imageUrls) {
    const error = validateReviewImageUrl(url)
    if (error) return error
  }
  return null
}

export {
  sanitizeCyrillicName,
  sanitizeEmail,
  sanitizeRecipientPhoneInput,
  isValidCyrillicName,
}
