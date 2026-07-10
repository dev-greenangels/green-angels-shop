import {
  containsLatinLetters,
  getRecipientUkrPhoneError,
  isCheckoutPhoneReadyForLookup,
  isValidCyrillicName,
  isValidEmail,
  isValidInternationalPhone,
  isValidRecipientUkrPhone,
  isValidUkrPhone,
} from '@/lib/validation/register-form'

export type CheckoutDeliveryMethod =
  | 'nova-poshta-branch'
  | 'nova-poshta-address'
  | 'pickup'

export type CheckoutPaymentMethod =
  | 'card-online'
  | 'bank-transfer'
  | 'bank-transfer-legal'

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
  cityLabel: string
  postOffice: string
  postOfficeLabel: string
  street: string
  streetLabel: string
  houseNumber: string
  paymentMethod: CheckoutPaymentMethod
  companyEdrpou: string
  companyLegalName: string
  comment: string
  promoCode: string
  promoCodes?: string[]
  splitShipments?: import('@/lib/checkout/shipment-slice').CheckoutSplitShipments
  /** Коли true, доставка для другого split-замовлення копіюється з першого */
  datedDeliverySynced?: boolean
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

export type CheckoutPaymentFieldKey = 'companyEdrpou' | 'companyLegalName'

const EDRPOU_LENGTH = 8

export function sanitizeEdrpouInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, EDRPOU_LENGTH)
}

export function isValidEdrpou(value: string): boolean {
  return new RegExp(`^\\d{${EDRPOU_LENGTH}}$`).test(value.trim())
}

export function isValidLegalEntityName(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length >= 3 && trimmed.length <= 256
}

export {
  formatCheckoutPhoneDisplay,
  formatPhoneDisplay,
  getCheckoutPhoneLookupDelayMs,
  getCheckoutPhoneLookupKind,
  isCheckoutPhoneReadyForLookup,
  isValidInternationalPhone,
  isValidRecipientUkrPhone,
  isValidUkrPhone,
  getRecipientUkrPhoneError,
  sanitizeCheckoutPhoneInput,
  sanitizeCyrillicName,
  sanitizeEmail,
  sanitizePhoneInput,
  sanitizeRecipientPhoneInput,
  type CheckoutPhoneLookupKind,
} from '@/lib/validation/register-form'

function isNonEmpty(value: string, min = 2): boolean {
  return value.trim().length >= min
}

function hasValue(value: string): boolean {
  return value.trim().length > 0
}

