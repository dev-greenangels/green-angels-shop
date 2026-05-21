/** Українські літери та апостроф, мінімум 2 літери, без крапок і ком */
const CYRILLIC_LETTER = 'А-Яа-яІіЇїЄєҐґ'
const NAME_APOSTROPHE = "''ʼ"
export const CYRILLIC_NAME_REGEX = new RegExp(
  `^[${CYRILLIC_LETTER}${NAME_APOSTROPHE}]+$`
)

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const CYRILLIC_NAME_FILTER = new RegExp(`[^${CYRILLIC_LETTER}${NAME_APOSTROPHE}]`, 'g')
const EMAIL_FILTER = /[^\w.@+-]/g

const PLUS_COUNTRY_PREFIX = '380'
/** +380 + 9 цифр абонента */
const PLUS_MAX_DIGITS_AFTER_PLUS = 12

export function sanitizeCyrillicName(value: string): string {
  return value.replace(CYRILLIC_NAME_FILTER, '')
}

export function isValidCyrillicName(value: string): boolean {
  const trimmed = value.trim()
  if (!CYRILLIC_NAME_REGEX.test(trimmed)) return false
  const letterCount = (trimmed.match(new RegExp(`[${CYRILLIC_LETTER}]`, 'g')) ?? []).length
  return letterCount >= 2
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
 * Початок лише з «+» або «0».
 * «+»: далі лише префікс 380, потім до 9 цифр (без автодоповнення).
 * «0»: національний формат, до 10 цифр (0 + 9).
 */
export function sanitizePhoneInput(value: string): string {
  const compact = value.replace(/\s/g, '')
  if (!compact) return ''

  if (compact[0] !== '+' && compact[0] !== '0') {
    return ''
  }

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

  if (compact.startsWith('0')) {
    return compact.replace(/\D/g, '').slice(0, 10)
  }

  return ''
}

export function formatPhoneDisplay(value: string): string {
  if (!value) return ''

  if (value.startsWith('+')) {
    const allDigits = value.slice(1)
    if (allDigits.length <= PLUS_COUNTRY_PREFIX.length) {
      return '+' + allDigits
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

export function isValidUkrPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (/^380\d{9}$/.test(digits)) return true
  if (/^0\d{9}$/.test(digits)) return true
  return false
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
        return 'Від 2 українських літер'
      }
      return null
    case 'lastName':
      if (!values.lastName.trim()) return 'Обовʼязкове поле'
      if (!isValidCyrillicName(values.lastName)) {
        return 'Від 2 українських літер'
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
        return 'Почніть з + або 0. Формат: +380 XX XXX XX XX або 0XX XXX XX XX'
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
