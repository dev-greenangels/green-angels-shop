import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildSitemapEntries, collectSitemapPathnames } from './sitemap-urls'

describe('buildSitemapEntries — host + overlay locales', () => {
  it('emits only overlay locales on .at (no leftover /sk/)', () => {
    const entries = buildSitemapEntries({
      origin: 'https://green-angels.at',
      availableLocales: ['de', 'en'],
      xDefaultLocale: 'de',
      pathnames: ['/echinacea/slug', '/201-echinacea'],
    })
    const urls = entries.map((row) => row.url)
    assert.ok(urls.includes('https://green-angels.at/de/echinacea/slug'))
    assert.ok(urls.includes('https://green-angels.at/en/echinacea/slug'))
    assert.equal(urls.some((url) => url.includes('/sk/')), false)
    assert.equal(urls.some((url) => url.includes('green-angels.sk')), false)
  })

  it('keeps UA Presta category and product paths', () => {
    const pathnames = collectSitemapPathnames({
      categoryPaths: ['/201-echinacea'],
      productPaths: ['/echinacea/3330-echinacea-sensation-wild-romance'],
      blogPaths: [],
    })
    const entries = buildSitemapEntries({
      origin: 'https://landshaft.info',
      availableLocales: ['uk', 'en'],
      xDefaultLocale: 'uk',
      pathnames,
    })
    const urls = entries.map((row) => row.url)
    assert.ok(urls.includes('https://landshaft.info/uk/201-echinacea'))
    assert.ok(
      urls.includes('https://landshaft.info/uk/echinacea/3330-echinacea-sensation-wild-romance'),
    )
  })

  it('does not emit query-string URLs', () => {
    const pathnames = collectSitemapPathnames({
      categoryPaths: ['/catalog?page=2'],
      productPaths: [],
      blogPaths: [],
    })
    assert.equal(pathnames.includes('/catalog?page=2'), false)
  })
})
