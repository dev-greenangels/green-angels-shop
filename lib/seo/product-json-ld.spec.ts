import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { DEFAULT_COMMERCE_SETTINGS } from '../commerce/defaults'
import type { CountrySiteOverlay } from '../country-sites/apply-overlay'
import { DEFAULT_MARKET_SETTINGS } from '../settings/market'
import { resolveSeoOffer } from './offer-context'
import { buildProductJsonLd, gtinFromEan } from './product-json-ld'
import { toProductSeoEntity } from './product-entity'
import type { Plant } from '../types'

const plant: Plant = {
  id: 'p1',
  name: 'Echinacea',
  latinName: 'Echinacea purpurea',
  slug: '3330-echinacea',
  category: 'echinacea',
  price: 10,
  sku: 'ECH-1',
  images: ['https://media.example/uploads/products/a.jpg'],
  description: '<p>Desc</p>',
  shortDescription: 'Short',
  stock: 3,
  height: '',
  sunRequirement: '',
  soilType: '',
  hardinessZone: '',
  wateringNeeds: '',
  createdAt: new Date().toISOString(),
  variants: [{ id: 'v1', label: 'C2', sku: 'ECH-1', ean: '', stock: 3, basePrice: 10, priceTiers: [] }],
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

describe('Product JSON-LD', () => {
  it('omits Offer when SK overlay/currency is missing', () => {
    const offer = resolveSeoOffer(10, {
      market: { ...DEFAULT_MARKET_SETTINGS, region: 'sk' },
      overlay: null,
      commerce: DEFAULT_COMMERCE_SETTINGS,
      cartTaxRatePercent: 0,
    })
    assert.equal(offer, null)
    const entity = toProductSeoEntity({
      plant,
      url: 'https://green-angels.sk/sk/echinacea/slug',
      locale: 'sk',
    })
    const json = buildProductJsonLd({ entity, offer: null })
    assert.ok(json)
    assert.equal('offers' in json!, false)
    assert.equal('aggregateRating' in json!, false)
  })

  it('converts HU shelf price with overlay rate and does not require GTIN', () => {
    const offer = resolveSeoOffer(10, {
      market: {
        ...DEFAULT_MARKET_SETTINGS,
        region: 'sk',
        priceBasis: 'inc_vat',
        storefrontPrimaryPrice: 'inc_vat',
      },
      overlay: huOverlay,
      commerce: DEFAULT_COMMERCE_SETTINGS,
      cartTaxRatePercent: 27,
    })
    assert.ok(offer)
    assert.equal(offer!.currency, 'HUF')
    assert.equal(offer!.price, 4000)
    assert.equal(gtinFromEan(''), null)
    const entity = toProductSeoEntity({
      plant,
      url: 'https://green-angels.hu/hu/echinacea/slug',
      locale: 'hu',
      brand: 'Green Angels',
      currency: offer!.currency,
    })
    const json = buildProductJsonLd({
      entity,
      offer: { price: offer!.price, currency: offer!.currency },
      gtin: gtinFromEan(plant.variants?.[0]?.ean),
    })
    const offers = json!.offers as Record<string, unknown>
    assert.equal(offers.priceCurrency, 'HUF')
    assert.equal(offers.price, 4000)
    assert.equal('gtin' in json!, false)
    assert.equal(json!.sku, 'ECH-1')
  })

  it('uses UA commerce currency for Offer', () => {
    const offer = resolveSeoOffer(10, {
      market: DEFAULT_MARKET_SETTINGS,
      overlay: null,
      commerce: DEFAULT_COMMERCE_SETTINGS,
      cartTaxRatePercent: 20,
    })
    assert.equal(offer?.currency, 'UAH')
    assert.equal(offer?.country, 'UA')
  })
})
