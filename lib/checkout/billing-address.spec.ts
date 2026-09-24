import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildOrderPayload } from './build-order-payload'
import {
  isBillingAddressValid,
  type CheckoutFormValues,
} from '@/lib/validation/checkout-form'
import type { CartItem } from '@/lib/types'

const baseForm: CheckoutFormValues = {
  firstName: 'Dušan',
  lastName: 'Štofík',
  patronymic: '',
  email: 'a@b.c',
  phone: '0901234567',
  deliveryPhone: '',
  isOtherRecipient: false,
  recipientFirstName: '',
  recipientLastName: '',
  recipientPatronymic: '',
  recipientPhone: '',
  recipientCompanyName: '',
  deliveryMethod: 'packeta-courier',
  deliveryCountryCode: 'sk',
  city: 'Bratislava',
  cityLabel: 'Bratislava',
  postOffice: '',
  postOfficeLabel: '',
  packetaPickupKind: '',
  packetaCarrierId: null,
  street: 'Hlavná',
  streetLabel: 'Hlavná',
  houseNumber: '1',
  postalCode: '811 01',
  billingSameAsShipping: false,
  billingStreet: 'Fakturačná',
  billingHouseNumber: '10',
  billingCity: 'Nitra',
  billingPostalCode: '949 01',
  billingCountryCode: 'sk',
  paymentMethod: 'card-online',
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
}

const items = [
  {
    plant: { id: 'p1' },
    variantId: 'v1',
    quantity: 1,
  },
] as unknown as CartItem[]

describe('SK billing payload + validation', () => {
  it('individual uses explicit billing* (never copies shipping)', () => {
    const payload = buildOrderPayload(baseForm, items, {
      marketRegion: 'sk',
      buyerType: 'individual',
      countryCode: 'sk',
      privacyConsent: true,
    })
    assert.equal(payload.billingStreet, 'Fakturačná')
    assert.equal(payload.billingHouseNumber, '10')
    assert.equal(payload.billingCity, 'Nitra')
    assert.equal(payload.billingPostalCode, '949 01')
    assert.equal(payload.billingCountryCode, 'sk')
    assert.equal(payload.privacyConsent, true)
    assert.notEqual(payload.billingStreet, payload.deliveryStreet)
  })

  it('packeta-box never uses point as billing', () => {
    const form: CheckoutFormValues = {
      ...baseForm,
      deliveryMethod: 'packeta-box',
      postOffice: '24440',
      postOfficeLabel: 'Z-BOX X',
      street: 'Point St',
      streetLabel: 'Point St',
      houseNumber: '',
      postalCode: '956 01',
      billingStreet: 'Home',
      billingHouseNumber: '2',
      billingCity: 'Prašice',
      billingPostalCode: '956 22',
      billingCountryCode: 'sk',
    }
    const payload = buildOrderPayload(form, items, {
      marketRegion: 'sk',
      buyerType: 'individual',
      privacyConsent: true,
    })
    assert.equal(payload.billingStreet, 'Home')
    assert.equal(payload.billingPostalCode, '956 22')
    assert.equal(payload.deliveryBranch, '24440')
    assert.equal(payload.deliveryStreet, 'Point St')
    assert.notEqual(payload.billingStreet, payload.deliveryStreet)
  })

  it('isBillingAddressValid rejects empty SK billing for individual', () => {
    const form: CheckoutFormValues = {
      ...baseForm,
      deliveryMethod: 'pickup',
      billingStreet: '',
      billingHouseNumber: '',
      billingCity: '',
      billingPostalCode: '',
      billingCountryCode: '',
    }
    assert.equal(
      isBillingAddressValid(form, { marketRegion: 'sk', buyerType: 'individual' }),
      false,
    )
  })

  it('UA market does not require billing*', () => {
    assert.equal(
      isBillingAddressValid(baseForm, { marketRegion: 'ua' }),
      true,
    )
    const payload = buildOrderPayload(baseForm, items, {
      marketRegion: 'ua',
      privacyConsent: true,
    })
    assert.equal(payload.billingStreet, undefined)
  })
})
