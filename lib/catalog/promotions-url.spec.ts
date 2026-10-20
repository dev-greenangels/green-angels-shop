import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildPromotionsSearchParams,
  parsePromotionsQtyParam,
  PROMOTIONS_QTY_PARAM,
} from './promotions-url'

describe('parsePromotionsQtyParam', () => {
  it('parses valid qty', () => {
    assert.equal(parsePromotionsQtyParam('10'), 10)
    assert.equal(parsePromotionsQtyParam('10.9'), 10)
    assert.equal(parsePromotionsQtyParam('0'), 1)
  })

  it('invalid values → null (no throw)', () => {
    assert.equal(parsePromotionsQtyParam(null), null)
    assert.equal(parsePromotionsQtyParam(''), null)
    assert.equal(parsePromotionsQtyParam('abc'), null)
    assert.equal(parsePromotionsQtyParam('  '), null)
  })
})

describe('buildPromotionsSearchParams', () => {
  it('sets qty and clears page', () => {
    const current = new URLSearchParams('page=3&foo=1')
    assert.equal(buildPromotionsSearchParams(current, 10), 'qty=10&foo=1')
  })

  it('clears qty for «Усі» and preserves other params', () => {
    const current = new URLSearchParams('qty=10&page=2&view=list')
    assert.equal(buildPromotionsSearchParams(current, null), 'view=list')
  })

  it('stable order puts qty first', () => {
    const current = new URLSearchParams('z=1&a=2')
    const next = buildPromotionsSearchParams(current, 40)
    assert.equal(next.startsWith(`${PROMOTIONS_QTY_PARAM}=40`), true)
  })
})
