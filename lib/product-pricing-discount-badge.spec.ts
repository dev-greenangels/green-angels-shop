import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  getPlantDiscountBadge,
  getVariantDiscountBadge,
  variantDiscountBadgeUsesUpTo,
} from './product-pricing'
import type { ProductVariant } from './types'

function variant(partial: Partial<ProductVariant> & Pick<ProductVariant, 'basePrice' | 'priceTiers'>): ProductVariant {
  return {
    id: partial.id ?? 'v1',
    ean: null,
    sku: null,
    label: '',
    stock: partial.stock ?? 10,
    basePrice: partial.basePrice,
    priceTiers: partial.priceTiers,
    displayAttributes: [],
  }
}

describe('variantDiscountBadgeUsesUpTo', () => {
  it('false for qty-1 only sale', () => {
    const v = variant({
      basePrice: 100,
      priceTiers: [{ minQuantity: 1, pricePerUnit: 90 }],
    })
    assert.equal(variantDiscountBadgeUsesUpTo(v), false)
  })

  it('true when any qty>1 discounted tier exists', () => {
    const v = variant({
      basePrice: 100,
      priceTiers: [
        { minQuantity: 1, pricePerUnit: 100 },
        { minQuantity: 10, pricePerUnit: 95 },
        { minQuantity: 40, pricePerUnit: 90 },
      ],
    })
    assert.equal(variantDiscountBadgeUsesUpTo(v), true)
  })
})

describe('getPlantDiscountBadge', () => {
  it('exact −10% for single-unit sale only', () => {
    const badge = getPlantDiscountBadge({
      variants: [
        variant({
          basePrice: 100,
          priceTiers: [{ minQuantity: 1, pricePerUnit: 90 }],
        }),
      ],
    })
    assert.deepEqual(badge, { percent: 10, upTo: false })
  })

  it('до −10% for multi-tier (p9 shape)', () => {
    const badge = getPlantDiscountBadge({
      variants: [
        variant({
          basePrice: 100,
          priceTiers: [
            { minQuantity: 1, pricePerUnit: 100 },
            { minQuantity: 10, pricePerUnit: 95 },
            { minQuantity: 40, pricePerUnit: 90 },
          ],
        }),
      ],
    })
    assert.deepEqual(badge, { percent: 10, upTo: true })
  })

  it('до when only one bulk tier (no qty-1 discount)', () => {
    const badge = getPlantDiscountBadge({
      variants: [
        variant({
          basePrice: 50,
          priceTiers: [
            { minQuantity: 1, pricePerUnit: 50 },
            { minQuantity: 10, pricePerUnit: 45 },
          ],
        }),
      ],
    })
    assert.deepEqual(badge, { percent: 10, upTo: true })
  })

  it('null when no discount', () => {
    assert.equal(
      getPlantDiscountBadge({
        variants: [variant({ basePrice: 10, priceTiers: [{ minQuantity: 1, pricePerUnit: 10 }] })],
      }),
      null,
    )
  })
})

describe('getVariantDiscountBadge', () => {
  it('mirrors plant helper for one variant', () => {
    assert.deepEqual(
      getVariantDiscountBadge(
        variant({
          basePrice: 100,
          priceTiers: [
            { minQuantity: 1, pricePerUnit: 100 },
            { minQuantity: 10, pricePerUnit: 90 },
          ],
        }),
      ),
      { percent: 10, upTo: true },
    )
  })
})
