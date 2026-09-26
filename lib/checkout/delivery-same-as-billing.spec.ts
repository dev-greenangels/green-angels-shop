import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildOrderPayload } from './build-order-payload'
import {
  applyDeliveryAddressSameAsBilling,
  clearPacketaPointLeakFields,
  deliveryAddressFromBilling,
  isCourierHomeDeliveryMethod,
  isPacketaPickupMethod,
  reduceCheckoutFormPatch,
  reduceSplitShipmentPatch,
} from './delivery-same-as-billing'
import type { CheckoutFormValues } from '@/lib/validation/checkout-form'
import type { CartItem } from '@/lib/types'
import { extractShipmentSlice } from './shipment-slice'

const items = [
  {
    plant: { id: 'p1' },
    variantId: 'v1',
    quantity: 1,
  },
] as unknown as CartItem[]

function baseForm(overrides: Partial<CheckoutFormValues> = {}): CheckoutFormValues {
  return {
    firstName: 'Ján',
    lastName: 'Novák',
    patronymic: '',
    email: 'a@b.c',
    phone: '+421900111222',
    deliveryPhone: '',
    isOtherRecipient: true,
    recipientFirstName: 'Peter',
    recipientLastName: 'Novák',
    recipientPatronymic: '',
    recipientPhone: '+421900111223',
    recipientCompanyName: '',
    deliveryMethod: 'packeta-courier',
    deliveryCountryCode: 'sk',
    city: '',
    cityLabel: '',
    postOffice: '',
    postOfficeLabel: '',
    packetaPickupKind: '',
    packetaCarrierId: null,
    street: '',
    streetLabel: '',
    houseNumber: '',
    postalCode: '',
    deliveryAddressSameAsBilling: false,
    billingFirstName: 'Mária',
    billingLastName: 'Nováková',
    billingStreet: 'Hlavná',
    billingHouseNumber: '10',
    billingCity: 'Bratislava',
    billingPostalCode: '811 01',
    billingCountryCode: 'sk',
    paymentMethod: 'bank-transfer',
    companyEdrpou: '',
    companyLegalName: '',
    companyDic: '',
    companyStreet: '',
    companyCity: '',
    companyPostalCode: '',
    preferredShipDate: '',
    preferredShipDateImmediate: '',
    comment: '',
    promoCode: '',
    ...overrides,
  }
}

function skPayload(form: CheckoutFormValues, slice = extractShipmentSlice(form)) {
  return buildOrderPayload(form, items, {
    marketRegion: 'sk',
    buyerType: 'individual',
    countryCode: 'sk',
    shipmentSlice: slice,
    authPhonePolicy: 'e164_intl',
    deliveryPhonePolicy: 'e164_intl',
  })
}

function assertCourierDeliveryFromBilling(
  payload: ReturnType<typeof buildOrderPayload>,
  billing: Pick<
    CheckoutFormValues,
    | 'billingStreet'
    | 'billingHouseNumber'
    | 'billingCity'
    | 'billingPostalCode'
    | 'billingCountryCode'
  >,
) {
  assert.equal(payload.deliveryStreet, billing.billingStreet)
  assert.equal(payload.deliveryHouseNumber, billing.billingHouseNumber)
  assert.equal(payload.deliveryCity, billing.billingCity)
  assert.equal(payload.deliveryPostalCode, billing.billingPostalCode)
  assert.equal(payload.deliveryCountryCode, billing.billingCountryCode.toLowerCase())
}

describe('delivery same as billing helpers', () => {
  it('only courier-home methods are eligible', () => {
    assert.equal(isCourierHomeDeliveryMethod('packeta-courier'), true)
    assert.equal(isCourierHomeDeliveryMethod('gls-courier'), true)
    assert.equal(isCourierHomeDeliveryMethod('packeta-box'), false)
    assert.equal(isCourierHomeDeliveryMethod('pickup'), false)
    assert.equal(isPacketaPickupMethod('packeta-box'), true)
  })

  it('copies billing → delivery address fields', () => {
    const patch = deliveryAddressFromBilling({
      billingCountryCode: 'at',
      billingPostalCode: '1010',
      billingCity: 'Wien',
      billingStreet: 'Ring',
      billingHouseNumber: '2',
      deliveryCountryCode: 'sk',
    })
    assert.equal(patch.deliveryCountryCode, 'at')
    assert.equal(patch.postalCode, '1010')
    assert.equal(patch.city, 'Wien')
    assert.equal(patch.street, 'Ring')
    assert.equal(patch.houseNumber, '2')
  })
})

