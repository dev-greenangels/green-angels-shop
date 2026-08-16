import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { SHOP_PROXY_MATCHERS, shouldRunShopProxy } from './proxy-html-matcher'

describe('shouldRunShopProxy — Presta .html/.php vs assets', () => {
  it('runs for locale-prefixed Presta .html and .php', () => {
    assert.equal(shouldRunShopProxy('/uk/old-product.html'), true)
    assert.equal(shouldRunShopProxy('/uk/old-category.html'), true)
    assert.equal(shouldRunShopProxy('/uk/old-page.php'), true)
    assert.equal(shouldRunShopProxy('/sk/old-page.html'), true)
    assert.equal(shouldRunShopProxy('/uk/echinacea/3330-echinacea-sensation-wild-romance.html'), true)
    assert.equal(shouldRunShopProxy('/uk/201-echinacea.html'), true)
    assert.equal(shouldRunShopProxy('/201-echinacea.html'), true)
    assert.equal(shouldRunShopProxy('/index.php'), true)
  })

  it('runs for normal locale catalog routes (no file extension)', () => {
    assert.equal(shouldRunShopProxy('/uk/echinacea'), true)
    assert.equal(shouldRunShopProxy('/sk/echinacea'), true)
    assert.equal(shouldRunShopProxy('/cs/echinacea'), true)
    assert.equal(shouldRunShopProxy('/de/echinacea'), true)
    assert.equal(shouldRunShopProxy('/hu/echinacea'), true)
    assert.equal(shouldRunShopProxy('/uk/catalog'), true)
  })

  it('skips static assets, Next internals, robots, and sitemap', () => {
    assert.equal(shouldRunShopProxy('/robots.txt'), false)
    assert.equal(shouldRunShopProxy('/sitemap.xml'), false)
    assert.equal(shouldRunShopProxy('/favicon.ico'), false)
    assert.equal(shouldRunShopProxy('/_next/static/chunk.js'), false)
    assert.equal(shouldRunShopProxy('/image.webp'), false)
    assert.equal(shouldRunShopProxy('/image.jpg'), false)
    assert.equal(shouldRunShopProxy('/app.js'), false)
    assert.equal(shouldRunShopProxy('/styles.css'), false)
    assert.equal(shouldRunShopProxy('/images/logo.png'), false)
  })

  it('keeps proxy.ts matcher literals identical to SHOP_PROXY_MATCHERS', () => {
    const proxySrc = readFileSync(join(process.cwd(), 'proxy.ts'), 'utf8')
    for (const pattern of SHOP_PROXY_MATCHERS) {
      const sourceLiteral = `'${pattern.replaceAll('\\', '\\\\')}'`
      assert.ok(
        proxySrc.includes(sourceLiteral),
        `proxy.ts config.matcher must contain string literal ${sourceLiteral}`,
      )
    }
    assert.equal(proxySrc.includes('matcher: [SHOP_PROXY'), false)
  })
})
