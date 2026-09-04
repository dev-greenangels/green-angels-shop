import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  parseVariantSkuQueryParam,
  resolveInitialVariantId,
} from '../catalog/variant-query'
import { DEFAULT_COMMERCE_SETTINGS } from '../commerce/defaults'
import { applyCountrySiteOverlay } from '../country-sites/apply-overlay'
import { resolveSeoOffer } from '../seo/offer-context'
import {
  DEFAULT_MARKET_SETTINGS,
  normalizeMarketSettings,
} from '../settings/market'

import {
  isMerchantProductEligible,
  isMerchantVariantEligible,
  merchantSku,
  stripHtmlToPlainText,
} from './eligibility'
import { merchantAbsoluteImageUrls } from './images'
import {
  MERCHANT_BRAND,
  MERCHANT_FEEDS,
  parseMerchantFeedParam,
  resolveMerchantFeedOrigin,
} from './feeds'
import {
  isMerchantFeedEnabledOnHost,
  merchantFeedsEnabledForHostname,
} from './host-feeds'
import {
  evaluateMerchantCatalog,
  evaluateMerchantVariant,
  merchantFeedHealth,
} from './evaluate'
import {
  buildMerchantDescription,
  buildMerchantTitle,
  buildMerchantVariantLink,
  formatMerchantPrice,
  mapProductToMerchantItems,
} from './map-item'
import type { MerchantCatalogProduct } from './types'
import { buildMerchantRssXml } from './xml'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

function baseProduct(
  overrides: Partial<MerchantCatalogProduct> = {},
): MerchantCatalogProduct {
  return {
    id: 'prod-1',
    slug: 'thuja-smaragd',
    name: 'Tuja západná Smaragd',
    latinName: "Thuja occidentalis 'Smaragd'",
    categorySlug: 'thuja',
    categoryName: 'Tuja',
    description: '<p>Popis &amp; text</p>',
    imageUrl: 'https://media.example/uploads/products/a/main.webp',
    images: [
      'https://media.example/uploads/products/a/main.webp',
      'https://media.example/uploads/products/a/2.webp',
    ],
    isPublished: true,
    variants: [
      {
        id: 'var-1',
        sku: 'GA-10001',
        label: 'C2 / 40–60 cm',
        stock: 5,
        price: 12.5,
        displayAttributes: [
          { name: 'Kontajner', displayValue: 'C2', valueType: 'CONTAINER' },
          { name: 'Výška', displayValue: '40–60 cm', valueType: 'RANGE' },
        ],
      },
      {
        id: 'var-2',
        sku: 'GA-10002',
        label: 'C5 / 80–100 cm',
        stock: 2,
        price: 29,
        displayAttributes: [
          { name: 'Kontajner', displayValue: 'C5', valueType: 'CONTAINER' },
          { name: 'Výška', displayValue: '80–100 cm', valueType: 'RANGE' },
        ],
      },
      {
        id: 'var-oos',
        sku: 'GA-OOS',
        label: 'C3',
        stock: 0,
        price: 18,
      },
    ],
    ...overrides,
  }
}

describe('merchant feed routing config', () => {
  it('maps feed codes to locale / host profile / GMC targets', () => {
    assert.equal(MERCHANT_FEEDS.sk.locale, 'sk')
    assert.equal(MERCHANT_FEEDS.cz.locale, 'cs')
    assert.equal(MERCHANT_FEEDS.de.locale, 'de')
    assert.equal(MERCHANT_FEEDS.hu.locale, 'hu')
    assert.deepEqual(MERCHANT_FEEDS.de.gmcTargets, ['AT', 'DE'])
  })

  it('parses sk.xml style route params', () => {
    assert.equal(parseMerchantFeedParam('sk.xml')?.code, 'sk')
    assert.equal(parseMerchantFeedParam('en.xml'), null)
  })

  it('resolves production origins when GA_COUNTRY_HOSTS is empty', () => {
    assert.equal(
      resolveMerchantFeedOrigin('sk', { countryHostsEnv: '', siteUrl: '' }),
      'https://green-angels.sk',
    )
  })
})

