import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import { toPublicMediaUrl } from './public-url'

describe('toPublicMediaUrl', () => {
  const prevMedia = process.env.NEXT_PUBLIC_MEDIA_BASE_URL
  const prevR2 = process.env.R2_PUBLIC_BASE_URL

  afterEach(() => {
    if (prevMedia === undefined) delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL
    else process.env.NEXT_PUBLIC_MEDIA_BASE_URL = prevMedia
    if (prevR2 === undefined) delete process.env.R2_PUBLIC_BASE_URL
    else process.env.R2_PUBLIC_BASE_URL = prevR2
  })

  it('prefixes relative /uploads paths with media base', () => {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = 'https://media.example.com/'
    assert.equal(
      toPublicMediaUrl('/uploads/products/abc/main.webp'),
      'https://media.example.com/uploads/products/abc/main.webp',
    )
  })

  it('leaves absolute https URLs unchanged', () => {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = 'https://media.example.com'
    assert.equal(
      toPublicMediaUrl('https://cdn.example.com/uploads/x.webp'),
      'https://cdn.example.com/uploads/x.webp',
    )
  })

  it('returns empty for null/empty and passes through non-uploads relative', () => {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = 'https://media.example.com'
    assert.equal(toPublicMediaUrl(null), '')
    assert.equal(toPublicMediaUrl(''), '')
    assert.equal(toPublicMediaUrl('/images/category-placeholder.svg'), '/images/category-placeholder.svg')
  })
})
