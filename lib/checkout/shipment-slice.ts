import type { CheckoutFormValues } from '@/lib/validation/checkout-form'

export type CheckoutShipmentSlice = Pick<
  CheckoutFormValues,
  | 'deliveryMethod'
  | 'deliveryCountryCode'
  | 'city'
  | 'cityLabel'
  | 'postOffice'
  | 'postOfficeLabel'
  | 'street'
  | 'streetLabel'
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
    deliveryCountryCode: defaults?.deliveryCountryCode ?? '',
    city: defaults?.city ?? '',
    cityLabel: defaults?.cityLabel ?? '',
    postOffice: defaults?.postOffice ?? '',
    postOfficeLabel: defaults?.postOfficeLabel ?? '',
    street: defaults?.street ?? '',
    streetLabel: defaults?.streetLabel ?? '',
    houseNumber: defaults?.houseNumber ?? '',
    postalCode: defaults?.postalCode ?? '',
    deliveryPhone: defaults?.deliveryPhone ?? '',
    patronymic: defaults?.patronymic ?? '',
    isOtherRecipient: defaults?.isOtherRecipient ?? false,
    recipientFirstName: defaults?.recipientFirstName ?? '',
    recipientLastName: defaults?.recipientLastName ?? '',
    recipientPatronymic: defaults?.recipientPatronymic ?? '',
    recipientPhone: defaults?.recipientPhone ?? '',
    recipientCompanyName: defaults?.recipientCompanyName ?? '',
  }
}

export function extractShipmentSlice(form: CheckoutFormValues): CheckoutShipmentSlice {
  return createEmptyShipmentSlice({
    deliveryMethod: form.deliveryMethod,
    deliveryCountryCode: form.deliveryCountryCode,
    city: form.city,
    cityLabel: form.cityLabel,
    postOffice: form.postOffice,
    postOfficeLabel: form.postOfficeLabel,
    street: form.street,
    streetLabel: form.streetLabel,
    houseNumber: form.houseNumber,
    postalCode: form.postalCode,
    deliveryPhone: form.deliveryPhone,
    patronymic: form.patronymic,
    isOtherRecipient: form.isOtherRecipient,
    recipientFirstName: form.recipientFirstName,
    recipientLastName: form.recipientLastName,
    recipientPatronymic: form.recipientPatronymic,
    recipientPhone: form.recipientPhone,
    recipientCompanyName: form.recipientCompanyName,
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
