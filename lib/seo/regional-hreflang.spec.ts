import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { DEFAULT_COUNTRY_SITES } from '../settings/market'
import { collectCountryPublicOrigins } from './market-hosts'
import { buildSkRegionalAlternates, regionalHreflang } from './regional-hreflang'

const SK_HOSTS =
  'green-angels.sk:sk,www.green-angels.sk:sk,green-angels.at:at,www.green-angels.at:at,green-angels.hu:hu,www.green-angels.hu:hu'

describe('regionalHreflang', () => {
  it('maps market + locale to regional tokens', () => {
    assert.equal(regionalHreflang('sk', 'en'), 'en-SK')
    assert.equal(regionalHreflang('at', 'en'), 'en-AT')
    assert.equal(regionalHreflang('hu', 'en'), 'en-HU')
    assert.equal(regionalHreflang('sk', 'cs'), 'cs-SK')
    assert.equal(regionalHreflang('at', 'de'), 'de-AT')
    assert.equal(regionalHreflang('hu', 'hu'), 'hu-HU')
  })
})

describe('collectCountryPublicOrigins', () => {
  it('prefers apex host per country', () => {
    const origins = collectCountryPublicOrigins({
      countryHostsEnv: SK_HOSTS,
      siteUrl: 'https://green-angels.sk',
    })
    assert.equal(origins.get('sk'), 'https://green-angels.sk')
    assert.equal(origins.get('at'), 'https://green-angels.at')
    assert.equal(origins.get('hu'), 'https://green-angels.hu')
  })
})

describe('buildSkRegionalAlternates', () => {
  const path = '/thuja/thuja-smaragd'

  it('self-canonical for .sk/en and full reciprocal cluster including en-AT/en-HU', () => {
    const alt = buildSkRegionalAlternates({
      origin: 'https://green-angels.sk',
      locale: 'en',
      pathname: path,
      countryCode: 'sk',
      enabledCountrySites: DEFAULT_COUNTRY_SITES,
      countryHostsEnv: SK_HOSTS,
      siteUrl: 'https://green-angels.sk',
    })
    assert.ok(alt)
    assert.equal(alt.canonical, `https://green-angels.sk/en${path}`)
    assert.equal(alt.languages['en-SK'], alt.canonical)
    assert.equal(alt.languages['en-AT'], `https://green-angels.at/en${path}`)
    assert.equal(alt.languages['en-HU'], `https://green-angels.hu/en${path}`)
    assert.equal(alt.languages['sk-SK'], `https://green-angels.sk/sk${path}`)
    assert.equal(alt.languages['de-AT'], `https://green-angels.at/de${path}`)
    assert.equal(alt.languages['hu-HU'], `https://green-angels.hu/hu${path}`)
    assert.equal(alt.languages['x-default'], undefined)
  })

  it('self-canonical for .at/en with same English cluster', () => {
    const alt = buildSkRegionalAlternates({
      origin: 'https://green-angels.at',
      locale: 'en',
      pathname: path,
      countryCode: 'at',
      enabledCountrySites: DEFAULT_COUNTRY_SITES,
      countryHostsEnv: SK_HOSTS,
    })
    assert.ok(alt)
    assert.equal(alt.canonical, `https://green-angels.at/en${path}`)
    assert.equal(alt.languages['en-AT'], alt.canonical)
    assert.equal(alt.languages['en-SK'], `https://green-angels.sk/en${path}`)
    assert.equal(alt.languages['en-HU'], `https://green-angels.hu/en${path}`)
  })

  it('does not emit cs on .at or .hu hosts', () => {
    const alt = buildSkRegionalAlternates({
      origin: 'https://green-angels.at',
      locale: 'de',
      pathname: path,
      countryCode: 'at',
      enabledCountrySites: DEFAULT_COUNTRY_SITES,
      countryHostsEnv: SK_HOSTS,
    })
    assert.equal(alt?.languages['cs-SK'], `https://green-angels.sk/cs${path}`)
    assert.equal(alt?.languages['cs-AT'], undefined)
    assert.equal(alt?.languages.cs, undefined)
  })
})
