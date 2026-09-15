import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { stripHtmlToPlainText } from './plain-text'

describe('stripHtmlToPlainText', () => {
  it('strips tags and decodes common named entities', () => {
    assert.equal(
      stripHtmlToPlainText('<p>Krásna &amp; zelená&nbsp;rastlina</p>'),
      'Krásna & zelená rastlina',
    )
  })

  it('decodes numeric decimal and hex NBSP', () => {
    assert.equal(stripHtmlToPlainText('A&#160;B&#xA0;C'), 'A B C')
  })

  it('preserves Ukrainian, Slovak, Czech, Hungarian and German diacritics', () => {
    assert.equal(
      stripHtmlToPlainText('<p>Ехінацея · Tuja západná · Kontejner · Levendula · Staude</p>'),
      'Ехінацея · Tuja západná · Kontejner · Levendula · Staude',
    )
  })

  it('removes script/style blocks', () => {
    assert.equal(
      stripHtmlToPlainText('<style>.x{}</style><p>Ok</p><script>alert(1)</script>'),
      'Ok',
    )
  })

  it('returns empty for nullish input', () => {
    assert.equal(stripHtmlToPlainText(null), '')
    assert.equal(stripHtmlToPlainText(undefined), '')
  })
})
