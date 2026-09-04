import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  findVisibleVariantIdBySku,
  parseVariantSkuQueryParam,
  resolveInitialVariantId,
} from './variant-query'

describe('variant-query', () => {
  it('parses and decodes variant SKU query values', () => {
    assert.equal(parseVariantSkuQueryParam('ABC-123'), 'ABC-123')
    assert.equal(parseVariantSkuQueryParam('GA%2F10001'), 'GA/10001')
    assert.equal(parseVariantSkuQueryParam(['GA-1', 'GA-2']), 'GA-1')
    assert.equal(parseVariantSkuQueryParam('  '), null)
    assert.equal(parseVariantSkuQueryParam('%E0%A4%A'), '%E0%A4%A')
  })

  it('resolves visible variant id by SKU with safe fallback', () => {
    const variants = [
      { id: 'a', sku: 'SKU-A' },
      { id: 'b', sku: 'SKU-B' },
    ]
    assert.equal(findVisibleVariantIdBySku(variants, 'SKU-B'), 'b')
    assert.equal(findVisibleVariantIdBySku(variants, 'missing'), null)
    assert.equal(resolveInitialVariantId({ variants, preferredSku: 'SKU-B' }), 'b')
    assert.equal(resolveInitialVariantId({ variants, preferredSku: 'nope' }), 'a')
  })
})
