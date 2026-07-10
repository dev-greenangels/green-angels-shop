import type { CheckoutFormValues } from '@/lib/validation/checkout-form'

export type CheckoutShipmentSlice = Pick<
  CheckoutFormValues,
  | 'deliveryMethod'
  | 'city'
  | 'cityLabel'
  | 'postOffice'
  | 'postOfficeLabel'
  | 'street'
  | 'streetLabel'
  | 'houseNumber'
  | 'deliveryPhone'
  | 'patronymic'
  | 'isOtherRecipient'
  | 'recipientFirstName'
  | 'recipientLastName'
  | 'recipientPatronymic'
  | 'recipientPhone'
>

export type CheckoutSplitShipments = {
  immediate: CheckoutShipmentSlice
  dated: CheckoutShipmentSlice
}

export function createEmptyShipmentSlice(
  defaults?: Partial<CheckoutShipmentSlice>,
): CheckoutShipmentSlice {
  return {
    deliveryMethod: defaults?.deliveryMethod ?? 'nova-poshta-branch',
    city: defaults?.city ?? '',
    cityLabel: defaults?.cityLabel ?? '',
    postOffice: defaults?.postOffice ?? '',
    postOfficeLabel: defaults?.postOfficeLabel ?? '',
    street: defaults?.street ?? '',
    streetLabel: defaults?.streetLabel ?? '',
    houseNumber: defaults?.houseNumber ?? '',
    deliveryPhone: defaults?.deliveryPhone ?? '',
    patronymic: defaults?.patronymic ?? '',
    isOtherRecipient: defaults?.isOtherRecipient ?? false,
    recipientFirstName: defaults?.recipientFirstName ?? '',
    recipientLastName: defaults?.recipientLastName ?? '',
    recipientPatronymic: defaults?.recipientPatronymic ?? '',
    recipientPhone: defaults?.recipientPhone ?? '',
  }
}

export function extractShipmentSlice(form: CheckoutFormValues): CheckoutShipmentSlice {
  return createEmptyShipmentSlice({
    deliveryMethod: form.deliveryMethod,
    city: form.city,
    cityLabel: form.cityLabel,
    postOffice: form.postOffice,
    postOfficeLabel: form.postOfficeLabel,
    street: form.street,
    streetLabel: form.streetLabel,
    houseNumber: form.houseNumber,
    deliveryPhone: form.deliveryPhone,
    patronymic: form.patronymic,
    isOtherRecipient: form.isOtherRecipient,
    recipientFirstName: form.recipientFirstName,
    recipientLastName: form.recipientLastName,
    recipientPatronymic: form.recipientPatronymic,
    recipientPhone: form.recipientPhone,
  })
}

export function cloneShipmentSlice(slice: CheckoutShipmentSlice): CheckoutShipmentSlice {
  return { ...slice }
}

export function applyShipmentSliceToForm(
  form: CheckoutFormValues,
  slice: CheckoutShipmentSlice,
): CheckoutFormValues {
  return { ...form, ...slice }
}

export function patchShipmentSlice(
  slice: CheckoutShipmentSlice,
  patch: Partial<CheckoutShipmentSlice>,
): CheckoutShipmentSlice {
  return { ...slice, ...patch }
}
