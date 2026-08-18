import {
  containsCyrillicLetters,
  containsLatinLetters,
  getRecipientUkrPhoneError,
  isValidCyrillicName,
  isValidEmail,
  isValidInternationalPhone,
  isValidLatinName,
  isValidRecipientUkrPhone,
  isValidUkrPhone,
} from '@/lib/validation/register-form'
import {
  defaultDeliveryPhonePolicy,
  isValidPhoneForPolicy,
  phoneErrorForPolicy,
  type PhonePolicy,
} from '@/lib/settings/market'

export type CheckoutDeliveryMethod =
  | 'nova-poshta-branch'
  | 'nova-poshta-address'
  | 'pickup'
  | 'packeta-box'
  | 'packeta-courier'
  | 'gls-courier'

export type CheckoutPaymentMethod =
  | 'card-online'
  | 'bank-transfer'
  | 'bank-transfer-legal'
  | 'dobierka'

/** Методи без адресних НП-полів (самовивіз / Packeta box). */
const DELIVERY_METHODS_WITHOUT_ADDRESS_FIELDS: CheckoutDeliveryMethod[] = [
  'pickup',
  'packeta-box',
]

const COURIER_METHODS: CheckoutDeliveryMethod[] = ['packeta-courier', 'gls-courier']

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
  /** Optional company/org on package (SK; not billing entity) */
  recipientCompanyName: string
  deliveryMethod: CheckoutDeliveryMethod
  /** Shipping destination for SK multi-site (sk|hu|at) */
  deliveryCountryCode: string
  city: string
  cityLabel: string
  postOffice: string
  postOfficeLabel: string
  street: string
  streetLabel: string
  houseNumber: string
  /** Courier postal code (PSČ) */
  postalCode: string
  paymentMethod: CheckoutPaymentMethod
  companyEdrpou: string
  companyLegalName: string
  companyDic: string
  companyStreet: string
  companyCity: string
  companyPostalCode: string
  preferredShipDate: string
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
  | 'recipientCompanyName'

export type CheckoutShippingFieldKey =
  | 'city'
  | 'postOffice'
  | 'street'
  | 'houseNumber'
  | 'postalCode'
  | 'deliveryPhone'
  | 'patronymic'
  | 'deliveryCountryCode'

export type CheckoutPaymentFieldKey =
  | 'companyEdrpou'
  | 'companyLegalName'
  | 'companyDic'
  | 'companyStreet'
  | 'companyCity'
  | 'companyPostalCode'

export type CheckoutMarketRegion = 'ua' | 'sk'

export type CheckoutValidationOptions = {
  marketRegion?: CheckoutMarketRegion
  /** @deprecated use allowGuestCheckout */
  skGuestCheckout?: boolean
  /** Guest may proceed without OTP when market guestCheckoutMode allows it */
  allowGuestCheckout?: boolean
  /** Whether checkout requires customer email (commerce.market.checkoutEmailRequired). */
  checkoutEmailRequired?: boolean
  /** Carrier/delivery phone policy (receiver + orderer delivery phone). */
  deliveryPhonePolicy?: PhonePolicy
  /** Login/identity phone policy for checkout contact phone. */
  authPhonePolicy?: PhonePolicy
}

function resolveDeliveryPhonePolicy(options?: CheckoutValidationOptions): PhonePolicy {
  if (options?.deliveryPhonePolicy) return options.deliveryPhonePolicy
  return defaultDeliveryPhonePolicy(options?.marketRegion ?? 'ua')
}

function resolveAuthPhonePolicy(options?: CheckoutValidationOptions): PhonePolicy {
  if (options?.authPhonePolicy) return options.authPhonePolicy
  return 'intl'
}

function deliveryPhoneError(phone: string, policy: PhonePolicy): string | null {
  if (policy === 'ua_e164') return getRecipientUkrPhoneError(phone)
  const err = phoneErrorForPolicy(phone, policy)
  if (!phone.trim()) return 'Обовʼязкове поле'
  return err
}

function isValidDeliveryPhone(phone: string, policy: PhonePolicy): boolean {
  if (policy === 'ua_e164') return isValidRecipientUkrPhone(phone)
  return isValidPhoneForPolicy(phone, policy)
}

const EDRPOU_LENGTH = 8

export function sanitizeEdrpouInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8)
}

export function isValidEdrpou(value: string): boolean {
  return new RegExp(`^\\d{${EDRPOU_LENGTH}}$`).test(value.trim())
}

