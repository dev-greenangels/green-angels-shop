import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { CATEGORY_DEFAULT_IMAGE } from '@/lib/category-image'
import {
  LEGACY_NURSERY_GALLERY_PLACEHOLDER_PATHS,
  resolveCmsDisplayImageUrl,
  sanitizeCmsImageUrl,
} from './cms-image-url'

describe('sanitizeCmsImageUrl — legacy nursery gallery placeholders', () => {
  it('clears the four known missing /images/nursery/*.jpg seed URLs', () => {
    for (const path of LEGACY_NURSERY_GALLERY_PLACEHOLDER_PATHS) {
      assert.equal(sanitizeCmsImageUrl(path), '', path)
      assert.equal(sanitizeCmsImageUrl(`  ${path}  `), '', `trimmed ${path}`)
      assert.equal(sanitizeCmsImageUrl(`${path}?v=1`), '', `query ${path}`)
    }
  })

  it('maps cleared nursery placeholders to category-placeholder.svg for display', () => {
    for (const path of LEGACY_NURSERY_GALLERY_PLACEHOLDER_PATHS) {
      assert.equal(resolveCmsDisplayImageUrl(path), CATEGORY_DEFAULT_IMAGE)
    }
  })

  it('keeps real local /images paths that are not the nursery seed set', () => {
    assert.equal(sanitizeCmsImageUrl('/images/hero-nursery.png'), '/images/hero-nursery.png')
    assert.equal(
      sanitizeCmsImageUrl('/images/category-placeholder.svg'),
      '/images/category-placeholder.svg',
    )
    assert.equal(
      resolveCmsDisplayImageUrl('/images/hero-nursery.png'),
      '/images/hero-nursery.png',
    )
  })

  it('keeps real uploaded / R2 media URLs', () => {
    const r2 =
      'https://media.example.com/uploads/products/abc/main.webp'
    assert.equal(sanitizeCmsImageUrl(r2), r2)
    assert.equal(resolveCmsDisplayImageUrl(r2), r2)
    assert.equal(
      sanitizeCmsImageUrl('/uploads/products/abc/main.webp'),
      '/uploads/products/abc/main.webp',
    )
  })

  it('does not treat similarly named paths under other folders as nursery placeholders', () => {
    assert.equal(
      sanitizeCmsImageUrl('/uploads/nursery/field.jpg'),
      '/uploads/nursery/field.jpg',
    )
    assert.equal(
      sanitizeCmsImageUrl('/images/nursery-archive/field.jpg'),
      '/images/nursery-archive/field.jpg',
    )
  })
})
