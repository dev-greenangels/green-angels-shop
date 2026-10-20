import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  filterSalesPricesForVariant,
  formatBasePriceLabel,
  salesPriceTierLines,
  type ProductSalesPriceRow,
} from './product-variant-pricing'

const row = (patch: Partial<ProductSalesPriceRow>): ProductSalesPriceRow => ({
  id: '1',
  productVariantId: 'v1',
  scope: 'ALL',
  priceGroupCode: null,
  flexiFirmaKod: null,
  currency: 'EUR',
  unitPrice: 10,
  validFrom: null,
  validTo: null,
  validityStatus: 'ACTIVE',
  limMnoz2: 5,
  unitPrice2: 9,
  limMnoz3: 0,
  unitPrice3: null,
  limMnoz4: 0,
  unitPrice4: null,
  limMnoz5: 0,
  unitPrice5: null,
  syncedAt: '2026-01-01T00:00:00.000Z',
  ...patch,
})

describe('formatBasePriceLabel', () => {
  it('uses commerce currency, not hardcoded UAH', () => {
    assert.equal(formatBasePriceLabel('EUR', '€'), '€ (EUR)')
    assert.equal(formatBasePriceLabel('UAH', '₴'), '₴ (UAH)')
    assert.equal(formatBasePriceLabel('CZK'), 'CZK')
  })
})

describe('filter + tiers', () => {
  it('filters by variant and expands limMnoz tiers', () => {
    const rows = [row({ productVariantId: 'v1' }), row({ id: '2', productVariantId: 'v2' })]
    assert.equal(filterSalesPricesForVariant(rows, 'v1').length, 1)
    assert.deepEqual(salesPriceTierLines(rows[0]), [
      { minQty: 1, unitPrice: 10 },
      { minQty: 5, unitPrice: 9 },
    ])
  })
})
