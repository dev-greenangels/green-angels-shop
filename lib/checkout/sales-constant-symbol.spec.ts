import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  EU_SALES_CONSTANT_SYMBOL,
  numericOrderVarSym,
} from './sales-constant-symbol'

describe('sales constant symbol helpers', () => {
  it('EU default KS is 0008', () => {
    assert.equal(EU_SALES_CONSTANT_SYMBOL, '0008')
  })

  it('numericOrderVarSym strips ZY display prefix (legacy)', () => {
    assert.equal(numericOrderVarSym('ZY-00000037'), '37')
    assert.equal(numericOrderVarSym(37), '37')
  })

  it('numericOrderVarSym keeps yearly YYYYNNNN', () => {
    assert.equal(numericOrderVarSym('ZY-20260075'), '20260075')
    assert.equal(numericOrderVarSym(20260075), '20260075')
  })

  it('does not confuse legacy ZY-00002026 with yearly 2026', () => {
    assert.equal(numericOrderVarSym('ZY-00002026'), '2026')
    assert.equal(numericOrderVarSym('ZY-20260001'), '20260001')
  })
})
