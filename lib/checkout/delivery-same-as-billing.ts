import type { CheckoutFormValues } from '@/lib/validation/checkout-form'
import type { CheckoutShipmentSlice, CheckoutSplitShipments } from '@/lib/checkout/shipment-slice'
import {
  cloneShipmentSlice,
  extractShipmentSlice,
  patchShipmentSlice,
} from '@/lib/checkout/shipment-slice'

const COURIER_HOME_METHODS = new Set(['packeta-courier', 'gls-courier', 'nova-poshta-address'])

export function isCourierHomeDeliveryMethod(method: string): boolean {
  return COURIER_HOME_METHODS.has(method)
}

export function isPacketaPickupMethod(method: string): boolean {
  return method === 'packeta-box'
}

/** Patch that copies billing address into courier delivery fields. */
export function deliveryAddressFromBilling(
  form: Pick<
    CheckoutFormValues,
    | 'billingCountryCode'
    | 'billingPostalCode'
    | 'billingCity'
    | 'billingStreet'
    | 'billingHouseNumber'
    | 'deliveryCountryCode'
  >,
): Partial<CheckoutFormValues> {
  const country =
    form.billingCountryCode.trim() || form.deliveryCountryCode.trim() || 'sk'
  const city = form.billingCity.trim()
  const street = form.billingStreet.trim()
  return {
    deliveryCountryCode: country,
    postalCode: form.billingPostalCode.trim(),
    city,
    cityLabel: city,
    street,
    streetLabel: street,
    houseNumber: form.billingHouseNumber.trim(),
  }
}

/** Slice-shaped subset of {@link deliveryAddressFromBilling}. */
export function deliveryAddressFieldsForSlice(
  form: Pick<
    CheckoutFormValues,
    | 'billingCountryCode'
    | 'billingPostalCode'
    | 'billingCity'
    | 'billingStreet'
    | 'billingHouseNumber'
    | 'deliveryCountryCode'
  >,
): Pick<
  CheckoutShipmentSlice,
  | 'deliveryCountryCode'
  | 'postalCode'
  | 'city'
  | 'cityLabel'
  | 'street'
  | 'streetLabel'
  | 'houseNumber'
> {
  const patch = deliveryAddressFromBilling(form)
  return {
    deliveryCountryCode: patch.deliveryCountryCode ?? '',
    postalCode: patch.postalCode ?? '',
    city: patch.city ?? '',
    cityLabel: patch.cityLabel ?? '',
    street: patch.street ?? '',
    streetLabel: patch.streetLabel ?? '',
    houseNumber: patch.houseNumber ?? '',
  }
}

/**
 * Packeta point identity + display address that leaks into shared street/city fields.
 * Cleared when leaving packeta-box for a courier so point data cannot satisfy courier validation.
 */
export function clearPacketaPointLeakFields(): Pick<
  CheckoutShipmentSlice,
  | 'postOffice'
  | 'postOfficeLabel'
  | 'packetaPickupKind'
  | 'packetaCarrierId'
  | 'street'
  | 'streetLabel'
  | 'houseNumber'
  | 'city'
  | 'cityLabel'
  | 'postalCode'
> {
  return {
    postOffice: '',
    postOfficeLabel: '',
    packetaPickupKind: '',
    packetaCarrierId: null,
    street: '',
    streetLabel: '',
    houseNumber: '',
    city: '',
    cityLabel: '',
    postalCode: '',
  }
}

function isBillingAddressPatch(patch: Partial<CheckoutFormValues>): boolean {
  return (
    patch.billingStreet !== undefined ||
    patch.billingHouseNumber !== undefined ||
    patch.billingCity !== undefined ||
    patch.billingPostalCode !== undefined ||
    patch.billingCountryCode !== undefined
  )
}

function applyBillingToCourierSlice(
  slice: CheckoutShipmentSlice,
  form: CheckoutFormValues,
): CheckoutShipmentSlice {
  if (!isCourierHomeDeliveryMethod(slice.deliveryMethod)) return slice
  return { ...slice, ...deliveryAddressFieldsForSlice(form) }
}

/** Apply billing → every courier slice (Packeta point / pickup untouched). */
export function syncCourierSlicesFromBilling(
  split: CheckoutSplitShipments,
  form: CheckoutFormValues,
): CheckoutSplitShipments {
  return {
    immediate: applyBillingToCourierSlice(split.immediate, form),
    dated: applyBillingToCourierSlice(split.dated, form),
  }
}

/**
 * When same-as is ON, copy billing into main courier fields and every courier split slice.
 */
export function applyDeliveryAddressSameAsBilling(
  form: CheckoutFormValues,
): CheckoutFormValues {
  if (!form.deliveryAddressSameAsBilling) return form

  let next = form
  if (isCourierHomeDeliveryMethod(next.deliveryMethod)) {
    next = { ...next, ...deliveryAddressFromBilling(next) }
  }
  if (next.splitShipments) {
    next = {
      ...next,
      splitShipments: syncCourierSlicesFromBilling(next.splitShipments, next),
    }
  }
  return next
}

/**
 * Method-transition semantics for shared delivery fields.
 * Packeta pickup → courier: strip point identity + leaked display address;
 * if same-as ON, refill courier address from billing.
 */
