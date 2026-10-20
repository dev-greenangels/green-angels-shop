import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  getBulkPriceTiersFrom,
  getUnitPriceForQuantityFrom,
} from './product-pricing'

describe('product-pricing sales ladder helpers (Phase 2)', () => {
  const ladder = [
    { minQuantity: 1, pricePerUnit: 9 },
    { minQuantity: 10, pricePerUnit: 8 },
    { minQuantity: 50, pricePerUnit: 6 },
    { minQuantity: 100, pricePerUnit: 5 },
  ]

  it('resolves unit price for qty 1/10/50/100 from server ladder', () => {
    assert.equal(getUnitPriceForQuantityFrom(9, ladder, 1), 9)
    assert.equal(getUnitPriceForQuantityFrom(9, ladder, 10), 8)
    assert.equal(getUnitPriceForQuantityFrom(9, ladder, 50), 6)
    assert.equal(getUnitPriceForQuantityFrom(9, ladder, 100), 5)
    assert.equal(getUnitPriceForQuantityFrom(9, ladder, 75), 6)
  })

  it('bulk tiers exclude qty=1 and prices not below base', () => {
    assert.deepEqual(
      getBulkPriceTiersFrom(9, ladder).map((t) => [t.minQuantity, t.pricePerUnit]),
      [
        [10, 8],
        [50, 6],
        [100, 5],
      ],
    )
  })

  it('hides bulk tiers above available stock', () => {
    assert.deepEqual(
      getBulkPriceTiersFrom(9, ladder, { maxPurchasableQty: 37 }).map((t) => t.minQuantity),
      [10],
    )
    assert.deepEqual(
      getBulkPriceTiersFrom(9, ladder, { maxPurchasableQty: 0 }).map((t) => t.minQuantity),
      [],
    )
  })
})