describe('merchant host enablement', () => {
  const hosts =
    'green-angels.sk:sk,www.green-angels.sk:sk,green-angels.at:at,www.green-angels.at:at,green-angels.hu:hu,www.green-angels.hu:hu'

  it('enables only SK+CZ on green-angels.sk', () => {
    assert.deepEqual(
      merchantFeedsEnabledForHostname('green-angels.sk', { countryHostsEnv: hosts }),
      ['sk', 'cz'],
    )
    assert.equal(
      isMerchantFeedEnabledOnHost('de', 'green-angels.sk', { countryHostsEnv: hosts }),
      false,
    )
    assert.equal(
      isMerchantFeedEnabledOnHost('hu', 'www.green-angels.sk', { countryHostsEnv: hosts }),
      false,
    )
  })

  it('enables only DE on green-angels.at', () => {
    assert.deepEqual(
      merchantFeedsEnabledForHostname('green-angels.at', { countryHostsEnv: hosts }),
      ['de'],
    )
    assert.equal(
      isMerchantFeedEnabledOnHost('sk', 'green-angels.at', { countryHostsEnv: hosts }),
      false,
    )
  })

  it('enables only HU on green-angels.hu', () => {
    assert.deepEqual(
      merchantFeedsEnabledForHostname('green-angels.hu', { countryHostsEnv: hosts }),
      ['hu'],
    )
  })

  it('allows all feeds on localhost / empty host map', () => {
    assert.deepEqual(
      merchantFeedsEnabledForHostname('localhost', { countryHostsEnv: hosts }),
      ['sk', 'cz', 'de', 'hu'],
    )
    assert.deepEqual(
      merchantFeedsEnabledForHostname('green-angels.sk', { countryHostsEnv: '' }),
      ['sk', 'cz', 'de', 'hu'],
    )
  })

  it('returns none for unknown production host when map is set', () => {
    assert.deepEqual(
      merchantFeedsEnabledForHostname('evil.example', { countryHostsEnv: hosts }),
      [],
    )
  })
})

describe('merchant eligibility', () => {
  it('requires SKU and excludes unpublished / missing image / oos', () => {
    assert.equal(isMerchantProductEligible(baseProduct()), true)
    assert.equal(isMerchantProductEligible(baseProduct({ isPublished: false })), false)
    assert.equal(
      isMerchantVariantEligible({ sku: null, stock: 5, basePrice: 10 }),
      false,
    )
    assert.equal(merchantSku({ sku: '  GA-1  ' }), 'GA-1')
    assert.equal(merchantSku({ sku: '   ' }), null)
    assert.equal(
      isMerchantProductEligible(
        baseProduct({
          variants: [{ id: 'x', sku: null, label: null, stock: 5, price: 10 }],
        }),
      ),
      false,
    )
  })
})