export function applyDeliveryMethodTransition(
  prevMethod: string,
  nextMethod: string,
  form: CheckoutFormValues,
): Partial<CheckoutFormValues> {
  if (prevMethod === nextMethod) return {}

  if (isPacketaPickupMethod(prevMethod) && isCourierHomeDeliveryMethod(nextMethod)) {
    const cleared = clearPacketaPointLeakFields()
    if (form.deliveryAddressSameAsBilling) {
      return { ...cleared, ...deliveryAddressFromBilling(form) }
    }
    return cleared
  }

  return {}
}

function applyDeliveryMethodTransitionToSlice(
  prevMethod: string,
  nextMethod: string,
  slice: CheckoutShipmentSlice,
  form: CheckoutFormValues,
): CheckoutShipmentSlice {
  if (prevMethod === nextMethod) return slice

  if (isPacketaPickupMethod(prevMethod) && isCourierHomeDeliveryMethod(nextMethod)) {
    let next = { ...slice, ...clearPacketaPointLeakFields(), deliveryMethod: nextMethod }
    if (form.deliveryAddressSameAsBilling) {
      next = { ...next, ...deliveryAddressFieldsForSlice(form) }
    }
    return next
  }

  return slice
}

/**
 * Canonical form-level patch reducer (non-split + billing edits while split is active).
 * `deliveryAddressSameAsBilling` lives only on the form — never on a slice.
 */
export function reduceCheckoutFormPatch(
  prev: CheckoutFormValues,
  patch: Partial<CheckoutFormValues>,
): CheckoutFormValues {
  let next: CheckoutFormValues = { ...prev, ...patch }

  if (patch.deliveryMethod !== undefined && patch.deliveryMethod !== prev.deliveryMethod) {
    next = {
      ...next,
      ...applyDeliveryMethodTransition(prev.deliveryMethod, patch.deliveryMethod, next),
    }
  }

  // Non-split: leaving courier disables same-as (single method). Split keeps the flag —
  // it only applies to courier slices.
  if (
    !next.splitShipments &&
    patch.deliveryMethod !== undefined &&
    !isCourierHomeDeliveryMethod(next.deliveryMethod) &&
    next.deliveryAddressSameAsBilling
  ) {
    next = { ...next, deliveryAddressSameAsBilling: false }
  }

  const turnedSameOn =
    patch.deliveryAddressSameAsBilling === true && !prev.deliveryAddressSameAsBilling
  const billingTouched = isBillingAddressPatch(patch)
  const methodBecameCourier =
    patch.deliveryMethod !== undefined &&
    isCourierHomeDeliveryMethod(next.deliveryMethod) &&
    !isCourierHomeDeliveryMethod(prev.deliveryMethod)

  if (
    next.deliveryAddressSameAsBilling &&
    (turnedSameOn || billingTouched || methodBecameCourier)
  ) {
    next = applyDeliveryAddressSameAsBilling(next)
  }

  return next
}

/**
 * Split-panel shipment patch. Lifts `deliveryAddressSameAsBilling` to form level.
 * Never stores that flag on the slice.
 */
export function reduceSplitShipmentPatch(
  prev: CheckoutFormValues,
  which: 'immediate' | 'dated',
  patch: Partial<CheckoutFormValues>,
): CheckoutFormValues {
  const { deliveryAddressSameAsBilling: sameAsPatch, ...rest } = patch

  let next: CheckoutFormValues = { ...prev }
  if (typeof sameAsPatch === 'boolean') {
    next = { ...next, deliveryAddressSameAsBilling: sameAsPatch }
  }

  const seed = extractShipmentSlice(next)
  const current = next.splitShipments ?? {
    immediate: seed,
    dated: cloneShipmentSlice(seed),
  }

  const prevSlice = current[which]
  const slicePatch = rest as Partial<CheckoutShipmentSlice>
  let updated = patchShipmentSlice(prevSlice, slicePatch)

  if (
    slicePatch.deliveryMethod !== undefined &&
    slicePatch.deliveryMethod !== prevSlice.deliveryMethod
  ) {
    updated = applyDeliveryMethodTransitionToSlice(
      prevSlice.deliveryMethod,
      slicePatch.deliveryMethod,
      updated,
      next,
    )
  }

  let splitShipments: CheckoutSplitShipments
  let datedDeliverySynced = next.datedDeliverySynced

  if (which === 'immediate') {
    const syncDated = next.datedDeliverySynced !== false
    splitShipments = {
      immediate: updated,
      dated: syncDated ? cloneShipmentSlice(updated) : current.dated,
    }
    datedDeliverySynced = syncDated
  } else {
    splitShipments = {
      immediate: current.immediate,
      dated: updated,
    }
    datedDeliverySynced = false
  }

  next = {
    ...next,
    splitShipments,
    datedDeliverySynced,
  }

  const turnedSameOn =
    sameAsPatch === true && !prev.deliveryAddressSameAsBilling
  const methodBecameCourier =
    slicePatch.deliveryMethod !== undefined &&
    isCourierHomeDeliveryMethod(updated.deliveryMethod) &&
    !isCourierHomeDeliveryMethod(prevSlice.deliveryMethod)

  if (next.deliveryAddressSameAsBilling && (turnedSameOn || methodBecameCourier)) {
    next = applyDeliveryAddressSameAsBilling(next)
  }

  return next
}
