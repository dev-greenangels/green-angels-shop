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
  defaultAuthPhonePolicy,
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
  | 'pay-on-pickup'

/** Методи без адресних НП-полів (самовивіз / Packeta box). */
const DELIVERY_METHODS_WITHOUT_ADDRESS_FIELDS: CheckoutDeliveryMethod[] = [
  'pickup',
  'packeta-box',
]

const COURIER_METHODS: CheckoutDeliveryMethod[] = ['packeta-courier', 'gls-courier']
export { COURIER_METHODS }

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
  /** packeta-box: feed kind for quote identity (server re-validates). */
  packetaPickupKind: '' | 'branch' | 'box' | 'carrier'
  /** packeta-box: partner carrier id when kind=carrier (server re-validates). */
  packetaCarrierId: number | null
  street: string
  streetLabel: string
  houseNumber: string
  /** Courier postal code (PSČ) */
  postalCode: string
  /** SK/EU: when true (courier), billing snapshot copies shipping at submit */
  billingSameAsShipping: boolean
  billingStreet: string
  billingHouseNumber: string
  billingCity: string
  billingPostalCode: string
  billingCountryCode: string
  paymentMethod: CheckoutPaymentMethod
  companyEdrpou: string
  companyLegalName: string
  companyDic: string
  companyStreet: string
  companyCity: string
  companyPostalCode: string
  preferredShipDate: string
  /** When shipment is split — dispatch date for the immediate (no availableFrom) order. */
  preferredShipDateImmediate: string
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

export type CheckoutBillingFieldKey =
  | 'billingStreet'
  | 'billingHouseNumber'
  | 'billingCity'
  | 'billingPostalCode'
  | 'billingCountryCode'

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
  /** Dispatch calendar enabled — preferredShipDate required on shipping step */
  requirePreferredShipDate?: boolean
}

function resolveDeliveryPhonePolicy(options?: CheckoutValidationOptions): PhonePolicy {
  if (options?.deliveryPhonePolicy) return options.deliveryPhonePolicy
  return defaultDeliveryPhonePolicy(options?.marketRegion ?? 'ua')
}

function resolveAuthPhonePolicy(options?: CheckoutValidationOptions): PhonePolicy {
  if (options?.authPhonePolicy) return options.authPhonePolicy
  return defaultAuthPhonePolicy(options?.marketRegion ?? 'ua')
}

function deliveryPhoneError(
  phone: string,
  policy: PhonePolicy,
  region?: CheckoutMarketRegion,
): string | null {
  if (policy === 'ua_e164') return getRecipientUkrPhoneError(phone)
  const err = phoneErrorForPolicy(phone, policy, region)
  if (!phone.trim()) return 'required'
  return err
}