describe('A. Split: both courier + same-as', () => {
  it('both child payloads receive billing delivery; billing edit syncs both', () => {
    let form = baseForm()
    form = reduceSplitShipmentPatch(form, 'immediate', {
      deliveryMethod: 'gls-courier',
    })
    form = reduceSplitShipmentPatch(form, 'dated', {
      deliveryMethod: 'packeta-courier',
    })
    form = reduceCheckoutFormPatch(form, { deliveryAddressSameAsBilling: true })

    assert.equal(form.deliveryAddressSameAsBilling, true)
    assert.equal(form.splitShipments!.immediate.street, 'Hlavná')
    assert.equal(form.splitShipments!.dated.street, 'Hlavná')
    // Flag must not live on slices
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        form.splitShipments!.immediate,
        'deliveryAddressSameAsBilling',
      ),
      false,
    )

    const immediate = skPayload(form, form.splitShipments!.immediate)
    const dated = skPayload(form, form.splitShipments!.dated)
    assertCourierDeliveryFromBilling(immediate, form)
    assertCourierDeliveryFromBilling(dated, form)
    assert.equal(immediate.billingFirstName, 'Mária')
    assert.equal(dated.billingFirstName, 'Mária')
    assert.equal(immediate.receiverFirstName, 'Peter')

    form = reduceCheckoutFormPatch(form, {
      billingStreet: 'Nová',
      billingHouseNumber: '25',
    })
    assert.equal(form.splitShipments!.immediate.street, 'Nová')
    assert.equal(form.splitShipments!.dated.street, 'Nová')
    assert.equal(form.splitShipments!.immediate.houseNumber, '25')

    assertCourierDeliveryFromBilling(
      skPayload(form, form.splitShipments!.immediate),
      form,
    )
    assertCourierDeliveryFromBilling(skPayload(form, form.splitShipments!.dated), form)
  })
})

describe('B. Split: courier + Packeta point', () => {
  it('same-as fills courier only; Packeta point identity preserved', () => {
    let form = baseForm({ deliveryAddressSameAsBilling: true })
    form = reduceSplitShipmentPatch(form, 'immediate', {
      deliveryMethod: 'gls-courier',
    })
    form = reduceSplitShipmentPatch(form, 'dated', {
      deliveryMethod: 'packeta-box',
      postOffice: '24440',
      postOfficeLabel: 'Z-BOX Prašice, 1. mája 155',
      street: '1. mája 155',
      streetLabel: '1. mája 155',
      city: 'Prašice',
      cityLabel: 'Prašice',
      postalCode: '95601',
    })
    form = applyDeliveryAddressSameAsBilling(form)

    assert.equal(form.splitShipments!.immediate.street, 'Hlavná')
    assert.equal(form.splitShipments!.dated.postOffice, '24440')
    assert.equal(form.splitShipments!.dated.street, '1. mája 155')

    const courier = skPayload(form, form.splitShipments!.immediate)
    const point = skPayload(form, form.splitShipments!.dated)
    assertCourierDeliveryFromBilling(courier, form)
    assert.equal(point.deliveryBranch, '24440')
    assert.equal(point.deliveryStreet, '1. mája 155')
    assert.notEqual(point.deliveryStreet, form.billingStreet)
  })
})

