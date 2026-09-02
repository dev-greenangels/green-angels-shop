import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { DEFAULT_COMMERCE_SETTINGS } from '../commerce/defaults'
import type { CountrySiteOverlay } from '../country-sites/apply-overlay'
import { DEFAULT_MARKET_SETTINGS } from '../settings/market'
import { buildProductStructuredData } from './build-product-structured-data'
import { resolveSeoOffer } from './offer-context'
import { buildProductJsonLd, gtinFromEan, gtinSchemaFields } from './product-json-ld'
import { toProductSeoEntity } from './product-entity'
import type { Plant } from '../types'

const basePlant: Plant = {
  id: 'p1',
  name: 'Thuja occidentalis Smaragd',
  latinName: 'Thuja occidentalis',
  slug: 'thuja-smaragd',
  category: 'thuja',
  price: 10,
  sku: 'THU-PARENT',
  images: ['https://media.example/uploads/products/a.jpg'],
  description: '<p>Desc</p>',
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
      label: 'C2 H40-50',
      sku: 'THU-C2',
      ean: '5901234123457',
      stock: 3,
      basePrice: 10,
      priceTiers: [],
      displayAttributes: [
        {
          id: 'a1',
          slug: 'container',
          name: 'Container',
          icon: null,
          unit: null,
          valueType: 'CONTAINER',
          displayValue: 'C2',
          sortOrder: 0,
        },
        {
          id: 'a2',
          slug: 'height',
          name: 'Height',
          icon: null,
          unit: 'cm',
          valueType: 'RANGE',
          displayValue: 'H40-50',
          sortOrder: 1,
        },
      ],
    },
    {
      id: 'v2',
      label: 'C5 H80-100',
      sku: 'THU-C5',
      ean: '',
      stock: 2,
      basePrice: 25,
      priceTiers: [],
      displayAttributes: [
        {
          id: 'a1',
          slug: 'container',
          name: 'Container',
          icon: null,
          unit: null,
          valueType: 'CONTAINER',
          displayValue: 'C5',
          sortOrder: 0,
        },
        {
          id: 'a2',
          slug: 'height',
          name: 'Height',
          icon: null,
          unit: 'cm',
          valueType: 'RANGE',
          displayValue: 'H80-100',
          sortOrder: 1,
        },
      ],
    },
    {
      id: 'v3',
      label: 'C10 H120-140',
      sku: 'THU-C10',
      ean: '',
      stock: 0,
      availableFrom: '25.05.2026',
      basePrice: 40,
      priceTiers: [],
      displayAttributes: [
        {
          id: 'a1',
          slug: 'container',
          name: 'Container',
          icon: null,
          unit: null,
          valueType: 'CONTAINER',
          displayValue: 'C10',
          sortOrder: 0,
        },
        {
          id: 'a2',
          slug: 'height',
          name: 'Height',
          icon: null,
          unit: 'cm',
          valueType: 'RANGE',
          displayValue: 'H120-140',
          sortOrder: 1,
        },
      ],
    },
  ],
}

const uaCtx = {
  market: DEFAULT_MARKET_SETTINGS,
  overlay: null,
  commerce: DEFAULT_COMMERCE_SETTINGS,
  cartTaxRatePercent: 20,
}

const huOverlay = {
  countryCode: 'hu',
  currency: 'HUF',
  eurToHufRate: 400,
  taxRatePercent: 27,
  taxIncluded: true,
  availableLocales: ['hu', 'en'],
  defaultLocale: 'hu',
} as CountrySiteOverlay

describe('gtinSchemaFields', () => {
  it('maps EAN length to the correct GTIN property', () => {
    assert.deepEqual(gtinSchemaFields('5901234123457'), { gtin13: '5901234123457' })
    assert.equal(gtinSchemaFields(''), null)
  })
})

