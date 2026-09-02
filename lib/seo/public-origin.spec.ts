import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { DEFAULT_COUNTRY_SITES } from '../settings/market'
import { buildPageAlternates } from './page-alternates'
import { resolvePublicOrigin } from './public-origin'

const SK_HOSTS =
  'green-angels.sk:sk,www.green-angels.sk:sk,green-angels.at:at,www.green-angels.at:at,green-angels.hu:hu,www.green-angels.hu:hu'
const SK_SITE = 'https://green-angels.sk'

describe('resolvePublicOrigin — allowlist', () => {
  it('uses request host when it is in GA_COUNTRY_HOSTS', () => {
    const result = resolvePublicOrigin({
      requestHost: 'green-angels.at',
      requestProto: 'https',
      countryHostsEnv: SK_HOSTS,
      siteUrl: SK_SITE,
      nodeEnv: 'production',
    })
    assert.equal(result.origin, 'https://green-angels.at')
    assert.equal(result.usedFallback, false)
  })

  it('does not honor Host: evil.example', () => {
    const result = resolvePublicOrigin({
      requestHost: 'evil.example',
      requestProto: 'https',
      countryHostsEnv: SK_HOSTS,
      siteUrl: SK_SITE,
      nodeEnv: 'production',
    })
    assert.equal(result.origin, 'https://green-angels.sk')
    assert.equal(result.usedFallback, true)
  })

  it('UA SITE_URL allows landshaft.info and keeps Presta path host', () => {
    const result = resolvePublicOrigin({
      requestHost: 'landshaft.info',
      requestProto: 'https',
      countryHostsEnv: '',
      siteUrl: 'https://landshaft.info',
      nodeEnv: 'production',
    })
    assert.equal(result.origin, 'https://landshaft.info')
  })

  it('does not emit localhost in production when SITE_URL is missing', () => {
    const result = resolvePublicOrigin({
      requestHost: 'localhost:3000',
      requestProto: 'http',
      countryHostsEnv: '',
      siteUrl: '',
      nodeEnv: 'production',
    })
    assert.equal(result.origin, '')
  })
})

describe('buildPageAlternates — self canonical + hreflang', () => {
  it('SK deploy uses regional cross-host hreflang for /cs (self-canonical on .sk/cs)', () => {
    const alt = buildPageAlternates({
      origin: 'https://green-angels.sk',
      locale: 'cs',
      pathname: '/echinacea/3330-echinacea-sensation-wild-romance',
      availableLocales: ['sk', 'cs', 'en'],
      xDefaultLocale: 'sk',
      marketRegion: 'sk',
      countryCode: 'sk',
      enabledCountrySites: DEFAULT_COUNTRY_SITES,
      countryHostsEnv: SK_HOSTS,
      siteUrl: SK_SITE,
    })
    assert.ok(alt)
    assert.equal(
      alt.canonical,
      'https://green-angels.sk/cs/echinacea/3330-echinacea-sensation-wild-romance',
    )
    assert.equal(alt.languages['cs-SK'], alt.canonical)
    assert.equal(
      alt.languages['en-AT'],
      'https://green-angels.at/en/echinacea/3330-echinacea-sensation-wild-romance',
    )
    assert.equal(alt.languages['x-default'], undefined)
  })

  it('keeps .at/de self-canonical with regional cluster', () => {
    const alt = buildPageAlternates({
      origin: 'https://green-angels.at',
      locale: 'de',
      pathname: '/echinacea/slug',
      availableLocales: ['de', 'en'],
      xDefaultLocale: 'de',
      marketRegion: 'sk',
      countryCode: 'at',
      enabledCountrySites: DEFAULT_COUNTRY_SITES,
      countryHostsEnv: SK_HOSTS,
    })
    assert.ok(alt)
    assert.equal(alt.canonical, 'https://green-angels.at/de/echinacea/slug')
    assert.equal(alt.languages['de-AT'], alt.canonical)
    assert.ok(alt.languages['en-SK']?.startsWith('https://green-angels.sk/en/'))
    assert.ok(alt.languages['en-HU']?.startsWith('https://green-angels.hu/en/'))
  })

  it('preserves UA Presta category/product paths', () => {
    const category = buildPageAlternates({
      origin: 'https://landshaft.info',
      locale: 'uk',
      pathname: '/201-echinacea',
      availableLocales: ['uk', 'en'],
      xDefaultLocale: 'uk',
    })
    const product = buildPageAlternates({
      origin: 'https://landshaft.info',
      locale: 'uk',
      pathname: '/echinacea/3330-echinacea-sensation-wild-romance',
      availableLocales: ['uk', 'en'],
      xDefaultLocale: 'uk',
    })
    assert.equal(category?.canonical, 'https://landshaft.info/uk/201-echinacea')
    assert.equal(
      product?.canonical,
      'https://landshaft.info/uk/echinacea/3330-echinacea-sensation-wild-romance',
    )
  })
})
