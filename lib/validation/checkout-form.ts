import {
  isValidCyrillicName,
  isValidEmail,
  isValidUkrPhone,
  sanitizeCyrillicName,
  sanitizeEmail,
  sanitizePhoneInput,
} from '@/lib/validation/register-form'

export type CheckoutFormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  address: string
  postOffice: string
  deliveryMethod: string
  paymentMethod: string
  comment: string
}

export type CheckoutContactFieldKey = 'firstName' | 'lastName' | 'email' | 'phone'
export type CheckoutShippingFieldKey = 'city' | 'postOffice' | 'address'

export { sanitizeCyrillicName, sanitizeEmail, sanitizePhoneInput }
export { formatPhoneDisplay } from '@/lib/validation/register-form'

function isNonEmpty(value: string, min = 2): boolean {
  return value.trim().length >= min
}

export function isContactStepValid(values: CheckoutFormValues): boolean {
  return (
    isValidCyrillicName(values.firstName) &&
    isValidCyrillicName(values.lastName) &&
    values.email.trim().length > 0 &&
    isValidEmail(values.email) &&
    isValidUkrPhone(values.phone)
  )
}

export function isShippingStepValid(values: CheckoutFormValues): boolean {
  if (values.deliveryMethod === 'pickup') return true
  return isNonEmpty(values.city) && isNonEmpty(values.postOffice)
}

export function getCheckoutContactFieldError(
  field: CheckoutContactFieldKey,
  values: CheckoutFormValues
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
      if (!values.email.trim()) return 'Обовʼязкове поле'
      if (!isValidEmail(values.email)) return 'Невірний формат email'
      return null
    case 'phone':
      if (!values.phone.trim()) return 'Обовʼязкове поле'
      if (!isValidUkrPhone(values.phone)) {
        return 'Почніть з + або 0. Формат: +380 XX XXX XX XX або 0XX XXX XX XX'
      }
      return null
    default:
      return null
  }
}

export function getCheckoutShippingFieldError(
  field: CheckoutShippingFieldKey,
  values: CheckoutFormValues
): string | null {
  if (values.deliveryMethod === 'pickup') return null

  switch (field) {
    case 'city':
      if (!values.city.trim()) return 'Обовʼязкове поле'
      if (!isNonEmpty(values.city)) return 'Мінімум 2 символи'
      return null
    case 'postOffice':
      if (values.deliveryMethod !== 'nova-poshta') return null
      if (!values.postOffice.trim()) return 'Обовʼязкове поле'
      if (!isNonEmpty(values.postOffice)) return 'Мінімум 2 символи'
      return null
    case 'address':
      return null
    default:
      return null
  }
}
