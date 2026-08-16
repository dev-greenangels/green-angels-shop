import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { HOME_PINNED_SLUGS_MAX } from './constants'
import { orderPlantsByPinnedSlugs, pinnedSlugsForQuery } from './pinned-slugs'
import type { Plant } from '../types'

function plant(slug: string, id = slug): Plant {
  return {
    id,
    name: slug,
    latinName: '',
    slug,
    categoryId: 'cat',
    category: 'cat',
    price: 10,
    sku: '',
    images: [],
    description: '',
    shortDescription: '',
    stock: 1,
    variants: [],
    containerSize: 'C2',
    width: '—',
    plantingInstructions: '',
    lightRequirements: '',
    careInstructions: '',
    sunRequirement: 'full-sun',
    soilType: 'any',
    hardinessZone: '—',
    wateringNeeds: 'moderate',
    height: '—',
    isNew: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('pinnedSlugsForQuery', () => {
  it('returns empty for empty/whitespace lists', () => {
    assert.deepEqual(pinnedSlugsForQuery([]), [])
    assert.deepEqual(pinnedSlugsForQuery(['', '  ']), [])
  })

  it('keeps pin order, drops duplicates and empty entries', () => {
    assert.deepEqual(pinnedSlugsForQuery([' b ', 'a', 'b', 'c']), ['b', 'a', 'c'])
  })

  it('caps at HOME_PINNED_SLUGS_MAX', () => {
    const slugs = Array.from({ length: 40 }, (_, i) => `s${i}`)
    const pinned = pinnedSlugsForQuery(slugs)
    assert.equal(pinned.length, HOME_PINNED_SLUGS_MAX)
    assert.equal(pinned[0], 's0')
    assert.equal(pinned.at(-1), 's23')
  })
})

describe('orderPlantsByPinnedSlugs', () => {
  it('restores CMS order and skips missing/unpublished (absent from result)', () => {
    const plants = [plant('c'), plant('a')]
    const ordered = orderPlantsByPinnedSlugs(plants, ['a', 'gone', 'c', 'a'])
    assert.deepEqual(
      ordered.map((row) => row.slug),
      ['a', 'c'],
    )
  })

  it('returns empty when the pin list is empty', () => {
    assert.deepEqual(orderPlantsByPinnedSlugs([plant('a')], []), [])
  })
})