describe('merchant item mapping', () => {
  const market = normalizeMarketSettings({
    ...DEFAULT_MARKET_SETTINGS,
    region: 'sk',
    priceBasis: 'inc_vat',
    storefrontPrimaryPrice: 'inc_vat',
    applyDestinationVatB2c: false,
    eurToHufRate: 400,
  })

  it('emits SKU id/mpn, brand, no gtin, shared group, variant links', () => {
    const overlay = applyCountrySiteOverlay(market, 'sk')
    assert.ok(overlay)
    const { items, stats } = mapProductToMerchantItems({
      product: baseProduct(),
      feed: MERCHANT_FEEDS.sk,
      origin: 'https://green-angels.sk',
      resolveOffer: (stored) =>
        resolveSeoOffer(stored, {
          market,
          overlay,
          commerce: DEFAULT_COMMERCE_SETTINGS,
          cartTaxRatePercent: 23,
        }),
    })

    assert.equal(items.length, 2)
    assert.equal(items[0].id, 'GA-10001')
    assert.equal(items[0].mpn, 'GA-10001')
    assert.equal(items[1].id, 'GA-10002')
    assert.equal(items[1].mpn, 'GA-10002')
    assert.equal(items[0].brand, MERCHANT_BRAND)
    assert.equal(items[0].brand, 'Green Angels')
    assert.equal(items[0].itemGroupId, 'prod-1')
    assert.equal(items[1].itemGroupId, 'prod-1')
    assert.equal(
      items[0].link,
      'https://green-angels.sk/sk/thuja/thuja-smaragd?variant=GA-10001',
    )
    assert.equal(
      items[1].link,
      'https://green-angels.sk/sk/thuja/thuja-smaragd?variant=GA-10002',
    )
    assert.equal(stats.excludedMissingSku, 0)
  })

  it('excludes in-stock variants without SKU and counts them', () => {
    const overlay = applyCountrySiteOverlay(market, 'sk')
    assert.ok(overlay)
    const { items, stats } = mapProductToMerchantItems({
      product: baseProduct({
        variants: [
          { id: 'a', sku: 'GA-OK', label: 'C2', stock: 3, price: 10 },
          { id: 'b', sku: null, label: 'C3', stock: 4, price: 12 },
          { id: 'c', sku: '  ', label: 'C5', stock: 2, price: 15 },
        ],
      }),
      feed: MERCHANT_FEEDS.sk,
      origin: 'https://green-angels.sk',
      resolveOffer: (stored) =>
        resolveSeoOffer(stored, {
          market,
          overlay,
          commerce: DEFAULT_COMMERCE_SETTINGS,
          cartTaxRatePercent: 23,
        }),
    })
    assert.equal(items.length, 1)
    assert.equal(items[0].id, 'GA-OK')
    assert.equal(stats.excludedMissingSku, 2)
  })

  it('URL-encodes special SKU characters', () => {
    assert.equal(
      buildMerchantVariantLink({
        origin: 'https://green-angels.sk',
        locale: 'sk',
        categorySlug: 'thuja',
        productSlug: 'thuja-smaragd',
        sku: 'GA/10001 & x',
      }),
      'https://green-angels.sk/sk/thuja/thuja-smaragd?variant=GA%2F10001%20%26%20x',
    )
  })

  it('keeps localized domains for CZ/DE/HU', () => {
    const overlay = applyCountrySiteOverlay(market, 'at')
    assert.ok(overlay)
    const { items: deItems } = mapProductToMerchantItems({
      product: baseProduct(),
      feed: MERCHANT_FEEDS.de,
      origin: 'https://green-angels.at',
      resolveOffer: (stored) =>
        resolveSeoOffer(stored, {
          market,
          overlay,
          commerce: DEFAULT_COMMERCE_SETTINGS,
          cartTaxRatePercent: 20,
        }),
    })
    assert.match(deItems[0].link, /^https:\/\/green-angels\.at\/de\/.*\?variant=GA-10001$/)

    const huOverlay = applyCountrySiteOverlay(market, 'hu')
    assert.ok(huOverlay)
    const { items: huItems } = mapProductToMerchantItems({
      product: baseProduct(),
      feed: MERCHANT_FEEDS.hu,
      origin: 'https://green-angels.hu',
      resolveOffer: (stored) =>
        resolveSeoOffer(stored, {
          market,
          overlay: huOverlay,
          commerce: DEFAULT_COMMERCE_SETTINGS,
          cartTaxRatePercent: 27,
        }),
    })
    assert.match(huItems[0].link, /^https:\/\/green-angels\.hu\/hu\/.*\?variant=GA-10001$/)
    assert.equal(huItems[0].price, '5000 HUF')

    const skOverlay = applyCountrySiteOverlay(market, 'sk')
    assert.ok(skOverlay)
    const { items: czItems } = mapProductToMerchantItems({
      product: baseProduct(),
      feed: MERCHANT_FEEDS.cz,
      origin: 'https://green-angels.sk',
      resolveOffer: (stored) =>
        resolveSeoOffer(stored, {
          market,
          overlay: skOverlay,
          commerce: DEFAULT_COMMERCE_SETTINGS,
          cartTaxRatePercent: 23,
        }),
    })
    assert.match(czItems[0].link, /^https:\/\/green-angels\.sk\/cs\/.*\?variant=GA-10001$/)
  })

  it('builds titles and descriptions with diacritics and HTML stripped', () => {
    assert.match(
      buildMerchantTitle({
        name: 'Tuja západná',
        latinName: "Thuja occidentalis 'Smaragd'",
        variantLabel: 'C2',
      }),
      /Tuja západná/,
    )
    assert.equal(
      buildMerchantDescription({
        descriptionHtml: '<p>Krásna &amp; zelená</p>',
        name: 'Tuja',
      }),
      'Krásna & zelená',
    )
    assert.equal(stripHtmlToPlainText('<b>A &amp; B</b>'), 'A & B')
  })

  it('absolutizes /uploads paths with site URL for Merchant images', () => {
    assert.deepEqual(
      merchantAbsoluteImageUrls(['/uploads/products/a/main.webp'], {
        siteUrl: 'http://localhost:3000',
      }),
      ['http://localhost:3000/uploads/products/a/main.webp'],
    )
    assert.deepEqual(
      merchantAbsoluteImageUrls(['/uploads/products/a/main.webp'], { siteUrl: '' }),
      [],
    )
  })
})