describe('Product JSON-LD — single variant', () => {
  it('omits Offer when SK overlay/currency is missing', () => {
    const offer = resolveSeoOffer(10, {
      market: { ...DEFAULT_MARKET_SETTINGS, region: 'sk' },
      overlay: null,
      commerce: DEFAULT_COMMERCE_SETTINGS,
      cartTaxRatePercent: 0,
    })
    assert.equal(offer, null)
    const entity = toProductSeoEntity({
      plant: { ...basePlant, variants: basePlant.variants!.slice(0, 1) },
      url: 'https://green-angels.sk/sk/thuja/slug',
      locale: 'sk',
    })
    const json = buildProductJsonLd({ entity, offer: null })
    assert.ok(json)
    assert.equal('offers' in json!, false)
  })

  it('uses UA commerce currency for single-variant Offer', () => {
    const plant = { ...basePlant, variants: basePlant.variants!.slice(0, 1) }
    const json = buildProductStructuredData({
      plant,
      productUrl: 'https://landshaft.info/uk/thuja/slug',
      locale: 'uk',
      brand: 'Green Angels',
      ctx: uaCtx,
    })
    assert.equal(json!['@type'], 'Product')
    const offers = json!.offers as Record<string, unknown>
    assert.equal(offers['@type'], 'Offer')
    assert.equal(offers.priceCurrency, 'UAH')
    assert.equal(offers.price, 10)
    assert.equal(json!.gtin13, '5901234123457')
  })
})

describe('ProductGroup JSON-LD — multi-variant', () => {
  it('emits ProductGroup with per-variant Offer and variesBy size', () => {
    const json = buildProductStructuredData({
      plant: basePlant,
      productUrl: 'https://landshaft.info/uk/thuja/thuja-smaragd',
      locale: 'uk',
      brand: 'Green Angels',
      ctx: uaCtx,
    })
    assert.equal(json!['@type'], 'ProductGroup')
    assert.equal(json!.productGroupID, 'THU-PARENT')
    assert.deepEqual(json!.variesBy, ['https://schema.org/size'])
    const variants = json!.hasVariant as Array<Record<string, unknown>>
    assert.equal(variants.length, 3)

    const inStock = variants[0]
    assert.equal(inStock['@type'], 'Product')
    assert.equal(inStock.sku, 'THU-C2')
    const offer1 = inStock.offers as Record<string, unknown>
    assert.equal(offer1.price, 10)
    assert.equal(offer1.availability, 'https://schema.org/InStock')

    const preorder = variants[2]
    const offer3 = preorder.offers as Record<string, unknown>
    assert.equal(offer3.price, 40)
    assert.equal(offer3.availability, 'https://schema.org/PreOrder')

    const noGtin = variants[1]
    assert.equal('gtin' in noGtin, false)
    assert.equal('gtin13' in noGtin, false)
  })

  it('converts HU shelf prices per variant with overlay', () => {
    const json = buildProductStructuredData({
      plant: basePlant,
      productUrl: 'https://green-angels.hu/hu/thuja/thuja-smaragd',
      locale: 'hu',
      brand: 'Green Angels',
      ctx: {
        market: {
          ...DEFAULT_MARKET_SETTINGS,
          region: 'sk',
          priceBasis: 'inc_vat',
          storefrontPrimaryPrice: 'inc_vat',
        },
        overlay: huOverlay,
        commerce: DEFAULT_COMMERCE_SETTINGS,
        cartTaxRatePercent: 27,
      },
    })
    const variants = json!.hasVariant as Array<Record<string, unknown>>
    const offer = variants[1].offers as Record<string, unknown>
    assert.equal(offer.priceCurrency, 'HUF')
    assert.equal(offer.price, 10000)
  })

  it('omits variant offers on SK when overlay is missing', () => {
    const json = buildProductStructuredData({
      plant: basePlant,
      productUrl: 'https://green-angels.sk/sk/thuja/thuja-smaragd',
      locale: 'sk',
      brand: 'Green Angels',
      ctx: {
        market: { ...DEFAULT_MARKET_SETTINGS, region: 'sk' },
        overlay: null,
        commerce: DEFAULT_COMMERCE_SETTINGS,
        cartTaxRatePercent: 0,
      },
    })
    assert.equal(json!['@type'], 'ProductGroup')
    const variants = json!.hasVariant as Array<Record<string, unknown>>
    assert.equal('offers' in variants[0], false)
  })
})
