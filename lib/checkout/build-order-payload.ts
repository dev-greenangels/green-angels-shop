import { getCheckoutRecipientPhoneRaw } from '@/components/checkout/checkout-utils'
import type { CheckoutShipmentSlice } from '@/lib/checkout/shipment-slice'
import { applyShipmentSliceToForm } from '@/lib/checkout/shipment-slice'
import { buildPricingQuoteLineItems } from '@/lib/pricing/quote-line-items'
import { defaultDeliveryPhonePolicy, type PhonePolicy } from '@/lib/settings/market'
import type { CartItem } from '@/lib/types'
import {
  type CheckoutFormValues,
  type CheckoutMarketRegion,
  isUaDeliveryPhoneLockActive,
} from '@/lib/validation/checkout-form'
import { isValidEmail, isValidUkrPhone } from '@/lib/validation/register-form'

export type CreateOrderPayload = {
  items: Array<{ productVariantId: string; quantity: number }>
  customerFirstName: string
  customerLastName: string
  customerPatronymic?: string
  customerPhone: string
  customerEmail?: string
  receiverFirstName: string
  receiverLastName: string
  receiverPatronymic?: string
  receiverPhone: string
  deliveryMethod: string
  deliveryCity?: string
  deliveryBranch?: string
  deliveryBranchLabel?: string
  deliveryStreet?: string
  deliveryHouseNumber?: string
  deliveryPostalCode?: string
  deliveryCountryCode?: string
  receiverCompanyName?: string
  paymentMethod: string
  comment?: string
  companyLegalName?: string
  companyIco?: string
  companyDic?: string
  companyVatId?: string
  companyStreet?: string
  companyCity?: string
  companyPostalCode?: string
  preferredShipDate?: string
  countryCode?: 'sk' | 'hu' | 'at'
  buyerType?: 'individual' | 'company'
  vatCountryCode?: string
  returnBaseUrl?: string
  promoCode?: string
  promoCodes?: string[]
  splitCheckout?: {
    partIndex: number
    partCount: number
  }
  createAccount?: boolean
  privacyConsent?: boolean
  privacyConsentVersion?: string
  marketingConsent?: boolean
  marketingRevisionId?: string
}

function normalizePhoneForApi(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('380') && digits.length >= 12) return `+${digits.slice(0, 12)}`
  if (digits.startsWith('0') && digits.length === 10) return `+38${digits}`
  if (digits.length === 9) return `+380${digits}`
  return phone.trim()
}

function getReceiverNames(form: CheckoutFormValues) {
  if (form.isOtherRecipient) {
    return {
      firstName: form.recipientFirstName.trim(),
      lastName: form.recipientLastName.trim(),
      patronymic: form.recipientPatronymic.trim() || undefined,
    }
  }

  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    patronymic: form.patronymic.trim() || undefined,
  }
}

