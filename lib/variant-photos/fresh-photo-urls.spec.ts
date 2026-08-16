import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resolveThumbUrl } from '../media/paths'
import {
  DEFAULT_FRESH_PHOTOS_LIMIT,
  normalizeFreshPhotosLimit,
} from '../settings/fresh-photos-limit'
import {
  resolveFreshPhotoMainUrl,
  resolveFreshPhotoThumbUrl,
} from './fresh-photo-urls'

describe('catalog.freshPhotosLimit (shop)', () => {
  it('defaults to 4', () => {
    assert.equal(normalizeFreshPhotosLimit(undefined), DEFAULT_FRESH_PHOTOS_LIMIT)
  })

  it('persists 6 and rejects 0 / NaN / negative', () => {
    assert.equal(normalizeFreshPhotosLimit(6), 6)
    assert.equal(normalizeFreshPhotosLimit(0), 4)
    assert.equal(normalizeFreshPhotosLimit(Number.NaN), 4)
    assert.equal(normalizeFreshPhotosLimit(-2), 4)
  })
})

describe('resolveFreshPhoto thumb/main fallback', () => {
  it('uses explicit variant URLs when present', () => {
    const photo = {
      url: 'https://cdn.example/uploads/estimate-photos/abc/main.webp',
      mainUrl: 'https://cdn.example/uploads/estimate-photos/abc/main.webp',
      thumbUrl: 'https://cdn.example/uploads/estimate-photos/abc/thumb.webp',
    }
    assert.equal(resolveFreshPhotoMainUrl(photo), photo.mainUrl)
    assert.equal(resolveFreshPhotoThumbUrl(photo), photo.thumbUrl)
  })

  it('falls back to the existing URL when variants are missing (legacy original)', () => {
    const photo = { url: 'https://cdn.example/uploads/estimate-photos/ean/123/old.jpg' }
    assert.equal(resolveFreshPhotoMainUrl(photo), photo.url)
    assert.equal(resolveFreshPhotoThumbUrl(photo), photo.url)
  })

  it('derives thumb.webp from a variant main.webp path when thumbUrl is absent', () => {
    const url = '/uploads/estimate-photos/abc/main.webp'
    assert.equal(resolveFreshPhotoThumbUrl({ url }), '/uploads/estimate-photos/abc/thumb.webp')
    assert.equal(resolveThumbUrl(url), '/uploads/estimate-photos/abc/thumb.webp')
  })
})
