import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resolvePublicSupportEmail } from './public-support-email'
import type { MarketSettings } from '@/lib/settings/market'
import type { StoreContactSettings } from '@/lib/settings/types'

const baseStore = {
  emails: [
    { label: 'Support', email: 'info@green-angels.sk' },
    { label: 'Wholesale', email: 'opt@green-angels.sk' },
  ],
} as Pick<StoreContactSettings, 'emails'>

const skMarket = {
  region: 'sk',
  countrySites: [
    { code: 'sk', enabled: true, supportEmail: 'info@green-angels.sk', supportPhone: null, currencyCode: 'EUR', defaultLocale: 'sk', availableLocales: ['sk'], showLanguageSwitcher: true },
    { code: 'hu', enabled: true, supportEmail: 'info@green-angels.hu', supportPhone: null, currencyCode: 'HUF', defaultLocale: 'hu', availableLocales: ['hu'], showLanguageSwitcher: true },
    { code: 'at', enabled: true, supportEmail: 'info@green-angels.at', supportPhone: null, currencyCode: 'EUR', defaultLocale: 'de', availableLocales: ['de'], showLanguageSwitcher: true },
  ],
} as unknown as Pick<MarketSettings, 'region' | 'countrySites'>

describe('resolvePublicSupportEmail', () => {
  it('prefers country-site email over store base', () => {
    assert.equal(
      resolvePublicSupportEmail({
        store: baseStore,
        market: skMarket,
        countrySiteCode: 'hu',
      }),
      'info@green-angels.hu',
    )
    assert.equal(
      resolvePublicSupportEmail({
        store: baseStore,
        market: skMarket,
        countrySiteCode: 'at',
      }),
      'info@green-angels.at',
    )
  })

  it('falls back to store labeled email when site email empty / UA', () => {
    assert.equal(
      resolvePublicSupportEmail({
        store: baseStore,
        market: { region: 'ua', countrySites: [] },
        countrySiteCode: null,
      }),
      'info@green-angels.sk',
    )
  })
})