function isRecipientSectionValid(values: CheckoutFormValues): boolean {
  if (!values.isOtherRecipient) return true

  if (!isValidCyrillicName(values.recipientFirstName)) return false
  if (!isValidCyrillicName(values.recipientLastName)) return false

  if (recipientPatronymicRequired(values)) {
    const patronymic = values.recipientPatronymic.trim()
    if (!patronymic || !isValidCyrillicName(patronymic)) return false
  } else if (!isOptionalCyrillicNameValid(values.recipientPatronymic)) {
    return false
  }

  if (!isValidRecipientUkrPhone(values.recipientPhone)) return false
  return true
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

/** UA-телефон замовника на кроці 2 — немає валідного українського номера. */
function ordererDeliveryPhoneRequired(
  values: CheckoutFormValues,
  identification?: CheckoutIdentificationState,
): boolean {
  if (values.isOtherRecipient) return false
  return !isValidUkrPhone(values.phone)
}

export function showOrdererDeliveryPhoneField(
  values: CheckoutFormValues,
  identification?: CheckoutIdentificationState,
): boolean {
  return ordererDeliveryPhoneRequired(values, identification)
}

/** По батькові замовника для адресної НП — не потрібне, якщо отримувач інша людина */
function shippingPatronymicRequired(values: CheckoutFormValues): boolean {
  return (
    values.deliveryMethod === 'nova-poshta-address' && !values.isOtherRecipient
  )
}

/** По батькові іншого отримувача — обовʼязкове для адресної НП */
function recipientPatronymicRequired(values: CheckoutFormValues): boolean {
  return (
    values.isOtherRecipient && values.deliveryMethod === 'nova-poshta-address'
  )
}

export type CheckoutAuthMethod = 'google' | 'sms' | 'email' | null

export type CheckoutIdentificationState = {
  lookupDone: boolean
  customerFound: boolean | null
  returningVerified: boolean
  /** Оформлення як гість без SMS, хоча номер є в базі */
  skippedReturningLogin: boolean
  /** Користувач обрав «Увійти?» і ще не пройшов SMS / не пропустив */
  attemptingReturningLogin: boolean
  authMethod: CheckoutAuthMethod
}

/** ПІБ латиницею, порожнє або невалідне кириличне — доповнити на кроці доставки. */
export function customerNeedsCheckoutNameEntry(
  values: CheckoutFormValues,
  identification: CheckoutIdentificationState,
): boolean {
  if (!identification.returningVerified) return false

  const first = values.firstName.trim()
  const last = values.lastName.trim()
  if (!first || !last) return true
  if (containsLatinLetters(first) || containsLatinLetters(last)) return true
  if (!isValidCyrillicName(first) || !isValidCyrillicName(last)) return true
  return false
}

/** @deprecated використовуйте customerNeedsCheckoutNameEntry */
export function showGoogleCheckoutNamesOnShipping(
  values: CheckoutFormValues,
  identification: CheckoutIdentificationState,
): boolean {
  return customerNeedsCheckoutNameEntry(values, identification)
}

export function isGoogleCheckoutProfileComplete(
  values: CheckoutFormValues,
  identification: CheckoutIdentificationState,
): boolean {
  if (!identification.returningVerified) return true
  return isValidCyrillicName(values.firstName) && isValidCyrillicName(values.lastName)
}

export function isContactStepValid(
  values: CheckoutFormValues,
  identification: CheckoutIdentificationState
): boolean {
  if (!identification.returningVerified) return false

  const hasPhone = Boolean(values.phone.trim()) && isValidInternationalPhone(values.phone)
  const hasEmail = Boolean(values.email.trim()) && isValidEmail(values.email)
  if (!hasPhone && !hasEmail) return false

  if (!isValidCyrillicName(values.firstName) || !isValidCyrillicName(values.lastName)) {
    if (identification.authMethod === 'google' && (hasPhone || hasEmail)) {
      return true
    }
    return false
  }

  return true
}

export function isShippingStepValid(
  values: CheckoutFormValues,
  identification?: CheckoutIdentificationState,
  options?: { shipmentSplit?: boolean },
): boolean {
  if (identification && !isGoogleCheckoutProfileComplete(values, identification)) {
    return false
  }

  if (options?.shipmentSplit && values.splitShipments) {
    const { immediate, dated } = values.splitShipments
    return (
      isSingleShipmentDeliveryValid(values, immediate, identification) &&
      isSingleShipmentDeliveryValid(values, dated, identification)
    )
  }

  return isSingleShipmentDeliveryValid(values, values, identification)
}

function isSingleShipmentDeliveryValid(
  orderer: CheckoutFormValues,
  delivery: Pick<
    CheckoutFormValues,
    | 'deliveryMethod'
    | 'city'
    | 'postOffice'
    | 'street'
    | 'houseNumber'
    | 'deliveryPhone'
    | 'patronymic'
    | 'isOtherRecipient'
    | 'recipientFirstName'
    | 'recipientLastName'
    | 'recipientPatronymic'
    | 'recipientPhone'
  >,
  identification?: CheckoutIdentificationState,
): boolean {
  const merged = { ...orderer, ...delivery }

  if (
    ordererDeliveryPhoneRequired(merged, identification) &&
    !isValidRecipientUkrPhone(merged.deliveryPhone)
  ) {
    return false
  }

  if (!isRecipientSectionValid(merged)) {
    return false
  }

  if (merged.deliveryMethod === 'pickup') {
    return true
  }

  if (!hasValue(merged.city)) {
    return false
  }

  if (merged.deliveryMethod === 'nova-poshta-branch') {
    return hasValue(merged.postOffice)
  }

  if (merged.deliveryMethod === 'nova-poshta-address') {
    if (!hasValue(merged.street) || !hasValue(merged.houseNumber)) {
      return false
    }

    if (!merged.isOtherRecipient) {
      const patronymic = merged.patronymic.trim()
      if (!patronymic || !isValidCyrillicName(patronymic)) {
        return false
      }
    }

    return true
  }

  return false
}

export function isPaymentStepValid(values: CheckoutFormValues): boolean {
  if (values.paymentMethod !== 'bank-transfer-legal') return true
  return isValidEdrpou(values.companyEdrpou) && isValidLegalEntityName(values.companyLegalName)
}

export function getCheckoutPaymentFieldError(
  field: CheckoutPaymentFieldKey,
  values: CheckoutFormValues,
): string | null {
  if (values.paymentMethod !== 'bank-transfer-legal') return null

  switch (field) {
    case 'companyEdrpou':
      if (!values.companyEdrpou.trim()) return 'Обовʼязкове поле'
      if (!isValidEdrpou(values.companyEdrpou)) {
        return `ЄДРПОУ має містити ${EDRPOU_LENGTH} цифр`
      }
      return null
    case 'companyLegalName':
      if (!values.companyLegalName.trim()) return 'Обовʼязкове поле'
      if (!isValidLegalEntityName(values.companyLegalName)) {
        return 'Вкажіть повну назву юридичної особи (мін. 3 символи)'
      }
      return null
    default:
      return null
  }
}

export function getCheckoutContactFieldError(
  field: CheckoutContactFieldKey,
  values: CheckoutFormValues
): string | null {
  switch (field) {
    case 'firstName':
      if (!values.firstName.trim()) return 'Обовʼязкове поле'
      if (containsLatinLetters(values.firstName)) {
        return 'Вкажіть імʼя українською мовою (кирилицею)'
      }
      if (!isValidCyrillicName(values.firstName)) {
        return 'Від 2 українських літер, апостроф дозволений'
      }
      return null
    case 'lastName':
      if (!values.lastName.trim()) return 'Обовʼязкове поле'
      if (containsLatinLetters(values.lastName)) {
        return 'Вкажіть прізвище українською мовою (кирилицею)'
      }
      if (!isValidCyrillicName(values.lastName)) {
        return 'Від 2 українських літер, апостроф дозволений'
      }
      return null
    case 'phone':
      if (!values.phone.trim()) return 'Обовʼязкове поле'
      if (!isValidInternationalPhone(values.phone)) {
        return 'Введіть коректний номер телефону'
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
      if (recipientPatronymicRequired(values)) {
        if (!values.recipientPatronymic.trim()) return 'Обовʼязкове для адресної доставки'
        if (!isValidCyrillicName(values.recipientPatronymic)) {
          return 'Від 2 українських літер, апостроф дозволений'
        }
        return null
      }
      if (!isOptionalCyrillicNameValid(values.recipientPatronymic)) {
        return 'Від 2 українських літер, апостроф дозволений'
      }
      return null
    case 'recipientPhone':
      return getRecipientUkrPhoneError(values.recipientPhone)
    default:
      return null
  }
}

export function getCheckoutShippingFieldError(
  field: CheckoutShippingFieldKey,
  values: CheckoutFormValues,
  identification?: CheckoutIdentificationState,
): string | null {
  if (field === 'deliveryPhone') {
    if (!ordererDeliveryPhoneRequired(values, identification)) return null
    return getRecipientUkrPhoneError(values.deliveryPhone)
  }

  if (field === 'patronymic') {
    if (!shippingPatronymicRequired(values)) return null
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
      if (!hasValue(values.houseNumber)) return 'Обовʼязкове поле'
      return null
    default:
      return null
  }
}
