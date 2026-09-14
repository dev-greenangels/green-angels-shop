import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  formatHeroDeliveryCountryList,
  resolveHeroDeliveryCountryCodes,
} from '@/lib/home/hero-delivery-label'
import {
  DEFAULT_MARKET_SETTINGS,
  normalizeMarketSettings,
  type MarketSettings,
} from '@/lib/settings/market'

const skMarket = normalizeMarketSettings({
  ...DEFAULT_MARKET_SETTINGS,
  region: 'sk',
  defaultCurrency: 'EUR',
  domainDeliveryCountries: {
    ...DEFAULT_MARKET_SETTINGS.domainDeliveryCountries,
    sk: ['sk', 'cz', 'at'],
  },
})

describe('resolveHeroDeliveryCountryCodes', () => {
  it('returns ua for UA market', () => {
    assert.deepEqual(
      resolveHeroDeliveryCountryCodes(
        { ...DEFAULT_MARKET_SETTINGS, region: 'ua' } as MarketSettings,
        'sk',
      ),
      ['ua'],
    )
  })

  it('returns all enabled countries allowed for the host', () => {
    assert.deepEqual(resolveHeroDeliveryCountryCodes(skMarket, 'sk'), ['sk', 'cz', 'at'])
  })

  it('returns empty when host is missing', () => {
    assert.deepEqual(resolveHeroDeliveryCountryCodes(skMarket, null), [])
  })
})

describe('formatHeroDeliveryCountryList', () => {
  it('returns single name unchanged', () => {
    assert.equal(formatHeroDeliveryCountryList(['Slowakei'], 'de'), 'Slowakei')
  })

  it('joins with locale conjunction', () => {
    const de = formatHeroDeliveryCountryList(['Slowakei', 'Tschechien'], 'de')
    assert.match(de, /Slowakei/)
    assert.match(de, /Tschechien/)
    assert.ok(de.includes(' und ') || de.includes(', '))
  })
})
