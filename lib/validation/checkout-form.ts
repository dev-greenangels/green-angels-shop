import {
  isCheckoutPhoneReadyForLookup,
  isValidCyrillicName,
  isValidEmail,
  isValidInternationalPhone,
  isValidUkrPhone,
} from '@/lib/validation/register-form'

export type CheckoutDeliveryMethod =
  | 'nova-poshta-branch'
  | 'nova-poshta-address'
  | 'pickup'

export type CheckoutFormValues = {
  firstName: string
  lastName: string
  patronymic: string
  email: string
  phone: string
  deliveryPhone: string
  isOtherRecipient: boolean
  recipientFirstName: string
  recipientLastName: string
  recipientPatronymic: string
  recipientPhone: string
  deliveryMethod: CheckoutDeliveryMethod
  city: string
  postOffice: string
  street: string
  houseNumber: string
  paymentMethod: string
  comment: string
}

export type CheckoutContactFieldKey =
  | 'firstName'
  | 'lastName'
  | 'patronymic'
  | 'email'
  | 'phone'

export type CheckoutRecipientFieldKey =
  | 'recipientFirstName'
  | 'recipientLastName'
  | 'recipientPatronymic'
  | 'recipientPhone'

export type CheckoutShippingFieldKey =
  | 'city'
  | 'postOffice'
  | 'street'
  | 'houseNumber'
  | 'deliveryPhone'
  | 'patronymic'

export {
  formatCheckoutPhoneDisplay,
  formatPhoneDisplay,
  getCheckoutPhoneLookupDelayMs,
  getCheckoutPhoneLookupKind,
  isCheckoutPhoneReadyForLookup,
  isValidInternationalPhone,
  isValidUkrPhone,
  sanitizeCheckoutPhoneInput,
  sanitizeCyrillicName,
  sanitizeEmail,
  sanitizePhoneInput,
  type CheckoutPhoneLookupKind,
} from '@/lib/validation/register-form'

function isNonEmpty(value: string, min = 2): boolean {
  return value.trim().length >= min
}

function isOptionalCyrillicNameValid(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  return isValidCyrillicName(trimmed)
}

function emailRequiredForPhone(phone: string): boolean {
  return !isValidUkrPhone(phone)
}

function contactEmailValid(values: CheckoutFormValues): boolean {
  const email = values.email.trim()
  if (!emailRequiredForPhone(values.phone)) {
    if (!email) return true
    return isValidEmail(email)
  }
  if (!email) return false
  return isValidEmail(email)
}

function needsDeliveryPhone(phone: string): boolean {
  return Boolean(phone.trim()) && !isValidUkrPhone(phone)
}

export type CheckoutIdentificationState = {
  lookupDone: boolean
  customerFound: boolean | null
  returningVerified: boolean
  /** Оформлення як гість без SMS, хоча номер є в базі */
  skippedReturningLogin: boolean
  /** Користувач обрав «Увійти?» і ще не пройшов SMS / не пропустив */
  attemptingReturningLogin: boolean
}

export function isContactStepValid(
  values: CheckoutFormValues,
  identification: CheckoutIdentificationState
): boolean {
  if (!values.phone.trim() || !isValidInternationalPhone(values.phone)) return false
  if (!isValidCyrillicName(values.firstName)) return false
  if (!isValidCyrillicName(values.lastName)) return false

  if (identification.returningVerified) return true

  if (
    identification.customerFound &&
    identification.attemptingReturningLogin &&
    !identification.skippedReturningLogin
  ) {
    return false
  }

  return true
}