describe('C. Split: courier + personal pickup', () => {
  it('courier gets billing; pickup has no fake courier address requirement', () => {
    let form = baseForm({ deliveryAddressSameAsBilling: true })
    form = reduceSplitShipmentPatch(form, 'immediate', {
      deliveryMethod: 'gls-courier',
    })
    form = reduceSplitShipmentPatch(form, 'dated', {
      deliveryMethod: 'pickup',
      street: '',
      houseNumber: '',
      postalCode: '',
      city: '',
    })
    form = applyDeliveryAddressSameAsBilling(form)

    assert.equal(form.splitShipments!.immediate.street, 'Hlavná')
    assert.equal(form.splitShipments!.dated.deliveryMethod, 'pickup')
    assert.equal(form.splitShipments!.dated.street, '')

    const courier = skPayload(form, form.splitShipments!.immediate)
    const pickup = skPayload(form, form.splitShipments!.dated)
    assertCourierDeliveryFromBilling(courier, form)
    assert.equal(pickup.deliveryMethod, 'pickup')
    assert.equal(pickup.deliveryStreet, undefined)
    assert.equal(pickup.deliveryHouseNumber, undefined)
  })
})

describe('D. Turn same-as OFF', () => {
  it('keeps last copied values; later billing edits do not mutate slices', () => {
    let form = baseForm()
    form = reduceSplitShipmentPatch(form, 'immediate', { deliveryMethod: 'gls-courier' })
    form = reduceSplitShipmentPatch(form, 'dated', { deliveryMethod: 'packeta-courier' })
    form = reduceCheckoutFormPatch(form, { deliveryAddressSameAsBilling: true })
    assert.equal(form.splitShipments!.immediate.street, 'Hlavná')

    form = reduceCheckoutFormPatch(form, { deliveryAddressSameAsBilling: false })
    assert.equal(form.deliveryAddressSameAsBilling, false)
    assert.equal(form.splitShipments!.immediate.street, 'Hlavná')
    assert.equal(form.splitShipments!.dated.street, 'Hlavná')

    form = reduceCheckoutFormPatch(form, {
      billingStreet: 'Iná',
      billingHouseNumber: '99',
    })
    assert.equal(form.splitShipments!.immediate.street, 'Hlavná')
    assert.equal(form.splitShipments!.dated.street, 'Hlavná')
    assert.equal(form.billingStreet, 'Iná')
  })
})

describe('E/F/G. Packeta pickup → courier', () => {
  it('E: packeta-box → GLS with same-as OFF clears point leak', () => {
    let form = baseForm({
      deliveryMethod: 'packeta-box',
      postOffice: '24440',
      postOfficeLabel: 'Z-BOX',
      street: '1. mája 155',
      streetLabel: '1. mája 155',
      city: 'Prašice',
      postalCode: '95601',
      deliveryAddressSameAsBilling: false,
    })
    form = reduceCheckoutFormPatch(form, { deliveryMethod: 'gls-courier' })
    assert.equal(form.deliveryMethod, 'gls-courier')
    assert.equal(form.postOffice, '')
    assert.equal(form.street, '')
    assert.equal(form.houseNumber, '')
    assert.equal(form.postalCode, '')

    const payload = skPayload(form)
    assert.equal(payload.deliveryStreet, '')
    assert.equal(payload.deliveryHouseNumber, '')
    assert.notEqual(payload.deliveryStreet, '1. mája 155')
  })

  it('F: packeta-box → GLS with same-as ON derives billing immediately', () => {
    let form = baseForm({
      deliveryMethod: 'packeta-box',
      postOffice: '24440',
      street: '1. mája 155',
      deliveryAddressSameAsBilling: true,
    })
    form = reduceCheckoutFormPatch(form, { deliveryMethod: 'gls-courier' })
    assert.equal(form.postOffice, '')
    assert.equal(form.street, 'Hlavná')
    assert.equal(form.houseNumber, '10')
    assertCourierDeliveryFromBilling(skPayload(form), form)
  })

  it('G: packeta-box → Packeta courier same as E/F', () => {
    let form = baseForm({
      deliveryMethod: 'packeta-box',
      postOffice: '24440',
      street: 'point-street',
      deliveryAddressSameAsBilling: false,
    })
    form = reduceCheckoutFormPatch(form, { deliveryMethod: 'packeta-courier' })
    assert.equal(form.street, '')
    assert.equal(form.postOffice, '')

    form = baseForm({
      deliveryMethod: 'packeta-box',
      postOffice: '24440',
      street: 'point-street',
      deliveryAddressSameAsBilling: true,
    })
    form = reduceCheckoutFormPatch(form, { deliveryMethod: 'packeta-courier' })
    assert.equal(form.street, 'Hlavná')
    assertCourierDeliveryFromBilling(skPayload(form), form)
  })

  it('split panel: packeta-box → GLS clears leak on that slice', () => {
    let form = baseForm({ deliveryAddressSameAsBilling: false })
    form = reduceSplitShipmentPatch(form, 'immediate', {
      deliveryMethod: 'packeta-box',
      postOffice: '24440',
      street: 'point-st',
      postalCode: '95601',
    })
    form = reduceSplitShipmentPatch(form, 'immediate', {
      deliveryMethod: 'gls-courier',
    })
    assert.equal(form.splitShipments!.immediate.postOffice, '')
    assert.equal(form.splitShipments!.immediate.street, '')
  })
})