/** UA ЄДРПОУ = 8 digits; SK IČO = 6–8 digits */
export function isValidCompanyIco(value: string, region?: 'ua' | 'sk'): boolean {
  const digits = value.trim()
  if (region === 'sk') return /^\d{6,8}$/.test(digits)
  return isValidEdrpou(digits)
}

export function isValidLegalEntityName(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length >= 3 && trimmed.length <= 256
}

export function isValidSkPostalCode(value: string): boolean {
  const compact = value.replace(/\s/g, '')
  return /^\d{3,10}$/.test(compact) || /^[A-Za-z0-9][A-Za-z0-9 \-]{2,11}$/.test(value.trim())
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
  sanitizeLatinName,
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

function isPersonNameValid(value: string, region: CheckoutMarketRegion): boolean {
  if (region === 'sk') return isValidLatinName(value)
  return isValidCyrillicName(value)
}

function isOptionalPersonNameValid(value: string, region: CheckoutMarketRegion): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  return isPersonNameValid(trimmed, region)
}

function isRecipientSectionValid(
  values: CheckoutFormValues,
  region: CheckoutMarketRegion = 'ua',
  deliveryPhonePolicy: PhonePolicy = defaultDeliveryPhonePolicy(region),
): boolean {
  if (!values.isOtherRecipient) return true

  if (!isPersonNameValid(values.recipientFirstName, region)) return false
  if (!isPersonNameValid(values.recipientLastName, region)) return false

  if (region === 'ua') {
    if (recipientPatronymicRequired(values)) {
      const patronymic = values.recipientPatronymic.trim()
      if (!patronymic || !isValidCyrillicName(patronymic)) return false
    } else if (!isOptionalPersonNameValid(values.recipientPatronymic, 'ua')) {
      return false
    }
  }

  if (!isValidDeliveryPhone(values.recipientPhone, deliveryPhonePolicy)) return false

  return true
}

function emailRequiredForPhone(
  phone: string,
  region: CheckoutMarketRegion,
  checkoutEmailRequired?: boolean,
): boolean {
  if (checkoutEmailRequired === false) return false
  if (checkoutEmailRequired === true) return true
  if (region === 'sk') return true
  return !isValidUkrPhone(phone)
}

/**
 * Extra «UA delivery phone» field: only UA market + carrier lock to +380.
 * SK / intl delivery must not show or require this second phone.
 */
export function isUaDeliveryPhoneLockActive(
  region: CheckoutMarketRegion = 'ua',
  deliveryPhonePolicy: PhonePolicy = defaultDeliveryPhonePolicy(region),
): boolean {
  return region === 'ua' && deliveryPhonePolicy === 'ua_e164'
}

/** Extra delivery phone when account/auth phone is not valid for the UA carrier policy. */
function ordererDeliveryPhoneRequired(
  values: CheckoutFormValues,
  identification?: CheckoutIdentificationState,
  region: CheckoutMarketRegion = 'ua',
  deliveryPhonePolicy: PhonePolicy = defaultDeliveryPhonePolicy(region),
): boolean {
  if (!isUaDeliveryPhoneLockActive(region, deliveryPhonePolicy)) return false
  if (values.isOtherRecipient) return false
  return !isValidDeliveryPhone(values.phone, deliveryPhonePolicy)
}

export function showOrdererDeliveryPhoneField(
  values: CheckoutFormValues,
  identification?: CheckoutIdentificationState,
  region: CheckoutMarketRegion = 'ua',
  deliveryPhonePolicy?: PhonePolicy,
): boolean {
  return ordererDeliveryPhoneRequired(
    values,
    identification,
    region,
    deliveryPhonePolicy ?? defaultDeliveryPhonePolicy(region),
  )
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
  options?: CheckoutValidationOptions,
): boolean {
  if (!identification.returningVerified) return false
  const region = options?.marketRegion ?? 'ua'

  const first = values.firstName.trim()
  const last = values.lastName.trim()
  if (!first || !last) return true

  if (region === 'sk') {
    if (containsCyrillicLetters(first) || containsCyrillicLetters(last)) return true
    if (!isValidLatinName(first) || !isValidLatinName(last)) return true
    return false
  }

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
  options?: CheckoutValidationOptions,
): boolean {
  if (!identification.returningVerified) return true
  const region = options?.marketRegion ?? 'ua'
  return (
    isPersonNameValid(values.firstName, region) && isPersonNameValid(values.lastName, region)
  )
}

