/** Українські літери (апостроф дозволений), мінімум 2 символи */
export const CYRILLIC_NAME_REGEX = /^[А-Яа-яІіЇїЄєҐґ'ʼ]{2,}$/

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const CYRILLIC_NAME_FILTER = /[^А-Яа-яІіЇїЄєҐґ'ʼ]/g
const EMAIL_FILTER = /[^\w.@+-]/g

const PLUS_COUNTRY_PREFIX = '380'
const PLUS_MAX_DIGITS_AFTER_PLUS = 12

export function sanitizeCyrillicName(value: string): string {
  return value.replace(CYRILLIC_NAME_FILTER, '')
}

export function isValidCyrillicName(value: string): boolean {
  return CYRILLIC_NAME_REGEX.test(value.trim())
}

const LATIN_LETTER_REGEX = /[A-Za-z]/
const CYRILLIC_LETTER_REGEX = /[А-Яа-яІіЇїЄєҐґЁё]/
/** Latin letters + EU diacritics + apostrophe / hyphen / space; min 2 letters overall after trim */
export const LATIN_NAME_REGEX =
  /^[A-Za-zÀ-ÖØ-öø-ÿĀ-žĄąĆćČčĎďĐđĘęĚěĹĺĽľŁłŃńŇňŐőŘřŚśŠšŤťŮůŰűŹźŻżŽž'ʼ\- ]{2,}$/
const LATIN_NAME_FILTER =
  /[^A-Za-zÀ-ÖØ-öø-ÿĀ-žĄąĆćČčĎďĐđĘęĚěĹĺĽľŁłŃńŇňŐőŘřŚśŠšŤťŮůŰűŹźŻżŽž'ʼ\- ]/g

export function containsLatinLetters(value: string): boolean {
  return LATIN_LETTER_REGEX.test(value)
}

export function containsCyrillicLetters(value: string): boolean {
  return CYRILLIC_LETTER_REGEX.test(value)
}

export function sanitizeLatinName(value: string): string {
  return value.replace(LATIN_NAME_FILTER, '')
}

export function isValidLatinName(value: string): boolean {
  const trimmed = value.trim()
  if (!LATIN_NAME_REGEX.test(trimmed)) return false
  return /[A-Za-zÀ-ÖØ-öø-ÿĀ-ž]/.test(trimmed)
}

export function sanitizeEmail(value: string): string {
  return value.replace(EMAIL_FILTER, '')
}

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  return EMAIL_REGEX.test(trimmed)
}

/**
 * + на початку: лише префікс 380, потім до 9 цифр (без автодоповнення).
 * 0 на початку: національний формат, до 10 цифр (0 + 9).
 */
export function sanitizePhoneInput(value: string): string {
  const compact = value.replace(/\s/g, '')
  if (!compact) return ''

  if (compact.startsWith('+')) {
    const digitsAfter = compact.slice(1).replace(/\D/g, '')
    let built = '+'

    for (const d of digitsAfter) {
      const n = built.length - 1
      if (n < PLUS_COUNTRY_PREFIX.length) {
        if (d === PLUS_COUNTRY_PREFIX[n]) built += d
      } else if (n < PLUS_MAX_DIGITS_AFTER_PLUS) {
        built += d
      }
    }

    return built
  }

  const digits = compact.replace(/\D/g, '')
  if (digits.startsWith('0')) {
    return digits.slice(0, 10)
  }

  if (/^\d+$/.test(compact)) {
    return digits.slice(0, 10)
  }

  return digits.slice(0, 10)
}

/**
 * Телефон іншого отримувача: лише +380 (до 9 цифр після коду) або 0 (до 10 цифр).
 * Інші префікси (наприклад, 50… без 0) не приймаються.
 */
export function sanitizeRecipientPhoneInput(value: string): string {
  const compact = value.replace(/\s/g, '')
  if (!compact) return ''

  if (compact.startsWith('+')) {
    const digitsAfter = compact.slice(1).replace(/\D/g, '')
    let built = '+'

    for (const d of digitsAfter) {
      const n = built.length - 1
      if (n < PLUS_COUNTRY_PREFIX.length) {
        if (d === PLUS_COUNTRY_PREFIX[n]) built += d
      } else if (n < PLUS_MAX_DIGITS_AFTER_PLUS) {
        built += d
      }
    }

    return built
  }

  const digits = compact.replace(/\D/g, '')
  if (digits.startsWith('0')) {
    return digits.slice(0, 10)
  }

  return ''
}

/** E.164 для чекауту: лише + на початку та цифри, без зміни формату (макс. 15 цифр). */
export const MAX_INTERNATIONAL_PHONE_DIGITS = 15

export function sanitizeCheckoutPhoneInput(value: string): string {
  const startsWithPlus = value.trimStart().startsWith('+')
  const digits = value.replace(/\D/g, '').slice(0, MAX_INTERNATIONAL_PHONE_DIGITS)
  if (!digits) return startsWithPlus ? '+' : ''
  return startsWithPlus ? `+${digits}` : digits
}

export function formatPhoneDisplay(value: string): string {
  if (!value) return ''

  if (value.startsWith('+')) {
    const allDigits = value.slice(1)
    if (allDigits.length <= PLUS_COUNTRY_PREFIX.length) {
      return `+${allDigits}`
    }

    const local = allDigits.slice(PLUS_COUNTRY_PREFIX.length)
    if (!local.length) return '+380'

    if (local.length <= 2) return `+380 ${local}`
    if (local.length <= 5) return `+380 ${local.slice(0, 2)} ${local.slice(2)}`
    if (local.length <= 7) {
      return `+380 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`
    }
    return `+380 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7)}`
  }

  const d = value.replace(/\D/g, '').slice(0, 10)
  if (!d.length) return ''
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
}

/** Лише для підсумку замовлення — не змінює цифри, лише пробіли для читабельності. */
export function formatCheckoutPhoneDisplay(value: string): string {
  if (!value) return ''
  if (isValidUkrPhone(value)) {
    const digits = value.replace(/\D/g, '')
    if (value.startsWith('+') || digits.startsWith('380')) {
      const normalized = digits.startsWith('380') ? `+${digits}` : value
      return formatPhoneDisplay(normalized)
    }
    return formatPhoneDisplay(value)
  }
  return value
}

export function isValidUkrPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (/^380\d{9}$/.test(digits)) return true
  if (/^0\d{9}$/.test(digits)) return true
  return false
}

export const RECIPIENT_UKR_PHONE_ERROR =
  'Номер має починатися з +380 (ще 9 цифр) або з 0 (ще 9 цифр, разом 10)'

/** Телефон іншого отримувача: повний UA-номер і дозволений лише префікс +380 або 0. */
export function isValidRecipientUkrPhone(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || !isValidUkrPhone(trimmed)) return false

  const compact = trimmed.replace(/\s/g, '')
  if (compact.startsWith('+')) {
    const digits = compact.slice(1).replace(/\D/g, '')
    return digits.startsWith('380') && digits.length === 12
  }

  const digits = compact.replace(/\D/g, '')
  return compact.startsWith('0') && digits.length === 10
}

export function getRecipientUkrPhoneError(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Обовʼязкове поле'

  const compact = trimmed.replace(/\s/g, '')

  if (compact.startsWith('+')) {
    const digits = compact.slice(1).replace(/\D/g, '')
    if (digits.length > 0 && !digits.startsWith('380')) {
      return RECIPIENT_UKR_PHONE_ERROR
    }
    if (isValidRecipientUkrPhone(trimmed)) return null
    if (!digits.length || digits === '3' || digits === '38') {
      return 'Почніть з +380'
    }
    if (digits.startsWith('380') && digits.length < 12) {
      return 'Після +380 потрібно ще 9 цифр'
    }
    return RECIPIENT_UKR_PHONE_ERROR
  }

  if (compact.startsWith('0')) {
    const digits = compact.replace(/\D/g, '')
    if (isValidRecipientUkrPhone(trimmed)) return null
    if (digits.length < 10) {
      return 'Після 0 потрібно ще 9 цифр (10 цифр загалом)'
    }
    return RECIPIENT_UKR_PHONE_ERROR
  }

  return RECIPIENT_UKR_PHONE_ERROR
}

export const MIN_INTERNATIONAL_PHONE_DIGITS = 10

export type CheckoutPhoneLookupKind = 'none' | 'ukrainian' | 'international'

/** Чи достатньо цифр для запиту на сервер (до повної валідації форми). */
export function getCheckoutPhoneLookupKind(value: string): CheckoutPhoneLookupKind {
  const trimmed = value.trim()
  if (!trimmed) return 'none'

  const allDigits = trimmed.replace(/\D/g, '')

  if (trimmed.startsWith('+')) {
    const afterPlus = trimmed.slice(1).replace(/\D/g, '')
    if (afterPlus.startsWith('380')) {
      return afterPlus.length >= 12 ? 'ukrainian' : 'none'
    }
    return afterPlus.length >= MIN_INTERNATIONAL_PHONE_DIGITS ? 'international' : 'none'
  }

  if (allDigits.startsWith('0')) {
    return allDigits.length >= 10 ? 'ukrainian' : 'none'
  }

  if (allDigits.startsWith('380') && allDigits.length >= 12) {
    return 'ukrainian'
  }

  return allDigits.length >= MIN_INTERNATIONAL_PHONE_DIGITS ? 'international' : 'none'
}

export function getCheckoutPhoneLookupDelayMs(kind: CheckoutPhoneLookupKind): number {
  if (kind === 'ukrainian') return 2000
  if (kind === 'international') return 3000
  return 0
}

export function isCheckoutPhoneReadyForLookup(value: string): boolean {
  return getCheckoutPhoneLookupKind(value) !== 'none'
}

export function isValidInternationalPhone(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false

  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 15
  }

  const digits = trimmed.replace(/\D/g, '')
  if (isValidUkrPhone(trimmed)) return true
  return digits.length >= 10 && digits.length <= 15
}

