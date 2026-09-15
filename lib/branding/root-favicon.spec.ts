import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  resolveRootFaviconBrandingRegion,
  resolveRootFaviconRewritePath,
} from './root-favicon'

describe('resolveRootFaviconRewritePath', () => {
  it('rewrites EU country hosts to SK branding favicon', () => {
    const previous = process.env.GA_COUNTRY_HOSTS
    try {
      process.env.GA_COUNTRY_HOSTS =
        'green-angels.sk:sk,www.green-angels.sk:sk,green-angels.hu:hu,green-angels.at:at'
      assert.equal(resolveRootFaviconBrandingRegion('green-angels.sk'), 'sk')
      assert.equal(resolveRootFaviconBrandingRegion('green-angels.hu'), 'sk')
      assert.equal(resolveRootFaviconBrandingRegion('green-angels.at'), 'sk')
      assert.equal(resolveRootFaviconRewritePath('green-angels.sk'), '/branding/sk/favicon.ico')
    } finally {
      if (previous === undefined) delete process.env.GA_COUNTRY_HOSTS
      else process.env.GA_COUNTRY_HOSTS = previous
    }
  })

  it('rewrites UA deploy (no country host map) to UA branding favicon', () => {
    const previous = process.env.GA_COUNTRY_HOSTS
    try {
      delete process.env.GA_COUNTRY_HOSTS
      assert.equal(resolveRootFaviconBrandingRegion('green-angels.com.ua'), 'ua')
      assert.equal(resolveRootFaviconRewritePath('green-angels.com.ua'), '/branding/ua/favicon.ico')
    } finally {
      if (previous === undefined) delete process.env.GA_COUNTRY_HOSTS
      else process.env.GA_COUNTRY_HOSTS = previous
    }
  })
})