export function buildOrderPayload(
  form: CheckoutFormValues,
  items: CartItem[],
  options?: {
    shipmentNote?: string
    splitCheckout?: CreateOrderPayload['splitCheckout']
    shipmentSlice?: CheckoutShipmentSlice
    createAccount?: boolean
    privacyConsent?: boolean
    privacyConsentVersion?: string
    marketingConsent?: boolean
    marketingRevisionId?: string
    companyVatId?: string
    countryCode?: 'sk' | 'hu' | 'at'
    buyerType?: 'individual' | 'company'
    vatCountryCode?: string
    returnBaseUrl?: string
    marketRegion?: CheckoutMarketRegion
    deliveryPhonePolicy?: PhonePolicy
    /** Override form.preferredShipDate (e.g. immediate half of a split checkout). */
    preferredShipDate?: string
  },
): CreateOrderPayload {
  const deliveryForm = options?.shipmentSlice
    ? applyShipmentSliceToForm(form, options.shipmentSlice)
    : form
  const receiver = getReceiverNames(deliveryForm)
  const uaDeliveryLock = isUaDeliveryPhoneLockActive(
    options?.marketRegion ?? 'ua',
    options?.deliveryPhonePolicy ?? defaultDeliveryPhonePolicy(options?.marketRegion ?? 'ua'),
  )
  const customerPhoneRaw =
    isValidUkrPhone(form.phone.trim()) || !uaDeliveryLock
      ? form.phone.trim()
      : !deliveryForm.isOtherRecipient && deliveryForm.deliveryPhone.trim()
        ? deliveryForm.deliveryPhone.trim()
        : form.phone.trim()
  const customerPhone = normalizePhoneForApi(customerPhoneRaw)
  const recipientPhoneRaw = getCheckoutRecipientPhoneRaw(
    deliveryForm,
    options?.marketRegion,
    options?.deliveryPhonePolicy,
  )

  const payload: CreateOrderPayload = {
    items: buildPricingQuoteLineItems(items),
    customerFirstName: form.firstName.trim(),
    customerLastName: form.lastName.trim(),
    customerPhone,
    receiverFirstName: receiver.firstName,
    receiverLastName: receiver.lastName,
    receiverPhone: normalizePhoneForApi(recipientPhoneRaw),
    deliveryMethod: deliveryForm.deliveryMethod,
    paymentMethod: form.paymentMethod,
  }

  const customerPatronymic = form.patronymic.trim()
  if (customerPatronymic) payload.customerPatronymic = customerPatronymic

  if (receiver.patronymic) payload.receiverPatronymic = receiver.patronymic

  const email = form.email.trim()
  if (email && isValidEmail(email)) payload.customerEmail = email

  if (deliveryForm.deliveryMethod !== 'pickup') {
    payload.deliveryCity = deliveryForm.cityLabel.trim() || deliveryForm.city.trim()
  }

  if (deliveryForm.deliveryMethod === 'nova-poshta-branch') {
    payload.deliveryBranch =
      deliveryForm.postOffice.trim() || deliveryForm.postOfficeLabel.trim()
    if (deliveryForm.postOfficeLabel.trim()) {
      payload.deliveryBranchLabel = deliveryForm.postOfficeLabel.trim()
    }
  }

  if (deliveryForm.deliveryMethod === 'packeta-box') {
    // Packeta point id must be preserved for ERP / label printing
    payload.deliveryBranch = deliveryForm.postOffice.trim()
    if (deliveryForm.postOfficeLabel.trim()) {
      payload.deliveryBranchLabel = deliveryForm.postOfficeLabel.trim()
    }
    payload.deliveryCity = deliveryForm.cityLabel.trim() || deliveryForm.city.trim()
    const psc = deliveryForm.postalCode.trim()
    if (psc) payload.deliveryPostalCode = psc
  }

  if (
    deliveryForm.deliveryMethod === 'nova-poshta-address' ||
    deliveryForm.deliveryMethod === 'packeta-courier' ||
    deliveryForm.deliveryMethod === 'gls-courier'
  ) {
    payload.deliveryStreet = deliveryForm.streetLabel.trim() || deliveryForm.street.trim()
    payload.deliveryHouseNumber = deliveryForm.houseNumber.trim()
  }

  if (
    deliveryForm.deliveryMethod === 'packeta-courier' ||
    deliveryForm.deliveryMethod === 'gls-courier'
  ) {
    const psc = deliveryForm.postalCode.trim()
    if (psc) payload.deliveryPostalCode = psc
  }

  if (deliveryForm.deliveryCountryCode?.trim()) {
    payload.deliveryCountryCode = deliveryForm.deliveryCountryCode.trim().toLowerCase()
  }

  if (deliveryForm.isOtherRecipient) {
    const receiverCompany = deliveryForm.recipientCompanyName.trim()
    if (receiverCompany) payload.receiverCompanyName = receiverCompany
  }

  const comment = form.comment.trim()
  const shipmentNote = options?.shipmentNote?.trim()
  const mergedComment = [comment, shipmentNote].filter(Boolean).join('\n')
  if (mergedComment) payload.comment = mergedComment

  if (
    form.paymentMethod === 'bank-transfer-legal' ||
    options?.buyerType === 'company'
  ) {
    const legalName = form.companyLegalName.trim()
    const ico = form.companyEdrpou.trim()
    if (legalName) payload.companyLegalName = legalName
    if (ico) payload.companyIco = ico
    const dic = form.companyDic.trim()
    if (dic) payload.companyDic = dic
    const street = form.companyStreet.trim()
    if (street) payload.companyStreet = street
    const city = form.companyCity.trim()
    if (city) payload.companyCity = city
    const psc = form.companyPostalCode.trim()
    if (psc) payload.companyPostalCode = psc
  }

  const shipDate = (options?.preferredShipDate ?? form.preferredShipDate).trim()
  if (shipDate) payload.preferredShipDate = shipDate

  const vatId = options?.companyVatId?.trim()
  if (vatId) payload.companyVatId = vatId

  if (options?.countryCode) payload.countryCode = options.countryCode
  if (options?.buyerType) payload.buyerType = options.buyerType
  if (options?.vatCountryCode) payload.vatCountryCode = options.vatCountryCode
  if (options?.returnBaseUrl) payload.returnBaseUrl = options.returnBaseUrl

  const promoCodes = (form.promoCodes ?? [])
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
  const legacyPromo = form.promoCode?.trim()
  const allPromoCodes = [...new Set([...promoCodes, ...(legacyPromo ? [legacyPromo.toUpperCase()] : [])])]
  if (allPromoCodes.length) payload.promoCodes = allPromoCodes

  if (options?.splitCheckout) {
    payload.splitCheckout = options.splitCheckout
  }

  if (options?.createAccount) payload.createAccount = true
  if (options?.privacyConsent) payload.privacyConsent = true
  if (options?.privacyConsentVersion) payload.privacyConsentVersion = options.privacyConsentVersion
  if (options?.marketingConsent) payload.marketingConsent = true
  if (options?.marketingRevisionId) payload.marketingRevisionId = options.marketingRevisionId

  return payload
}