function isValidDeliveryPhone(
  phone: string,
  policy: PhonePolicy,
  region?: CheckoutMarketRegion,
): boolean {
  if (policy === 'ua_e164') return isValidRecipientUkrPhone(phone)
  return isValidPhoneForPolicy(phone, policy, region)
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

  if (!isValidDeliveryPhone(values.recipientPhone, deliveryPhonePolicy, region)) return false

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
  return !isValidDeliveryPhone(values.phone, deliveryPhonePolicy, region)
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

  if (options?.requirePreferredShipDate) {
    if (options.shipmentSplit) {
      if (!values.preferredShipDate.trim() || !values.preferredShipDateImmediate.trim()) {
        return false
      }
    } else if (!values.preferredShipDate.trim()) {
      return false
    }
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
    !isValidDeliveryPhone(merged.deliveryPhone, deliveryPhonePolicy, region)
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

/** SK/EU market-level: billing address always required (independent of deliveryMethod). */
export function isBillingAddressValid(
  values: CheckoutFormValues,
  options?: { marketRegion?: CheckoutMarketRegion; buyerType?: 'individual' | 'company' },
): boolean {
  if (options?.marketRegion !== 'sk') return true

  if (options.buyerType === 'company') {
    return Boolean(
      values.companyStreet.trim() &&
        values.companyCity.trim() &&
        values.companyPostalCode.trim(),
    )
  }

  return Boolean(
    values.billingStreet.trim() &&
      values.billingHouseNumber.trim() &&
      values.billingCity.trim() &&
      values.billingPostalCode.trim() &&
      (values.billingCountryCode.trim() || values.deliveryCountryCode.trim()),
  )
}

export function getCheckoutBillingFieldError(
  field: CheckoutBillingFieldKey,
  values: CheckoutFormValues,
  options?: { marketRegion?: CheckoutMarketRegion; buyerType?: 'individual' | 'company' },
): string | null {
  if (options?.marketRegion !== 'sk') return null
  if (options.buyerType === 'company') return null

  switch (field) {
    case 'billingStreet':
      return values.billingStreet.trim() ? null : 'required'
    case 'billingHouseNumber':
      return values.billingHouseNumber.trim() ? null : 'required'
    case 'billingCity':
      return values.billingCity.trim() ? null : 'required'
    case 'billingPostalCode':
      if (!values.billingPostalCode.trim()) return 'required'
      if (!isValidSkPostalCode(values.billingPostalCode)) return 'invalidSkPostal'
      return null
    case 'billingCountryCode':
      return values.billingCountryCode.trim() || values.deliveryCountryCode.trim()
        ? null
        : 'required'
    default:
      return null
  }
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
      if (!values.companyEdrpou.trim()) return 'required'
      if (!isValidCompanyIco(values.companyEdrpou, options?.marketRegion)) {
        return options?.marketRegion === 'sk'
          ? 'invalidIco'
          : 'invalidEdrpou'
      }
      return null
    case 'companyLegalName':
      if (!values.companyLegalName.trim()) return 'required'
      if (!isValidLegalEntityName(values.companyLegalName)) {
        return 'companyLegalNameMin'
      }
      return null
    case 'companyDic':
      return null
    case 'companyStreet':
      if (options?.marketRegion === 'sk' && !values.companyStreet.trim()) return 'required'
      return null
    case 'companyCity':
      if (options?.marketRegion === 'sk' && !values.companyCity.trim()) return 'required'
      return null
    case 'companyPostalCode':
      if (options?.marketRegion === 'sk' && !values.companyPostalCode.trim()) return 'required'
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
      if (!values.firstName.trim()) return 'required'
      if (region === 'sk') {
        if (containsCyrillicLetters(values.firstName)) {
          return 'latinCharactersRequired'
        }
        if (!isValidLatinName(values.firstName)) {
          return 'minLatinLetters'
        }
        return null
      }
      if (containsLatinLetters(values.firstName)) {
        return 'cyrillicFirstName'
      }
      if (!isValidCyrillicName(values.firstName)) {
        return 'cyrillicNameMin'
      }
      return null
    case 'lastName':
      if (!values.lastName.trim()) return 'required'
      if (region === 'sk') {
        if (containsCyrillicLetters(values.lastName)) {
          return 'latinCharactersRequired'
        }
        if (!isValidLatinName(values.lastName)) {
          return 'minLatinLetters'
        }
        return null
      }
      if (containsLatinLetters(values.lastName)) {
        return 'cyrillicLastName'
      }
      if (!isValidCyrillicName(values.lastName)) {
        return 'cyrillicNameMin'
      }
      return null
    case 'phone': {
      const authPolicy = resolveAuthPhonePolicy(options)
      const err = phoneErrorForPolicy(values.phone, authPolicy, region)
      if (!values.phone.trim()) return 'required'
      return err && err !== 'required' ? err : null
    }
    case 'patronymic':
      if (!isOptionalPersonNameValid(values.patronymic, 'ua')) {
        return 'cyrillicNameMin'
      }
      return null
    case 'email': {
      const emailRequired = emailRequiredForPhone(
        values.phone,
        region,
        options?.checkoutEmailRequired,
      )
      if (emailRequired && !values.email.trim()) {
        return region === 'sk' ? 'required' : 'requiredForeignPhone'
      }
      if (values.email.trim() && !isValidEmail(values.email)) {
        return 'invalidEmail'
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
      if (!values.recipientFirstName.trim()) return 'required'
      if (!isPersonNameValid(values.recipientFirstName, region)) {
        return region === 'sk'
          ? 'minLatinLetters'
          : 'cyrillicNameMin'
      }
      return null
    case 'recipientLastName':
      if (!values.recipientLastName.trim()) return 'required'
      if (!isPersonNameValid(values.recipientLastName, region)) {
        return region === 'sk'
          ? 'minLatinLetters'
          : 'cyrillicNameMin'
      }
      return null
    case 'recipientPatronymic':
      if (region === 'sk') return null
      if (recipientPatronymicRequired(values)) {
        if (!values.recipientPatronymic.trim()) return 'requiredAddressDelivery'
        if (!isValidCyrillicName(values.recipientPatronymic)) {
          return 'cyrillicNameMin'
        }
        return null
      }
      if (!isOptionalPersonNameValid(values.recipientPatronymic, 'ua')) {
        return 'cyrillicNameMin'
      }
      return null
    case 'recipientPhone':
      return deliveryPhoneError(
        values.recipientPhone,
        resolveDeliveryPhonePolicy(options),
        region,
      )
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
      return 'required'
    }
    return null
  }

  if (field === 'deliveryPhone') {
    const deliveryPhonePolicy = resolveDeliveryPhonePolicy(options)
    if (!ordererDeliveryPhoneRequired(values, identification, region, deliveryPhonePolicy)) {
      return null
    }
    return deliveryPhoneError(values.deliveryPhone, deliveryPhonePolicy, region)
  }

  if (field === 'patronymic') {
    if (region === 'sk' || !shippingPatronymicRequired(values)) return null
    if (values.patronymic.trim() && isValidCyrillicName(values.patronymic)) return null
    if (!values.patronymic.trim()) return 'requiredAddressDelivery'
    return 'cyrillicNameMin'
  }

  if (field === 'postalCode') {
    if (!COURIER_METHODS.includes(values.deliveryMethod)) return null
    if (!values.postalCode.trim()) return 'required'
    if (!isValidSkPostalCode(values.postalCode)) return 'invalidSkPostal'
    return null
  }

  if (DELIVERY_METHODS_WITHOUT_ADDRESS_FIELDS.includes(values.deliveryMethod)) return null

  switch (field) {
    case 'city':
      if (!values.city.trim()) return 'required'
      if (!isNonEmpty(values.city)) return 'minTwoChars'
      return null
    case 'postOffice':
      if (values.deliveryMethod !== 'nova-poshta-branch' && values.deliveryMethod !== 'packeta-box') {
        return null
      }
      if (!values.postOffice.trim()) return 'required'
      return null
    case 'street':
      if (
        values.deliveryMethod !== 'nova-poshta-address' &&
        !COURIER_METHODS.includes(values.deliveryMethod)
      ) {
        return null
      }
      if (!values.street.trim()) return 'required'
      return null
    case 'houseNumber':
      if (
        values.deliveryMethod !== 'nova-poshta-address' &&
        !COURIER_METHODS.includes(values.deliveryMethod)
      ) {
        return null
      }
      if (!hasValue(values.houseNumber)) return 'required'
      return null
    default:
      return null
  }
}