describe('H. Courier → Packeta point', () => {
  it('same-as is not applied to Packeta point; point selection authoritative', () => {
    let form = baseForm({ deliveryAddressSameAsBilling: true })
    form = reduceCheckoutFormPatch(form, { deliveryMethod: 'packeta-courier' })
    form = applyDeliveryAddressSameAsBilling(form)
    form = reduceCheckoutFormPatch(form, {
      deliveryMethod: 'packeta-box',
      postOffice: '999',
      postOfficeLabel: 'Point',
      street: 'Point St',
      streetLabel: 'Point St',
      city: 'Nitra',
      cityLabel: 'Nitra',
      postalCode: '94901',
    })
    // Non-split: leaving courier turns same-as off
    assert.equal(form.deliveryAddressSameAsBilling, false)
    assert.equal(form.postOffice, '999')
    assert.equal(form.street, 'Point St')
    const payload = skPayload(form)
    assert.equal(payload.deliveryBranch, '999')
    assert.equal(payload.deliveryStreet, 'Point St')
    assert.notEqual(payload.deliveryStreet, form.billingStreet)
  })
})

describe('I. Courier → personal pickup', () => {
  it('no courier-address requirement leaks into pickup', () => {
    let form = baseForm({
      deliveryAddressSameAsBilling: true,
      deliveryMethod: 'gls-courier',
      street: 'Hlavná',
      houseNumber: '10',
    })
    form = reduceCheckoutFormPatch(form, { deliveryMethod: 'pickup' })
    assert.equal(form.deliveryAddressSameAsBilling, false)
    assert.equal(form.deliveryMethod, 'pickup')
    const payload = skPayload(form)
    assert.equal(payload.deliveryMethod, 'pickup')
    assert.equal(payload.deliveryStreet, undefined)
  })
})

describe('J. Payload builder protects against stale UI', () => {
  it('same-as ON overwrites stale courier slice street from billing', () => {
    const form = baseForm({
      deliveryAddressSameAsBilling: true,
      billingStreet: 'BillingOnly',
      billingHouseNumber: '7',
      billingCity: 'Košice',
      billingPostalCode: '04001',
      billingCountryCode: 'sk',
      street: 'STALE',
      houseNumber: '1',
      city: 'Wrong',
      postalCode: '00000',
      deliveryMethod: 'gls-courier',
    })
    const slice = {
      ...extractShipmentSlice(form),
      street: 'STALE-SLICE',
      streetLabel: 'STALE-SLICE',
      houseNumber: '99',
      city: 'StaleCity',
      cityLabel: 'StaleCity',
      postalCode: '11111',
      deliveryMethod: 'gls-courier' as const,
    }
    const payload = skPayload(form, slice)
    assert.equal(payload.deliveryStreet, 'BillingOnly')
    assert.equal(payload.deliveryHouseNumber, '7')
    assert.equal(payload.deliveryCity, 'Košice')
    assert.equal(payload.deliveryPostalCode, '04001')
    assert.equal(payload.receiverFirstName, 'Peter')
    assert.equal(payload.customerFirstName, 'Ján')
    assert.equal(payload.billingFirstName, 'Mária')
  })

  it('clearPacketaPointLeakFields empties identity + display address', () => {
    const cleared = clearPacketaPointLeakFields()
    assert.equal(cleared.postOffice, '')
    assert.equal(cleared.street, '')
    assert.equal(cleared.packetaCarrierId, null)
  })
})