export function isContactStepValid(
  values: CheckoutFormValues,
  identification: CheckoutIdentificationState,
  options?: CheckoutValidationOptions,
): boolean {
  const region = options?.marketRegion ?? 'ua'
  const checkoutEmailRequired = options?.checkoutEmailRequired ?? true
  const allowGuest =
    options?.allowGuestCheckout === true ||
    (region === 'sk' && options?.skGuestCheckout === true)

  if (!allowGuest && !identification.returningVerified) return false

  const emailValid = Boolean(values.email.trim()) && isValidEmail(values.email)
  const emailInvalid = Boolean(values.email.trim()) && !isValidEmail(values.email)
  if (emailInvalid) return false

  if (region === 'sk') {
    if (checkoutEmailRequired && !emailValid) return false
    if (!values.phone.trim() || !isValidInternationalPhone(values.phone)) return false
    if (!isValidLatinName(values.firstName) || !isValidLatinName(values.lastName)) {
      if (
        !allowGuest &&
        identification.authMethod === 'google' &&
        (values.phone.trim() || values.email.trim())
      ) {
        return true
      }
      return false
    }
    return true
  }

  const hasPhone = Boolean(values.phone.trim()) && isValidInternationalPhone(values.phone)
  const hasEmail = emailValid
  if (checkoutEmailRequired) {
    if (!hasEmail) return false
  } else if (!hasPhone && !hasEmail) {
    return false
  }

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
  options?: CheckoutValidationOptions & { shipmentSplit?: boolean },
): boolean {
  const region = options?.marketRegion ?? 'ua'
  const deliveryPhonePolicy = resolveDeliveryPhonePolicy(options)

  if (
    identification &&
    !isGoogleCheckoutProfileComplete(values, identification, { marketRegion: region })
  ) {
    return false
  }

  if (options?.shipmentSplit && values.splitShipments) {
    const { immediate, dated } = values.splitShipments
    return (
      isSingleShipmentDeliveryValid(values, immediate, identification, region, deliveryPhonePolicy) &&
      isSingleShipmentDeliveryValid(values, dated, identification, region, deliveryPhonePolicy)
    )
  }

  return isSingleShipmentDeliveryValid(values, values, identification, region, deliveryPhonePolicy)
}

function isSingleShipmentDeliveryValid(
  orderer: CheckoutFormValues,
  delivery: Pick<
    CheckoutFormValues,
    | 'deliveryMethod'
    | 'deliveryCountryCode'
    | 'city'
    | 'postOffice'
    | 'street'
    | 'houseNumber'
    | 'postalCode'
    | 'deliveryPhone'
    | 'patronymic'
    | 'isOtherRecipient'
    | 'recipientFirstName'
    | 'recipientLastName'
    | 'recipientPatronymic'
    | 'recipientPhone'
    | 'recipientCompanyName'
  >,
  identification?: CheckoutIdentificationState,
  region: CheckoutMarketRegion = 'ua',
  deliveryPhonePolicy: PhonePolicy = defaultDeliveryPhonePolicy(region),
): boolean {
  const merged = { ...orderer, ...delivery }

  if (region === 'sk' && merged.deliveryMethod !== 'pickup' && !merged.deliveryCountryCode) {
    return false
  }

  if (
    ordererDeliveryPhoneRequired(merged, identification, region, deliveryPhonePolicy) &&
    !isValidDeliveryPhone(merged.deliveryPhone, deliveryPhonePolicy)
  ) {
    return false
  }

  if (!isRecipientSectionValid(merged, region, deliveryPhonePolicy)) {
    return false
  }

  if (DELIVERY_METHODS_WITHOUT_ADDRESS_FIELDS.includes(merged.deliveryMethod)) {
    if (merged.deliveryMethod === 'packeta-box') {
      return hasValue(merged.postOffice)
    }
    return true
  }

  if (!hasValue(merged.city)) {
    return false
  }

  if (merged.deliveryMethod === 'nova-poshta-branch') {
    return hasValue(merged.postOffice)
  }

  if (
    merged.deliveryMethod === 'nova-poshta-address' ||
    COURIER_METHODS.includes(merged.deliveryMethod)
  ) {
    if (!hasValue(merged.street) || !hasValue(merged.houseNumber)) {
      return false
    }

    if (COURIER_METHODS.includes(merged.deliveryMethod)) {
      if (!hasValue(merged.postalCode) || !isValidSkPostalCode(merged.postalCode)) {
        return false
      }
    }

    if (
      merged.deliveryMethod === 'nova-poshta-address' &&
      !merged.isOtherRecipient
    ) {
      const patronymic = merged.patronymic.trim()
      if (!patronymic || !isValidCyrillicName(patronymic)) {
        return false
      }
    }

    return true
  }

  return false
}

