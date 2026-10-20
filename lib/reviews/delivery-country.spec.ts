import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  countryCodeToFlagEmoji,
  normalizeCountryCode,
} from '../backstage/country-display'

describe('review delivery country display helpers', () => {
  it('normalizes ISO alpha-2 and maps flags for SK/CZ/HU/AT', () => {
    assert.equal(normalizeCountryCode('sk'), 'SK')
    assert.equal(normalizeCountryCode('Cz'), 'CZ')
    assert.equal(countryCodeToFlagEmoji('SK'), '🇸🇰')
    assert.equal(countryCodeToFlagEmoji('CZ'), '🇨🇿')
    assert.equal(countryCodeToFlagEmoji('HU'), '🇭🇺')
    assert.equal(countryCodeToFlagEmoji('AT'), '🇦🇹')
  })

  it('rejects invalid / empty codes', () => {
    assert.equal(normalizeCountryCode(null), null)
    assert.equal(normalizeCountryCode(''), null)
    assert.equal(normalizeCountryCode('slovakia'), null)
    assert.equal(countryCodeToFlagEmoji('1'), null)
  })
})
