import { describe, expect, it } from 'vitest'

import {
  normalizeRichTextHtml,
  prepareRichTextDraft,
  sanitizeVisualRichTextPaste,
} from './rich-text-html'

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

describe('prepareRichTextDraft', () => {
  it('trims without stripping inline styles', () => {
    expect(
      prepareRichTextDraft('  <p><span style="color: green">Hello</span></p>  '),
    ).toBe('<p><span style="color: green">Hello</span></p>')
  })
})

describe('sanitizeVisualRichTextPaste', () => {
  it('removes color and font-family but keeps bold and italic', () => {
    expect(
      sanitizeVisualRichTextPaste(
        '<p><span style="color:#2E7D32;font-family:Arial,sans-serif"><b>Bold</b> and <i>italic</i></span></p>',
      ),
    ).toBe('<p><strong>Bold</strong> and <em>italic</em></p>')
  })

  it('keeps editor font-size spans from pasted html', () => {
    expect(
      sanitizeVisualRichTextPaste(
        '<p><span style="font-size:1.125rem;color:red">Large</span></p>',
      ),
    ).toBe('<p><span data-rich-font-size="lg" style="font-size: 1.125rem;">Large</span></p>')
  })

  it('converts pasted headings to paragraphs', () => {
    expect(sanitizeVisualRichTextPaste('<h2>Title</h2><p>Body</p>')).toBe(
      '<p>Title</p><p>Body</p>',
    )
  })

  it('preserves unordered lists', () => {
    expect(sanitizeVisualRichTextPaste('<ul><li style="color:red">One</li></ul>')).toBe(
      '<ul><li>One</li></ul>',
    )
  })
})
