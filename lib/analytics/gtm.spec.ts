import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildGtmScript,
  GA_SURFACE_BACKSTAGE,
  getGtmId,
  gtmNoscriptSrc,
  isBackstageSurface,
  isGtmEnabled,
} from './gtm'

describe('isBackstageSurface', () => {
  it('is true only for the backstage surface header value', () => {
    assert.equal(isBackstageSurface(GA_SURFACE_BACKSTAGE), true)
    assert.equal(isBackstageSurface('storefront'), false)
    assert.equal(isBackstageSurface(null), false)
    assert.equal(isBackstageSurface(undefined), false)
  })
})

describe('getGtmId', () => {
  it('accepts a valid GTM container id', () => {
    assert.equal(getGtmId('GTM-MSNVH28D'), 'GTM-MSNVH28D')
  })

  it('rejects empty or invalid ids', () => {
    assert.equal(getGtmId(''), null)
    assert.equal(getGtmId('   '), null)
    assert.equal(getGtmId('UA-123456-1'), null)
    assert.equal(getGtmId('gtm-msnvh28d'), null)
  })

  it('isGtmEnabled reflects id validity', () => {
    assert.equal(isGtmEnabled('GTM-MSNVH28D'), true)
    assert.equal(isGtmEnabled('invalid'), false)
  })
})

describe('buildGtmScript', () => {
  it('embeds the container id once', () => {
    const script = buildGtmScript('GTM-MSNVH28D')
    assert.equal((script.match(/GTM-MSNVH28D/g) ?? []).length, 1)
    assert.match(script, /googletagmanager\.com\/gtm\.js/)
    assert.match(script, /event:'gtm\.js'/)
  })

  it('does not duplicate the GTM loader snippet', () => {
    const script = buildGtmScript('GTM-MSNVH28D')
    assert.equal((script.match(/gtm\.start/g) ?? []).length, 1)
  })
})

describe('gtmNoscriptSrc', () => {
  it('builds the official noscript iframe URL', () => {
    assert.equal(gtmNoscriptSrc('GTM-MSNVH28D'), 'https://www.googletagmanager.com/ns.html?id=GTM-MSNVH28D')
  })
})