describe('PDP variant query preselection', () => {
  const variants = [
    { id: 'v1', sku: 'GA-10001' },
    { id: 'v2', sku: 'GA-10002' },
  ]

  it('selects matching SKU and falls back on invalid', () => {
    assert.equal(parseVariantSkuQueryParam('GA-10002'), 'GA-10002')
    assert.equal(parseVariantSkuQueryParam('GA%2F10001'), 'GA/10001')
    assert.equal(parseVariantSkuQueryParam(''), null)
    assert.equal(parseVariantSkuQueryParam(undefined), null)
    assert.equal(
      resolveInitialVariantId({ variants, preferredSku: 'GA-10002' }),
      'v2',
    )
    assert.equal(
      resolveInitialVariantId({ variants, preferredSku: 'UNKNOWN' }),
      'v1',
    )
    assert.equal(resolveInitialVariantId({ variants, preferredSku: null }), 'v1')
  })
})

describe('merchant XML', () => {
  it('emits mpn and brand, omits gtin and identifier_exists', () => {
    const xml = buildMerchantRssXml({
      title: 'Feed & Co',
      link: 'https://green-angels.sk/feeds/google/sk.xml',
      description: 'Test',
      items: [
        {
          id: 'GA/10001 & x',
          mpn: 'GA/10001 & x',
          itemGroupId: 'g1',
          title: 'Tuja & "Smaragd"',
          description: 'Popis <b>HTML</b> & text áéí',
          link: 'https://green-angels.sk/sk/a/b?variant=GA%2F10001%20%26%20x',
          imageLink: 'https://media.example/a.webp',
          additionalImageLinks: [],
          availability: 'in_stock',
          price: '10.00 EUR',
          condition: 'new',
          brand: 'Green Angels',
          googleProductCategory: '985',
          productType: 'Tuja',
          variantOptions: [{ name: 'Kontajner', value: 'C2' }],
        },
      ],
    })

    assert.match(xml, /<g:id>GA\/10001 &amp; x<\/g:id>/)
    assert.match(xml, /<g:mpn>GA\/10001 &amp; x<\/g:mpn>/)
    assert.match(xml, /<g:brand>Green Angels<\/g:brand>/)
    assert.equal(xml.includes('g:gtin'), false)
    assert.equal(xml.includes('identifier_exists'), false)
    assert.match(xml, /Tuja &amp; &quot;Smaragd&quot;/)
  })

  it('formats price helper', () => {
    assert.equal(formatMerchantPrice({ price: 12.5, currency: 'EUR', country: 'SK' }), '12.50 EUR')
  })
})

describe('shared merchant diagnostics evaluator', () => {
  it('excludes known variant with correct reason and matches item count', () => {
    const product = baseProduct({
      variants: [
        { id: 'ok', sku: 'GA-OK', label: 'C2', stock: 3, price: 10 },
        { id: 'nosku', sku: null, label: 'C3', stock: 4, price: 12 },
        { id: 'oos', sku: 'GA-OOS', label: 'C5', stock: 0, price: 15 },
      ],
    })
    const evalResult = evaluateMerchantCatalog([product], {
      siteUrl: 'https://green-angels.sk',
      resolveOffer: (stored) => ({ price: stored, currency: 'EUR', country: 'SK' }),
    })
    assert.equal(evalResult.counters.included, 1)
    assert.equal(evalResult.counters.excludedMissingSku, 1)
    assert.equal(evalResult.counters.excludedStockLe0, 1)

    const missingSku = evaluateMerchantVariant(product, product.variants[1], {
      siteUrl: 'https://green-angels.sk',
      resolveOffer: (stored) => ({ price: stored, currency: 'EUR', country: 'SK' }),
    })
    assert.equal(missingSku.decision, 'excluded')
    assert.equal(missingSku.reason, 'missing_sku')

    const { items, stats } = mapProductToMerchantItems({
      product,
      feed: MERCHANT_FEEDS.sk,
      origin: 'https://green-angels.sk',
      siteUrl: 'https://green-angels.sk',
      resolveOffer: (stored) => ({ price: stored, currency: 'EUR', country: 'SK' }),
    })
    assert.equal(items.length, evalResult.counters.included)
    assert.equal(items.length, stats.included)
    assert.equal(merchantFeedHealth(1, 2), 'WARN')
    assert.equal(merchantFeedHealth(0, 2), 'ERROR')
    assert.equal(merchantFeedHealth(2, 0), 'OK')
  })

  it('diagnostics BFF route requires Backoffice session', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const routeSrc = readFileSync(
      join(here, '../../app/api/backstage/google-merchant/route.ts'),
      'utf8',
    )
    assert.match(routeSrc, /requireBackstageSession/)
    assert.match(routeSrc, /if \(error\) return error/)
    assert.equal(routeSrc.includes('debug=1'), false)
  })
})
