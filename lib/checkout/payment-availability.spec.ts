import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  isPaymentMethodCurrentlyAllowed,
  resolveShippingPagePaymentMethods,
  resolveVisiblePaymentMethods,
} from './payment-availability'

describe('resolveVisiblePaymentMethods matrix', () => {
  const prepaid = ['card-online', 'bank-transfer', 'bank-transfer-legal'] as const
  const withDobierka = [...prepaid, 'dobierka'] as const

  it('1. pickup + allowPayOnPickup=false → no dobierka, no pay-on-pickup', () => {
    const methods = resolveVisiblePaymentMethods({
      enabledPaymentMethods: [...withDobierka],
      hideLegalBankTransfer: false,
      allowPayOnPickup: false,
      deliveryMethod: 'pickup',
    })
    assert.equal(methods.includes('dobierka'), false)
    assert.equal(methods.includes('pay-on-pickup'), false)
    assert.equal(methods.includes('card-online'), true)
    assert.equal(methods.includes('bank-transfer'), true)
  })

  it('2. pickup + allowPayOnPickup=true → pay-on-pickup yes, dobierka no', () => {
    const methods = resolveVisiblePaymentMethods({
      enabledPaymentMethods: [...withDobierka],
      hideLegalBankTransfer: false,
      allowPayOnPickup: true,
      deliveryMethod: 'pickup',
    })
    assert.equal(methods.includes('pay-on-pickup'), true)
    assert.equal(methods.includes('dobierka'), false)
  })

  it('3. courier + allowPayOnPickup=true → no pay-on-pickup; dobierka if enabled', () => {
    const methods = resolveVisiblePaymentMethods({
      enabledPaymentMethods: [...withDobierka],
      hideLegalBankTransfer: false,
      allowPayOnPickup: true,
      deliveryMethod: 'gls-courier',
    })
    assert.equal(methods.includes('pay-on-pickup'), false)
    assert.equal(methods.includes('dobierka'), true)
  })

  it('3b. courier without dobierka in enabled list → dobierka stays off', () => {
    const methods = resolveVisiblePaymentMethods({
      enabledPaymentMethods: [...prepaid],
      hideLegalBankTransfer: false,
      allowPayOnPickup: true,
      deliveryMethod: 'packeta-courier',
    })
    assert.equal(methods.includes('dobierka'), false)
    assert.equal(methods.includes('pay-on-pickup'), false)
  })

  it('7. selected dobierka becomes invalid after switch to pickup', () => {
    assert.equal(
      isPaymentMethodCurrentlyAllowed('dobierka', {
        enabledPaymentMethods: [...withDobierka],
        hideLegalBankTransfer: false,
        allowPayOnPickup: true,
        deliveryMethod: 'pickup',
      }),
      false,
    )
  })

  it('shipping page hides bank-transfer-legal on SK and unions POP when pickup allowed', () => {
    const methods = resolveShippingPagePaymentMethods({
      enabledPaymentMethods: [...withDobierka],
      hideLegalBankTransfer: true,
      allowPayOnPickup: true,
      enabledDeliveryMethods: ['packeta-courier', 'pickup'],
    })
    assert.equal(methods.includes('bank-transfer-legal'), false)
    assert.equal(methods.includes('bank-transfer'), true)
    assert.equal(methods.includes('dobierka'), true)
    assert.equal(methods.includes('pay-on-pickup'), true)
    assert.equal(methods.includes('card-online'), true)
  })

  it('shipping page does not invent pay-on-pickup when flag is off', () => {
    const methods = resolveShippingPagePaymentMethods({
      enabledPaymentMethods: [...prepaid],
      hideLegalBankTransfer: true,
      allowPayOnPickup: false,
      enabledDeliveryMethods: ['pickup', 'gls-courier'],
    })
    assert.equal(methods.includes('pay-on-pickup'), false)
    assert.equal(methods.includes('dobierka'), false)
  })
})