export function isPaymentStepValid(
  values: CheckoutFormValues,
  options?: { requireCompanyFields?: boolean; marketRegion?: 'ua' | 'sk' },
): boolean {
  const needCompany =
    options?.requireCompanyFields === true || values.paymentMethod === 'bank-transfer-legal'
  if (!needCompany) return true
  if (!isValidCompanyIco(values.companyEdrpou, options?.marketRegion)) return false
  if (!isValidLegalEntityName(values.companyLegalName)) return false
  if (options?.marketRegion === 'sk') {
    if (!values.companyStreet.trim() || !values.companyCity.trim() || !values.companyPostalCode.trim()) {
      return false
    }
  }
  return true
}

export function getCheckoutPaymentFieldError(
  field: CheckoutPaymentFieldKey,
  values: CheckoutFormValues,
  options?: { requireCompanyFields?: boolean; marketRegion?: 'ua' | 'sk' },
): string | null {
  const needCompany =
    options?.requireCompanyFields === true || values.paymentMethod === 'bank-transfer-legal'
  if (!needCompany) return null

  switch (field) {
    case 'companyEdrpou':
      if (!values.companyEdrpou.trim()) return 'Обовʼязкове поле'
      if (!isValidCompanyIco(values.companyEdrpou, options?.marketRegion)) {
        return options?.marketRegion === 'sk'
          ? 'IČO має містити 6–8 цифр'
          : `ЄДРПОУ має містити ${EDRPOU_LENGTH} цифр`
      }
      return null
    case 'companyLegalName':
      if (!values.companyLegalName.trim()) return 'Обовʼязкове поле'
      if (!isValidLegalEntityName(values.companyLegalName)) {
        return 'Вкажіть повну назву юридичної особи (мін. 3 символи)'
      }
      return null
    case 'companyDic':
      return null
    case 'companyStreet':
      if (options?.marketRegion === 'sk' && !values.companyStreet.trim()) return 'Обовʼязкове поле'
      return null
    case 'companyCity':
      if (options?.marketRegion === 'sk' && !values.companyCity.trim()) return 'Обовʼязкове поле'
      return null
    case 'companyPostalCode':
      if (options?.marketRegion === 'sk' && !values.companyPostalCode.trim()) return 'Обовʼязкове поле'
      return null
    default:
      return null
  }
}

export function getCheckoutContactFieldError(
  field: CheckoutContactFieldKey,
  values: CheckoutFormValues,
  options?: CheckoutValidationOptions,
): string | null {
  const region = options?.marketRegion ?? 'ua'

  switch (field) {
    case 'firstName':
      if (!values.firstName.trim()) return 'Обовʼязкове поле'
      if (region === 'sk') {
        if (containsCyrillicLetters(values.firstName)) {
          return 'Use Latin letters (diacritics allowed)'
        }
        if (!isValidLatinName(values.firstName)) {
          return 'At least 2 letters (Latin / diacritics)'
        }
        return null
      }
      if (containsLatinLetters(values.firstName)) {
        return 'Вкажіть імʼя українською мовою (кирилицею)'
      }
      if (!isValidCyrillicName(values.firstName)) {
        return 'Від 2 українських літер, апостроф дозволений'
      }
      return null
    case 'lastName':
      if (!values.lastName.trim()) return 'Обовʼязкове поле'
      if (region === 'sk') {
        if (containsCyrillicLetters(values.lastName)) {
          return 'Use Latin letters (diacritics allowed)'
        }
        if (!isValidLatinName(values.lastName)) {
          return 'At least 2 letters (Latin / diacritics)'
        }
        return null
      }
      if (containsLatinLetters(values.lastName)) {
        return 'Вкажіть прізвище українською мовою (кирилицею)'
      }
      if (!isValidCyrillicName(values.lastName)) {
        return 'Від 2 українських літер, апостроф дозволений'
      }
      return null
    case 'phone': {
      const authPolicy = resolveAuthPhonePolicy(options)
      const err = phoneErrorForPolicy(values.phone, authPolicy)
      if (!values.phone.trim()) return 'Обовʼязкове поле'
      return err && err !== 'Обовʼязкове поле' ? err : null
    }
    case 'patronymic':
      if (!isOptionalPersonNameValid(values.patronymic, 'ua')) {
        return 'Від 2 українських літер, апостроф дозволений'
      }
      return null
    case 'email': {
      const emailRequired = emailRequiredForPhone(
        values.phone,
        region,
        options?.checkoutEmailRequired,
      )
      if (emailRequired && !values.email.trim()) {
        return region === 'sk' ? 'Обовʼязкове поле' : 'Обовʼязкове поле для іноземного номера'
      }
      if (values.email.trim() && !isValidEmail(values.email)) {
        return 'Невірний формат email'
      }
      return null
    }
    default:
      return null
  }
}

