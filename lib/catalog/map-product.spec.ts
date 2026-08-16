import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { mapListItemToPlant } from './map-product'
import type { CatalogProductListItem } from './types'

function listItem(overrides: Partial<CatalogProductListItem> = {}): CatalogProductListItem {
  return {
    id: 'id-alpha',
    slug: 'alpha',
    name: 'CS alpha',
    latinName: null,
    categoryId: 'cat',
    categorySlug: 'plants',
    categoryName: 'Plants',
    price: 199,
    stock: 7,
    imageUrl: '/uploads/alpha/main.webp',
    pricingMode: 'simple',
    variants: [
      {
        id: 'v-alpha',
        sku: 'sku-alpha',
        ean: null,
        stock: 7,
        price: 199,
        label: 'C2',
        availableFrom: null,
        quantityPrices: [],
      },
    ],
    characteristics: {},
    createdAt: '2026-01-02T00:00:00.000Z',
    maxDiscountPercent: 33,
    ...overrides,
  }
}

describe('mapListItemToPlant — homepage card payload', () => {
  it('keeps price, stock, discount and uses thumb.webp', () => {
    const plant = mapListItemToPlant(listItem())
    assert.equal(plant.price, 199)
    assert.equal(plant.stock, 7)
    assert.equal(plant.maxDiscountPercent, 33)
    assert.equal(plant.variants[0]?.basePrice, 199)
    assert.equal(plant.variants[0]?.stock, 7)
    assert.equal(plant.images[0], '/uploads/alpha/thumb.webp')
  })
})
