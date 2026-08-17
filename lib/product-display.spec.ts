import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { mergeProductPageDisplayItems } from './product-display'
import type { ProductDisplayCharacteristic } from './types'

const height: ProductDisplayCharacteristic = {
  id: 'char-height',
  slug: 'height',
  name: 'Висота',
  icon: 'ArrowUpDown',
  unit: 'см',
  valueType: 'NUMBER',
  displayValue: '80–100',
  sortOrder: 1,
}

const sizeC5: ProductDisplayCharacteristic = {
  id: 'attr-size',
  slug: 'size',
  name: 'Контейнер',
  icon: 'Ruler',
  unit: null,
  valueType: 'CONTAINER',
  displayValue: 'C5',
  sortOrder: 1,
}

const sizeC7: ProductDisplayCharacteristic = {
  ...sizeC5,
  displayValue: 'C7',
}

describe('mergeProductPageDisplayItems', () => {
  it('keeps product characteristics when the variant has no display attributes', () => {
    const items = mergeProductPageDisplayItems([height], { displayAttributes: [] })
    assert.deepEqual(items, [height])
  })

  it('appends the selected variant attributes so size changes swap the row value', () => {
    const c5 = mergeProductPageDisplayItems([height], { displayAttributes: [sizeC5] })
    const c7 = mergeProductPageDisplayItems([height], { displayAttributes: [sizeC7] })
    assert.equal(c5[1]?.displayValue, 'C5')
    assert.equal(c7[1]?.displayValue, 'C7')
    assert.equal(c5[1]?.icon, 'Ruler')
  })
})
