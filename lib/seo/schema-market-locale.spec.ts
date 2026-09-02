import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { DEFAULT_COMMERCE_SETTINGS } from '../commerce/defaults'
import type { CountrySiteOverlay } from '../country-sites/apply-overlay'
import { DEFAULT_MARKET_SETTINGS } from '../settings/market'
import { buildProductStructuredData } from './build-product-structured-data'
import type { Plant } from '../types'

const basePlant: Plant = {
  id: 'p1',
  name: 'Thuja Smaragd',
  latinName: 'Thuja',
  slug: 'thuja-smaragd',
  category: 'thuja',
  price: 10,
  sku: 'THU-PARENT',
  images: ['https://media.example/uploads/products/a.jpg'],
  description: 'Desc',
  shortDescription: 'Short',
  stock: 5,
  height: '',
  sunRequirement: '',
  soilType: '',
  hardinessZone: '',
  wateringNeeds: '',
  createdAt: new Date().toISOString(),
  variants: [
    {
      id: 'v1',
      label: 'C2',
      sku: 'THU-C2',
      ean: '',
      stock: 5,
      basePrice: 10,
      priceTiers: [],
    },
  ],
}

const skOverlay: CountrySiteOverlay = {
  countryCode: 'sk',
  currency: 'EUR',
  eurToHufRate: 400,
  taxRatePercent: 23,
  taxIncluded: true,
  availableLocales: ['sk', 'en', 'cs'],
  defaultLocale: 'sk',
} as CountrySiteOverlay

const huOverlay: CountrySiteOverlay = {
  countryCode: 'hu',
  currency: 'HUF',
  eurToHufRate: 400,
  taxRatePercent: 27,
  taxIncluded: true,
  availableLocales: ['hu', 'en'],
  defaultLocale: 'hu',
} as CountrySiteOverlay

describe('Schema.org market vs locale', () => {
  it('same English content on .sk/en vs .hu/en uses different market Offers', () => {
    const skJson = buildProductStructuredData({
      plant: basePlant,
      productUrl: 'https://green-angels.sk/en/thuja/thuja-smaragd',
      locale: 'en',
      brand: 'Green Angels',
      ctx: {
        market: { ...DEFAULT_MARKET_SETTINGS, region: 'sk' },
        overlay: skOverlay,
        commerce: DEFAULT_COMMERCE_SETTINGS,
        cartTaxRatePercent: 23,
      },
    })
    const huJson = buildProductStructuredData({
      plant: basePlant,
      productUrl: 'https://green-angels.hu/en/thuja/thuja-smaragd',
      locale: 'en',
      brand: 'Green Angels',
      ctx: {
        market: { ...DEFAULT_MARKET_SETTINGS, region: 'sk' },
        overlay: huOverlay,
        commerce: DEFAULT_COMMERCE_SETTINGS,
        cartTaxRatePercent: 27,
      },
    })

    assert.equal(skJson?.name, 'Thuja Smaragd')
    assert.equal(huJson?.name, 'Thuja Smaragd')
    assert.equal(skJson?.url, 'https://green-angels.sk/en/thuja/thuja-smaragd')
    assert.equal(huJson?.url, 'https://green-angels.hu/en/thuja/thuja-smaragd')

    const skOffer = skJson?.offers as Record<string, unknown>
    const huOffer = huJson?.offers as Record<string, unknown>
    assert.equal(skOffer.priceCurrency, 'EUR')
    assert.equal(huOffer.priceCurrency, 'HUF')
    assert.equal(skOffer.price, 10)
    assert.equal(huOffer.price, 4000)
  })
})
