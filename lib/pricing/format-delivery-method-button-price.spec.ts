import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { formatDeliveryMethodButtonPrice } from './format-delivery-method-button-price'
import type { DeliveryMethodPriceSnapshot } from './use-delivery-method-prices'

const vat = {
  priceBasis: 'ex_vat' as const,
  storefrontPrimaryPrice: 'inc_vat' as const,
  taxRatePercent: 23,
}

describe('formatDeliveryMethodButtonPrice', () => {
  it('formats positive delivery amount with shelf when fees are ex-VAT', () => {
    const snapshot: DeliveryMethodPriceSnapshot = {
      deliveryAmount: 3.69,
      deliveryIncludedInTotal: true,
      deliveryUnavailableReason: null,
      taxAppliesToFees: true,
      taxRatePercent: 23,
      taxRegime: 'destination',
    }
    const label = formatDeliveryMethodButtonPrice(snapshot, {
      formatShelf: (n) => `SHELF:${n}`,
      formatRaw: (n) => `RAW:${n}`,
      vat,
    })
    assert.equal(label, 'SHELF:3.69')
  })

  it('formats zero as money (not hidden)', () => {
    const snapshot: DeliveryMethodPriceSnapshot = {
      deliveryAmount: 0,
      deliveryIncludedInTotal: true,
      deliveryUnavailableReason: null,
      taxAppliesToFees: true,
      taxRatePercent: 23,
      taxRegime: 'destination',
    }
    const label = formatDeliveryMethodButtonPrice(snapshot, {
      formatShelf: (n) => `SHELF:${n}`,
      formatRaw: (n) => `RAW:${n}`,
      vat,
    })
    assert.equal(label, 'SHELF:0')
  })

  it('returns null when tariff unavailable', () => {
    const snapshot: DeliveryMethodPriceSnapshot = {
      deliveryAmount: 0,
      deliveryIncludedInTotal: false,
      deliveryUnavailableReason: 'no_tariff',
    }
    const label = formatDeliveryMethodButtonPrice(snapshot, {
      formatShelf: (n) => `${n}`,
      formatRaw: (n) => `${n}`,
      vat,
    })
    assert.equal(label, null)
  })
})
