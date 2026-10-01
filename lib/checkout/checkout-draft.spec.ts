import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildCheckoutDraftPayload,
  checkoutFormPatchFromDraft,
} from './checkout-draft'
import type { CheckoutFormValues } from '@/lib/validation/checkout-form'

const baseForm: CheckoutFormValues = {
  firstName: 'Jan',
  lastName: 'Novak',
  patronymic: '',
  email: 'jan@example.com',
  phone: '+421900000000',
  deliveryPhone: '',
  isOtherRecipient: false,
  recipientFirstName: '',
  recipientLastName: '',
  recipientPatronymic: '',
  recipientPhone: '',
  recipientCompanyName: '',
  deliveryMethod: 'packeta-box',
  deliveryCountryCode: 'at',
  city: '',
  cityLabel: 'Wien',
  postOffice: '123',
  postOfficeLabel: 'Packeta Wien',
  packetaPickupKind: 'box',
  packetaCarrierId: null,
  street: '',
  streetLabel: '',
  houseNumber: '',
  postalCode: '1010',
  deliveryAddressSameAsBilling: false,
  billingFirstName: 'Jan',
  billingLastName: 'Novak',
  billingStreet: 'Main',
  billingHouseNumber: '1',
  billingCity: 'Bratislava',
  billingPostalCode: '81101',
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

describe('checkout draft hydrate', () => {
  it('build payload excludes consents', () => {
    const payload = buildCheckoutDraftPayload({
      form: baseForm,
      locale: 'sk',
      countryCode: 'sk',
    })
    assert.equal(payload.v, 1)
    assert.equal(payload.firstName, 'Jan')
    assert.equal(payload.deliveryCountryCode, 'at')
    assert.equal(payload.billingCountryCode, 'sk')
    assert.equal('privacyConsent' in payload, false)
  })

  it('build payload can attach write-only lastQuote', () => {
    const payload = buildCheckoutDraftPayload({
      form: baseForm,
      lastQuote: {
        quotedAt: '2026-10-01T12:00:00.000Z',
        currencyCode: 'EUR',
        deliveryAmount: 3.5,
        grandTotal: 40,
      },
    })
    assert.ok(payload.lastQuote)
    assert.equal(payload.lastQuote.grandTotal, 40)
  })

  it('hydrate ignores lastQuote money fields', () => {
    const patch = checkoutFormPatchFromDraft(
      {
        v: 1,
        firstName: 'A',
        lastQuote: {
          quotedAt: '2026-10-01T12:00:00.000Z',
          currencyCode: 'EUR',
          deliveryAmount: 3.5,
          grandTotal: 40,
        },
      },
      { deliveryMethods: ['packeta-box'], paymentMethods: ['card-online'] },
    )
    assert.equal(patch.firstName, 'A')
    assert.equal('lastQuote' in patch, false)
    assert.equal(JSON.stringify(patch).includes('grandTotal'), false)
  })

  it('does not restore disallowed delivery method', () => {
    const patch = checkoutFormPatchFromDraft(
      { v: 1, deliveryMethod: 'packeta-box', paymentMethod: 'card-online', firstName: 'A' },
      { deliveryMethods: ['gls-courier'], paymentMethods: ['card-online'] },
    )
    assert.equal(patch.deliveryMethod, undefined)
    assert.equal(patch.paymentMethod, 'card-online')
    assert.equal(patch.firstName, 'A')
  })
})
