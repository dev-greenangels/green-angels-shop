import type { CheckoutDraftV1 } from '@/lib/carts/types'
import type { CheckoutFormValues } from '@/lib/validation/checkout-form'

export const CHECKOUT_DRAFT_DEBOUNCE_MS = 800

export type CheckoutDraftPersistInput = {
  form: CheckoutFormValues
  locale?: string
  countryCode?: 'sk' | 'hu' | 'at'
  buyerType?: 'individual' | 'company'
  vatCountryCode?: string
  companyVatId?: string
  shipmentSplitMode?: 'together' | 'split'
  promoCodes?: string[]
}

function trimOrUndef(value: string | undefined | null): string | undefined {
  const trimmed = (value ?? '').trim()
  return trimmed ? trimmed : undefined
}

/** Build validated-shaped draft payload from live checkout React state. */
export function buildCheckoutDraftPayload(input: CheckoutDraftPersistInput): CheckoutDraftV1 {
  const { form } = input
  const draft: CheckoutDraftV1 = { v: 1 }

  const locale = trimOrUndef(input.locale)
  if (locale) draft.locale = locale
  if (input.countryCode) draft.countryCode = input.countryCode
  if (input.buyerType) draft.buyerType = input.buyerType
  const vatCountry = trimOrUndef(input.vatCountryCode)
  if (vatCountry) draft.vatCountryCode = vatCountry
  const vatId = trimOrUndef(input.companyVatId)
  if (vatId) draft.companyVatId = vatId

  const assign = (key: keyof CheckoutDraftV1, value: string | undefined) => {
    if (value) (draft as Record<string, unknown>)[key] = value
  }

  assign('firstName', trimOrUndef(form.firstName))
  assign('lastName', trimOrUndef(form.lastName))
  assign('patronymic', trimOrUndef(form.patronymic))
  assign('email', trimOrUndef(form.email))
  assign('phone', trimOrUndef(form.phone))
  assign('deliveryPhone', trimOrUndef(form.deliveryPhone))
  draft.isOtherRecipient = form.isOtherRecipient
  assign('recipientFirstName', trimOrUndef(form.recipientFirstName))
  assign('recipientLastName', trimOrUndef(form.recipientLastName))
  assign('recipientPatronymic', trimOrUndef(form.recipientPatronymic))
  assign('recipientPhone', trimOrUndef(form.recipientPhone))
  assign('recipientCompanyName', trimOrUndef(form.recipientCompanyName))
  assign('deliveryMethod', trimOrUndef(form.deliveryMethod))
  assign('deliveryCountryCode', trimOrUndef(form.deliveryCountryCode))
  assign('city', trimOrUndef(form.city))
  assign('cityLabel', trimOrUndef(form.cityLabel))
  assign('postOffice', trimOrUndef(form.postOffice))
  assign('postOfficeLabel', trimOrUndef(form.postOfficeLabel))
  if (form.packetaPickupKind) draft.packetaPickupKind = form.packetaPickupKind
  draft.packetaCarrierId = form.packetaCarrierId
  assign('street', trimOrUndef(form.street))
  assign('streetLabel', trimOrUndef(form.streetLabel))
  assign('houseNumber', trimOrUndef(form.houseNumber))
  assign('postalCode', trimOrUndef(form.postalCode))
  assign('billingFirstName', trimOrUndef(form.billingFirstName))
  assign('billingLastName', trimOrUndef(form.billingLastName))
  draft.deliveryAddressSameAsBilling = form.deliveryAddressSameAsBilling
  assign('billingStreet', trimOrUndef(form.billingStreet))
  assign('billingHouseNumber', trimOrUndef(form.billingHouseNumber))
  assign('billingCity', trimOrUndef(form.billingCity))
  assign('billingPostalCode', trimOrUndef(form.billingPostalCode))
  assign('billingCountryCode', trimOrUndef(form.billingCountryCode))
  assign('paymentMethod', trimOrUndef(form.paymentMethod))
  assign('companyEdrpou', trimOrUndef(form.companyEdrpou))
  assign('companyLegalName', trimOrUndef(form.companyLegalName))
  assign('companyDic', trimOrUndef(form.companyDic))
  assign('companyStreet', trimOrUndef(form.companyStreet))
  assign('companyCity', trimOrUndef(form.companyCity))
  assign('companyPostalCode', trimOrUndef(form.companyPostalCode))
  assign('preferredShipDate', trimOrUndef(form.preferredShipDate))
  assign('preferredShipDateImmediate', trimOrUndef(form.preferredShipDateImmediate))
  if (input.shipmentSplitMode) draft.shipmentSplitMode = input.shipmentSplitMode
  assign('comment', trimOrUndef(form.comment))

  const codes = (input.promoCodes ?? form.promoCodes ?? [])
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
  if (codes.length) draft.promoCodes = [...new Set(codes)]

  return draft
}

