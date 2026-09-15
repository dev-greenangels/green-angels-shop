import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { stripHtmlToPlainText } from '../html/plain-text'
import { buildMerchantTitle } from './map-item'

describe('GMC feed ↔ landing language parity helpers', () => {
  it('merchant title uses the provided localized name as-is (strict feed contract)', () => {
    const title = buildMerchantTitle({
      name: 'Železník bonarijský',
      latinName: 'Verbena bonariensis',
      variantLabel: 'C2',
    })
    assert.match(title, /Železník/)
    assert.doesNotMatch(title, /[\u0400-\u04FF]/)
  })

  it('shared plain-text helper removes nbsp entities for meta and feeds', () => {
    assert.equal(stripHtmlToPlainText('A&nbsp;B&#160;C&#xA0;D'), 'A B C D')
  })
})
