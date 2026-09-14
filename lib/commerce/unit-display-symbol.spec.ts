import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  COUNT_UNIT_DISPLAY_BY_LOCALE,
  resolveUnitDisplaySymbol,
} from './unit-display-symbol'

describe('resolveUnitDisplaySymbol', () => {
  it('maps pcs / шт identity to locale display symbols', () => {
    assert.equal(resolveUnitDisplaySymbol('шт', 'uk'), 'шт')
    assert.equal(resolveUnitDisplaySymbol('pcs', 'sk'), 'ks')
    assert.equal(resolveUnitDisplaySymbol('шт', 'cs'), 'ks')
    assert.equal(resolveUnitDisplaySymbol('pcs', 'hu'), 'db')
    assert.equal(resolveUnitDisplaySymbol('шт', 'de'), 'Stk.')
    assert.equal(resolveUnitDisplaySymbol('pcs', 'en'), 'pcs')
  })

  it('defaults empty/null to locale count symbol', () => {
    assert.equal(resolveUnitDisplaySymbol(null, 'hu'), 'db')
    assert.equal(resolveUnitDisplaySymbol('', 'sk'), 'ks')
  })

  it('passes through non-count units', () => {
    assert.equal(resolveUnitDisplaySymbol('kg', 'hu'), 'kg')
    assert.equal(resolveUnitDisplaySymbol('л', 'en'), 'л')
  })

  it('falls back unknown locale to en', () => {
    assert.equal(resolveUnitDisplaySymbol('шт', 'xx'), COUNT_UNIT_DISPLAY_BY_LOCALE.en)
  })
})