/**
 * Apply draft onto checkout form. Does not force invalid delivery/payment methods —
 * caller should intersect with currently allowed methods.
 */
export function checkoutFormPatchFromDraft(
  draft: CheckoutDraftV1,
  allowed: {
    deliveryMethods?: string[]
    paymentMethods?: string[]
  } = {},
): Partial<CheckoutFormValues> {
  const patch: Partial<CheckoutFormValues> = {}

  const setIf = <K extends keyof CheckoutFormValues>(
    key: K,
    value: CheckoutFormValues[K] | undefined,
  ) => {
    if (value === undefined || value === null) return
    if (typeof value === 'string' && !value.trim()) return
    patch[key] = value
  }

  setIf('firstName', draft.firstName)
  setIf('lastName', draft.lastName)
  setIf('patronymic', draft.patronymic)
  setIf('email', draft.email)
  setIf('phone', draft.phone)
  setIf('deliveryPhone', draft.deliveryPhone)
  if (typeof draft.isOtherRecipient === 'boolean') {
    patch.isOtherRecipient = draft.isOtherRecipient
  }
  setIf('recipientFirstName', draft.recipientFirstName)
  setIf('recipientLastName', draft.recipientLastName)
  setIf('recipientPatronymic', draft.recipientPatronymic)
  setIf('recipientPhone', draft.recipientPhone)
  setIf('recipientCompanyName', draft.recipientCompanyName)

  if (
    draft.deliveryMethod &&
    (!allowed.deliveryMethods?.length ||
      allowed.deliveryMethods.includes(draft.deliveryMethod))
  ) {
    patch.deliveryMethod = draft.deliveryMethod as CheckoutFormValues['deliveryMethod']
  }

  setIf('deliveryCountryCode', draft.deliveryCountryCode)
  setIf('city', draft.city)
  setIf('cityLabel', draft.cityLabel)
  setIf('postOffice', draft.postOffice)
  setIf('postOfficeLabel', draft.postOfficeLabel)
  if (draft.packetaPickupKind !== undefined) {
    patch.packetaPickupKind = draft.packetaPickupKind
  }
  if (draft.packetaCarrierId !== undefined) {
    patch.packetaCarrierId = draft.packetaCarrierId
  }
  setIf('street', draft.street)
  setIf('streetLabel', draft.streetLabel)
  setIf('houseNumber', draft.houseNumber)
  setIf('postalCode', draft.postalCode)
  setIf('billingFirstName', draft.billingFirstName)
  setIf('billingLastName', draft.billingLastName)
  if (typeof draft.deliveryAddressSameAsBilling === 'boolean') {
    patch.deliveryAddressSameAsBilling = draft.deliveryAddressSameAsBilling
  }
  setIf('billingStreet', draft.billingStreet)
  setIf('billingHouseNumber', draft.billingHouseNumber)
  setIf('billingCity', draft.billingCity)
  setIf('billingPostalCode', draft.billingPostalCode)
  setIf('billingCountryCode', draft.billingCountryCode)

  if (
    draft.paymentMethod &&
    (!allowed.paymentMethods?.length ||
      allowed.paymentMethods.includes(draft.paymentMethod))
  ) {
    patch.paymentMethod = draft.paymentMethod as CheckoutFormValues['paymentMethod']
  }

  setIf('companyEdrpou', draft.companyEdrpou)
  setIf('companyLegalName', draft.companyLegalName)
  setIf('companyDic', draft.companyDic)
  setIf('companyStreet', draft.companyStreet)
  setIf('companyCity', draft.companyCity)
  setIf('companyPostalCode', draft.companyPostalCode)
  setIf('preferredShipDate', draft.preferredShipDate)
  setIf('preferredShipDateImmediate', draft.preferredShipDateImmediate)
  setIf('comment', draft.comment)
  if (draft.promoCodes?.length) patch.promoCodes = draft.promoCodes

  return patch
}