export function isShippingStepValid(values: CheckoutFormValues): boolean {
  if (needsDeliveryPhone(values.phone) && !isValidUkrPhone(values.deliveryPhone)) {
    return false
  }

  if (values.isOtherRecipient) {
    if (!isValidCyrillicName(values.recipientFirstName)) return false
    if (!isValidCyrillicName(values.recipientLastName)) return false
    if (!isOptionalCyrillicNameValid(values.recipientPatronymic)) return false
    if (!isValidUkrPhone(values.recipientPhone)) return false
  }

  if (values.deliveryMethod === 'pickup') return true

  if (!isNonEmpty(values.city)) return false

  if (values.deliveryMethod === 'nova-poshta-branch') {
    return isNonEmpty(values.postOffice)
  }

  if (values.deliveryMethod === 'nova-poshta-address') {
    if (!isNonEmpty(values.street) || !isNonEmpty(values.houseNumber)) return false
    const patronymic = values.patronymic.trim()
    if (!patronymic || !isValidCyrillicName(patronymic)) return false
    return true
  }

  return false
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
    case 'patronymic':
      if (!isOptionalCyrillicNameValid(values.patronymic)) {
        return 'Від 2 українських літер, апостроф дозволений'
      }
      return null
    case 'email':
      if (emailRequiredForPhone(values.phone) && !values.email.trim()) {
        return 'Обовʼязкове поле для іноземного номера'
      }
      if (values.email.trim() && !isValidEmail(values.email)) {
        return 'Невірний формат email'
      }
      return null
    case 'phone':
      if (!values.phone.trim()) return 'Обовʼязкове поле'
      if (!isValidInternationalPhone(values.phone)) {
        return 'Введіть коректний номер телефону'
      }
      return null
    default:
      return null
  }
}

export function getCheckoutRecipientFieldError(
  field: CheckoutRecipientFieldKey,
  values: CheckoutFormValues
): string | null {
  if (!values.isOtherRecipient) return null

  switch (field) {
    case 'recipientFirstName':
      if (!values.recipientFirstName.trim()) return 'Обовʼязкове поле'
      if (!isValidCyrillicName(values.recipientFirstName)) {
        return 'Від 2 українських літер, апостроф дозволений'
      }
      return null
    case 'recipientLastName':
      if (!values.recipientLastName.trim()) return 'Обовʼязкове поле'
      if (!isValidCyrillicName(values.recipientLastName)) {
        return 'Від 2 українських літер, апостроф дозволений'
      }
      return null
    case 'recipientPatronymic':
      if (!isOptionalCyrillicNameValid(values.recipientPatronymic)) {
        return 'Від 2 українських літер, апостроф дозволений'
      }
      return null
    case 'recipientPhone':
      if (!values.recipientPhone.trim()) return 'Обовʼязкове поле'
      if (!isValidUkrPhone(values.recipientPhone)) {
        return 'Формат: +380 XX XXX XX XX або 0XX XXX XX XX'
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
  if (field === 'deliveryPhone') {
    if (!needsDeliveryPhone(values.phone)) return null
    if (!values.deliveryPhone.trim()) return 'Обовʼязкове поле'
    if (!isValidUkrPhone(values.deliveryPhone)) {
      return 'Формат: +380 XX XXX XX XX або 0XX XXX XX XX'
    }
    return null
  }

  if (field === 'patronymic') {
    if (values.deliveryMethod !== 'nova-poshta-address') return null
    if (values.patronymic.trim() && isValidCyrillicName(values.patronymic)) return null
    if (!values.patronymic.trim()) return 'Обовʼязкове для адресної доставки'
    return 'Від 2 українських літер, апостроф дозволений'
  }

  if (values.deliveryMethod === 'pickup') return null

  switch (field) {
    case 'city':
      if (!values.city.trim()) return 'Обовʼязкове поле'
      if (!isNonEmpty(values.city)) return 'Мінімум 2 символи'
      return null
    case 'postOffice':
      if (values.deliveryMethod !== 'nova-poshta-branch') return null
      if (!values.postOffice.trim()) return 'Обовʼязкове поле'
      return null
    case 'street':
      if (values.deliveryMethod !== 'nova-poshta-address') return null
      if (!values.street.trim()) return 'Обовʼязкове поле'
      return null
    case 'houseNumber':
      if (values.deliveryMethod !== 'nova-poshta-address') return null
      if (!values.houseNumber.trim()) return 'Обовʼязкове поле'
      return null
    default:
      return null
  }
}
