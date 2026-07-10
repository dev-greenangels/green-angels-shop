import { getCheckoutRecipientPhoneRaw } from '@/components/checkout/checkout-utils'
import type { CheckoutShipmentSlice } from '@/lib/checkout/shipment-slice'
import { applyShipmentSliceToForm } from '@/lib/checkout/shipment-slice'
import { buildPricingQuoteLineItems } from '@/lib/pricing/quote-line-items'
import type { CartItem } from '@/lib/types'
import type { CheckoutFormValues } from '@/lib/validation/checkout-form'
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
  deliveryStreet?: string
  deliveryHouseNumber?: string
  paymentMethod: string
  comment?: string
  promoCode?: string
  promoCodes?: string[]
  splitCheckout?: {
    partIndex: number
    partCount: number
  }
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
  },
): CreateOrderPayload {
  const deliveryForm = options?.shipmentSlice
    ? applyShipmentSliceToForm(form, options.shipmentSlice)
    : form
  const receiver = getReceiverNames(deliveryForm)
  const customerPhoneRaw = isValidUkrPhone(form.phone.trim())
    ? form.phone.trim()
    : !deliveryForm.isOtherRecipient && deliveryForm.deliveryPhone.trim()
      ? deliveryForm.deliveryPhone.trim()
      : form.phone.trim()
  const customerPhone = normalizePhoneForApi(customerPhoneRaw)
  const recipientPhoneRaw = getCheckoutRecipientPhoneRaw(deliveryForm)

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
      deliveryForm.postOfficeLabel.trim() || deliveryForm.postOffice.trim()
  }

  if (deliveryForm.deliveryMethod === 'nova-poshta-address') {
    payload.deliveryStreet = deliveryForm.streetLabel.trim() || deliveryForm.street.trim()
    payload.deliveryHouseNumber = deliveryForm.houseNumber.trim()
  }

  const comment = form.comment.trim()
  const shipmentNote = options?.shipmentNote?.trim()
  const mergedComment = [comment, shipmentNote].filter(Boolean).join('\n')
  if (mergedComment) payload.comment = mergedComment

  if (form.paymentMethod === 'bank-transfer-legal') {
    const legalLines = [
      `ЄДРПОУ: ${form.companyEdrpou.trim()}`,
      `Юридична особа: ${form.companyLegalName.trim()}`,
    ]
    payload.comment = [payload.comment, ...legalLines].filter(Boolean).join('\n')
  }

  const promoCodes = (form.promoCodes ?? [])
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
  const legacyPromo = form.promoCode?.trim()
  const allPromoCodes = [...new Set([...promoCodes, ...(legacyPromo ? [legacyPromo.toUpperCase()] : [])])]
  if (allPromoCodes.length) payload.promoCodes = allPromoCodes

  if (options?.splitCheckout) {
    payload.splitCheckout = options.splitCheckout
  }

  return payload
}
