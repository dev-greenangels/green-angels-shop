import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  hasStripeBillingAddressPrefill,
  stripeBillingPrefillFromPayload,
  stripeCheckoutContactFromPrefill,
  stripePaymentElementFieldsForPrefill,
} from './stripe-pending'

describe('stripeBillingPrefillFromPayload — billing name', () => {
  it('B2C: firstName + lastName → full Stripe name (not first-only)', () => {
    const prefill = stripeBillingPrefillFromPayload({
      customerFirstName: 'Dušan',
      customerLastName: 'Štofík',
      buyerType: 'individual',
      billingStreet: 'Hlavná',
      billingHouseNumber: '1',
      billingCity: 'Bratislava',
      billingPostalCode: '811 01',
      billingCountryCode: 'sk',
    })
    assert.ok(prefill)
    assert.equal(prefill.name, 'Dušan Štofík')
    assert.notEqual(prefill.name, 'Dušan')
  })

  it('B2B: companyLegalName is Stripe billing name', () => {
    const prefill = stripeBillingPrefillFromPayload({
      customerFirstName: 'Dušan',
      customerLastName: 'Štofík',
      buyerType: 'company',
      companyLegalName: 'Green Angels s.r.o.',
      billingStreet: 'Hlavná',
      billingHouseNumber: '1',
      billingCity: 'Bratislava',
      billingPostalCode: '811 01',
      billingCountryCode: 'sk',
    })
    assert.ok(prefill)
    assert.equal(prefill.name, 'Green Angels s.r.o.')
  })

  it('maps address line1 = street + house number, country uppercase', () => {
    const prefill = stripeBillingPrefillFromPayload({
      customerFirstName: 'A',
      customerLastName: 'B',
      billingStreet: 'Hlavná',
      billingHouseNumber: '12',
      billingCity: 'Bratislava',
      billingPostalCode: '811 01',
      billingCountryCode: 'sk',
    })
    assert.ok(prefill)
    assert.equal(prefill.line1, 'Hlavná 12')
    assert.equal(prefill.country, 'SK')
  })
})

describe('stripePaymentElementFieldsForPrefill — no double collection', () => {
  it('sets name+address never when we will pass them on confirm', () => {
    const prefill = stripeBillingPrefillFromPayload({
      customerFirstName: 'Dušan',
      customerLastName: 'Štofík',
      billingStreet: 'Hlavná',
      billingHouseNumber: '1',
      billingCity: 'Bratislava',
      billingPostalCode: '811 01',
      billingCountryCode: 'sk',
    })
    assert.ok(prefill)
    assert.equal(hasStripeBillingAddressPrefill(prefill), true)
    const fields = stripePaymentElementFieldsForPrefill(prefill)
    assert.deepEqual(fields, {
      billingDetails: { name: 'never', address: 'never' },
    })
    // Does not force email/phone never — we do not pass those on confirm billingAddress.
    assert.equal(
      fields && 'email' in (fields.billingDetails as object),
      false,
    )
  })

  it('confirm contact includes full name so PE can safely use name=never', () => {
    const prefill = stripeBillingPrefillFromPayload({
      customerFirstName: 'Dušan',
      customerLastName: 'Štofík',
      billingStreet: 'Hlavná',
      billingHouseNumber: '1',
      billingCity: 'Bratislava',
      billingPostalCode: '811 01',
      billingCountryCode: 'sk',
    })
    assert.ok(prefill)
    const contact = stripeCheckoutContactFromPrefill(prefill)
    assert.equal(contact.name, 'Dušan Štofík')
    assert.equal(contact.address.country, 'SK')
    assert.equal(contact.address.line1, 'Hlavná 1')
  })

  it('returns undefined when address prefill missing (PE may collect)', () => {
    assert.equal(stripePaymentElementFieldsForPrefill(null), undefined)
    assert.equal(
      stripePaymentElementFieldsForPrefill({
        name: 'X',
        line1: '',
        city: '',
        postal_code: '',
        country: '',
      }),
      undefined,
    )
  })
})
