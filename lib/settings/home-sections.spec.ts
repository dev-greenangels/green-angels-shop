import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  isHomeSectionHidden,
  normalizeHomeSectionOrder,
  resolveHomeSectionHidden,
  setHomeSectionHidden,
} from './home-sections'

describe('home section hide', () => {
  it('legacy JSON without sectionHidden hides reviews when enabled is false', () => {
    const hidden = resolveHomeSectionHidden({ reviewsEnabled: false, freshPlantPhotosEnabled: true })
    assert.deepEqual(hidden, ['reviews'])
    assert.equal(isHomeSectionHidden(hidden, 'reviews'), true)
    assert.equal(isHomeSectionHidden(hidden, 'whyUs'), false)
  })

  it('keeps hidden keys in the order list', () => {
    const hidden = resolveHomeSectionHidden({
      sectionHidden: ['whyUs'],
      reviewsEnabled: true,
      freshPlantPhotosEnabled: true,
    })
    assert.deepEqual(hidden, ['whyUs'])
    const order = normalizeHomeSectionOrder(['categories', 'newArrivals'])
    assert.equal(order.includes('whyUs'), true)
  })

  it('old JSON without the new field shows every section', () => {
    const hidden = resolveHomeSectionHidden({})
    assert.deepEqual(hidden, [])
  })

  it('setHomeSectionHidden does not drop keys from order', () => {
    const hidden = setHomeSectionHidden([], 'whyUs', true)
    assert.deepEqual(hidden, ['whyUs'])
    const order = normalizeHomeSectionOrder(undefined)
    assert.equal(order.includes('whyUs'), true)
  })
})
