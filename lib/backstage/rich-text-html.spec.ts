import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  normalizeRichTextHtml,
  prepareRichTextDraft,
  sanitizeVisualRichTextPaste,
} from './rich-text-html'

describe('normalizeRichTextHtml', () => {
  it('unwraps legacy font tags without size', () => {
    assert.equal(normalizeRichTextHtml('<p><font>Hello</font></p>'), '<p>Hello</p>')
  })

  it('maps legacy font size to rich font span', () => {
    assert.equal(
      normalizeRichTextHtml('<p><font size="4">Hello</font></p>'),
      '<p><span data-rich-font-size="lg" style="font-size: 1.125rem;">Hello</span></p>',
    )
  })

  it('converts headings to paragraphs', () => {
    assert.equal(normalizeRichTextHtml('<h2>Title</h2>'), '<p>Title</p>')
  })

  it('converts b/i to strong/em', () => {
    assert.equal(
      normalizeRichTextHtml('<p><b>bold</b> and <i>italic</i></p>'),
      '<p><strong>bold</strong> and <em>italic</em></p>',
    )
  })

  it('returns empty string for blank html', () => {
    assert.equal(normalizeRichTextHtml('   '), '')
  })
})

describe('prepareRichTextDraft', () => {
  it('trims without stripping inline styles', () => {
    assert.equal(
      prepareRichTextDraft('  <p><span style="color: green">Hello</span></p>  '),
      '<p><span style="color: green">Hello</span></p>',
    )
  })
})

describe('sanitizeVisualRichTextPaste', () => {
  it('removes color and font-family but keeps bold and italic', () => {
    assert.equal(
      sanitizeVisualRichTextPaste(
        '<p><span style="color:#2E7D32;font-family:Arial,sans-serif"><b>Bold</b> and <i>italic</i></span></p>',
      ),
      '<p><strong>Bold</strong> and <em>italic</em></p>',
    )
  })

  it('keeps editor font-size spans from pasted html', () => {
    assert.equal(
      sanitizeVisualRichTextPaste(
        '<p><span style="font-size:1.125rem;color:red">Large</span></p>',
      ),
      '<p><span data-rich-font-size="lg" style="font-size: 1.125rem;">Large</span></p>',
    )
  })

  it('converts pasted headings to paragraphs', () => {
    assert.equal(
      sanitizeVisualRichTextPaste('<h2>Title</h2><p>Body</p>'),
      '<p>Title</p><p>Body</p>',
    )
  })

  it('preserves unordered lists', () => {
    assert.equal(
      sanitizeVisualRichTextPaste('<ul><li style="color:red">One</li></ul>'),
      '<ul><li>One</li></ul>',
    )
  })
})
