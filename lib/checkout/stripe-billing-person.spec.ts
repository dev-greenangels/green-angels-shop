import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { stripeBillingPrefillFromPayload } from './stripe-pending'

describe('stripeBillingPrefillFromPayload — billing person', () => {
  it('B2C prefers billingFirst/Last over customer', () => {
    const prefill = stripeBillingPrefillFromPayload({
      customerFirstName: 'Jan',
      customerLastName: 'Novak',
      billingFirstName: 'Maria',
      billingLastName: 'Novakova',
      buyerType: 'individual',
      billingStreet: 'Hlavna',
      billingHouseNumber: '1',
      billingCity: 'Bratislava',
      billingPostalCode: '81101',
      billingCountryCode: 'sk',
    })
    assert.ok(prefill)
    assert.equal(prefill!.name, 'Maria Novakova')
    assert.equal(prefill!.line1, 'Hlavna 1')
  })

  it('B2C falls back to customer when billing names absent', () => {
    const prefill = stripeBillingPrefillFromPayload({
      customerFirstName: 'Jan',
      customerLastName: 'Novak',
      buyerType: 'individual',
      billingStreet: 'Hlavna',
      billingHouseNumber: '1',
      billingCity: 'Bratislava',
      billingPostalCode: '81101',
      billingCountryCode: 'sk',
    })
    assert.equal(prefill?.name, 'Jan Novak')
  })
})