export type RegisterFormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
}

export type RegisterFieldKey = keyof RegisterFormValues

export function getRegisterFieldError(
  field: RegisterFieldKey,
  values: RegisterFormValues
): string | null {
  switch (field) {
    case 'firstName':
      if (!values.firstName.trim()) return 'Обовʼязкове поле'
      if (!isValidCyrillicName(values.firstName)) {
        return 'Від 2 українських літер, апостроф дозволений'
      }
      return null
    case 'lastName':
      if (!values.lastName.trim()) return 'Обовʼязкове поле'
      if (!isValidCyrillicName(values.lastName)) {
        return 'Від 2 українських літер, апостроф дозволений'
      }
      return null
    case 'email':
      if (values.email.trim() && !isValidEmail(values.email)) {
        return 'Невірний формат email'
      }
      return null
    case 'phone':
      if (!values.phone.trim()) return 'Обовʼязкове поле'
      if (!isValidUkrPhone(values.phone)) {
        return 'Формат: +380 XX XXX XX XX або 0XX XXX XX XX'
      }
      return null
    case 'password':
      if (!values.password) return 'Обовʼязкове поле'
      if (values.password.length < 8) return 'Мінімум 8 символів'
      return null
    case 'confirmPassword':
      if (!values.confirmPassword) return 'Обовʼязкове поле'
      if (values.password !== values.confirmPassword) return 'Паролі не співпадають'
      return null
    case 'agreeTerms':
      if (!values.agreeTerms) return 'Потрібна згода з умовами'
      return null
    default:
      return null
  }
}

export function isRegisterFormValid(values: RegisterFormValues): boolean {
  const { firstName, lastName, email, phone, password, confirmPassword, agreeTerms } =
    values

  if (!isValidCyrillicName(firstName)) return false
  if (!isValidCyrillicName(lastName)) return false
  if (!isValidUkrPhone(phone)) return false
  if (email.trim() && !isValidEmail(email)) return false
  if (password.length < 8) return false
  if (password !== confirmPassword) return false
  if (!agreeTerms) return false

  return true
}
