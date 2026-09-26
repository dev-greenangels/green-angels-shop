import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  countryCodeToFlagEmoji,
  formatCountryDisplay,
  normalizeCountryCode,
} from './country-display'

describe('CountryDisplay helpers', () => {
  it('AT → flag + AT + Austria', () => {
    const formatted = formatCountryDisplay('at', 'en')
    assert.ok(formatted)
    assert.equal(formatted.code, 'AT')
    assert.equal(formatted.flag, '🇦🇹')
    assert.match(formatted.name, /Austria/i)
    assert.match(formatted.label, /🇦🇹/)
  })

  it('SK / CZ / HU / DE flags', () => {
    assert.equal(countryCodeToFlagEmoji('SK'), '🇸🇰')
    assert.equal(countryCodeToFlagEmoji('CZ'), '🇨🇿')
    assert.equal(countryCodeToFlagEmoji('HU'), '🇭🇺')
    assert.equal(countryCodeToFlagEmoji('DE'), '🇩🇪')
  })

  it('lowercase normalizes', () => {
    assert.equal(normalizeCountryCode('sk'), 'SK')
  })

  it('null/invalid does not crash', () => {
    assert.equal(normalizeCountryCode(null), null)
    assert.equal(normalizeCountryCode(''), null)
    assert.equal(normalizeCountryCode('XYZ'), null)
    assert.equal(formatCountryDisplay(undefined), null)
    assert.equal(countryCodeToFlagEmoji('1'), null)
  })
})
