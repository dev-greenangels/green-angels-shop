import { describe, expect, it } from 'vitest'

import { normalizeRichTextHtml } from './rich-text-html'

describe('normalizeRichTextHtml', () => {
  it('unwraps legacy font tags without size', () => {
    expect(normalizeRichTextHtml('<p><font>Hello</font></p>')).toBe('<p>Hello</p>')
  })

  it('maps legacy font size to rich font span', () => {
    expect(normalizeRichTextHtml('<p><font size="4">Hello</font></p>')).toBe(
      '<p><span data-rich-font-size="lg" style="font-size: 1.125rem;">Hello</span></p>',
    )
  })

  it('converts headings to paragraphs', () => {
    expect(normalizeRichTextHtml('<h2>Title</h2>')).toBe('<p>Title</p>')
  })

  it('converts b/i to strong/em', () => {
    expect(normalizeRichTextHtml('<p><b>bold</b> and <i>italic</i></p>')).toBe(
      '<p><strong>bold</strong> and <em>italic</em></p>',
    )
  })

  it('returns empty string for blank html', () => {
    expect(normalizeRichTextHtml('   ')).toBe('')
  })
})