export function getCheckoutRecipientFieldError(
  field: CheckoutRecipientFieldKey,
  values: CheckoutFormValues,
  options?: CheckoutValidationOptions,
): string | null {
  if (!values.isOtherRecipient) return null
  const region = options?.marketRegion ?? 'ua'

  switch (field) {
    case 'recipientFirstName':
      if (!values.recipientFirstName.trim()) return 'Обовʼязкове поле'
      if (!isPersonNameValid(values.recipientFirstName, region)) {
        return region === 'sk'
          ? 'At least 2 letters (Latin / diacritics)'
          : 'Від 2 українських літер, апостроф дозволений'
      }
      return null
    case 'recipientLastName':
      if (!values.recipientLastName.trim()) return 'Обовʼязкове поле'
      if (!isPersonNameValid(values.recipientLastName, region)) {
        return region === 'sk'
          ? 'At least 2 letters (Latin / diacritics)'
          : 'Від 2 українських літер, апостроф дозволений'
      }
      return null
    case 'recipientPatronymic':
      if (region === 'sk') return null
      if (recipientPatronymicRequired(values)) {
        if (!values.recipientPatronymic.trim()) return 'Обовʼязкове для адресної доставки'
        if (!isValidCyrillicName(values.recipientPatronymic)) {
          return 'Від 2 українських літер, апостроф дозволений'
        }
        return null
      }
      if (!isOptionalPersonNameValid(values.recipientPatronymic, 'ua')) {
        return 'Від 2 українських літер, апостроф дозволений'
      }
      return null
    case 'recipientPhone':
      return deliveryPhoneError(values.recipientPhone, resolveDeliveryPhonePolicy(options))
    case 'recipientCompanyName':
      return null
    default:
      return null
  }
}

export function getCheckoutShippingFieldError(
  field: CheckoutShippingFieldKey,
  values: CheckoutFormValues,
  identification?: CheckoutIdentificationState,
  options?: CheckoutValidationOptions,
): string | null {
  const region = options?.marketRegion ?? 'ua'

  if (field === 'deliveryCountryCode') {
    if (
      region === 'sk' &&
      values.deliveryMethod !== 'pickup' &&
      !values.deliveryCountryCode
    ) {
      return 'Обовʼязкове поле'
    }
    return null
  }

  if (field === 'deliveryPhone') {
    const deliveryPhonePolicy = resolveDeliveryPhonePolicy(options)
    if (!ordererDeliveryPhoneRequired(values, identification, region, deliveryPhonePolicy)) {
      return null
    }
    return deliveryPhoneError(values.deliveryPhone, deliveryPhonePolicy)
  }

  if (field === 'patronymic') {
    if (region === 'sk' || !shippingPatronymicRequired(values)) return null
    if (values.patronymic.trim() && isValidCyrillicName(values.patronymic)) return null
    if (!values.patronymic.trim()) return 'Обовʼязкове для адресної доставки'
    return 'Від 2 українських літер, апостроф дозволений'
  }

  if (field === 'postalCode') {
    if (!COURIER_METHODS.includes(values.deliveryMethod)) return null
    if (!values.postalCode.trim()) return 'Обовʼязкове поле'
    if (!isValidSkPostalCode(values.postalCode)) return 'Невірний формат PSČ'
    return null
  }

  if (DELIVERY_METHODS_WITHOUT_ADDRESS_FIELDS.includes(values.deliveryMethod)) return null

  switch (field) {
    case 'city':
      if (!values.city.trim()) return 'Обовʼязкове поле'
      if (!isNonEmpty(values.city)) return 'Мінімум 2 символи'
      return null
    case 'postOffice':
      if (values.deliveryMethod !== 'nova-poshta-branch' && values.deliveryMethod !== 'packeta-box') {
        return null
      }
      if (!values.postOffice.trim()) return 'Обовʼязкове поле'
      return null
    case 'street':
      if (
        values.deliveryMethod !== 'nova-poshta-address' &&
        !COURIER_METHODS.includes(values.deliveryMethod)
      ) {
        return null
      }
      if (!values.street.trim()) return 'Обовʼязкове поле'
      return null
    case 'houseNumber':
      if (
        values.deliveryMethod !== 'nova-poshta-address' &&
        !COURIER_METHODS.includes(values.deliveryMethod)
      ) {
        return null
      }
      if (!hasValue(values.houseNumber)) return 'Обовʼязкове поле'
      return null
    default:
      return null
  }
}
