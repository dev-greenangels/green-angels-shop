import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildPageAlternates } from './page-alternates'
import { resolvePublicOrigin } from './public-origin'

const SK_HOSTS = 'green-angels.sk:sk,www.green-angels.sk:sk,green-angels.at:at,green-angels.hu:hu'
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

describe('buildPageAlternates — self canonical + intra-host hreflang', () => {
  it('does not canonicalize /cs to /sk', () => {
    const alt = buildPageAlternates({
      origin: 'https://green-angels.sk',
      locale: 'cs',
      pathname: '/echinacea/3330-echinacea-sensation-wild-romance',
      availableLocales: ['sk', 'cs', 'en'],
      xDefaultLocale: 'sk',
    })
    assert.ok(alt)
    assert.equal(
      alt.canonical,
      'https://green-angels.sk/cs/echinacea/3330-echinacea-sensation-wild-romance',
    )
    assert.equal(
      alt.languages.sk,
      'https://green-angels.sk/sk/echinacea/3330-echinacea-sensation-wild-romance',
    )
    assert.equal(alt.languages['x-default'], alt.languages.sk)
    assert.equal(alt.languages.hu, undefined)
    assert.equal(alt.languages.de, undefined)
  })

  it('keeps .at host for de pages', () => {
    const alt = buildPageAlternates({
      origin: 'https://green-angels.at',
      locale: 'de',
      pathname: '/echinacea/slug',
      availableLocales: ['de', 'en'],
      xDefaultLocale: 'de',
    })
    assert.ok(alt)
    assert.equal(alt.canonical, 'https://green-angels.at/de/echinacea/slug')
    assert.ok(Object.values(alt.languages).every((url) => url.startsWith('https://green-angels.at/')))
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
