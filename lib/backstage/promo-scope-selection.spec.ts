import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildScopePayload,
  clearCategoriesInList,
  clearFilteredCategoriesResult,
  filterCategoriesByQuery,
  flattenCategoryTreeForPicker,
  mergeSelectedItems,
  pruneRedundantCategoryIds,
  removeSelectedIds,
  selectAllCategories,
  toggleCategorySelection,
  toggleSelectedItem,
  uniqueIds,
  type ScopeCategoryOption,
} from './promo-scope-selection'

const tree = [
  {
    id: 'root',
    name: 'Root',
    children: [
      {
        id: 'mid',
        name: 'Mid',
        children: [{ id: 'leaf', name: 'Leaf', children: [] }],
      },
      { id: 'sib', name: 'Sibling', children: [] },
    ],
  },
]

describe('flattenCategoryTreeForPicker', () => {
  it('keeps hierarchy + parentId', () => {
    const flat = flattenCategoryTreeForPicker(tree)
    assert.deepEqual(
      flat.map((o) => ({ id: o.id, depth: o.depth, parentId: o.parentId ?? null })),
      [
        { id: 'root', depth: 0, parentId: null },
        { id: 'mid', depth: 1, parentId: 'root' },
        { id: 'leaf', depth: 2, parentId: 'mid' },
        { id: 'sib', depth: 1, parentId: 'root' },
      ],
    )
  })
})

describe('category selection prune / toggle', () => {
  const options = flattenCategoryTreeForPicker(tree)

  it('prunes child when parent selected', () => {
    assert.deepEqual(pruneRedundantCategoryIds(['root', 'leaf', 'sib'], options), [
      'root',
    ])
  })

  it('toggle parent removes selected descendants', () => {
    const next = toggleCategorySelection(['leaf', 'sib'], 'root', options)
    assert.deepEqual(next.sort(), ['root'].sort())
  })

  it('toggle off removes only that id', () => {
    assert.deepEqual(toggleCategorySelection(['root', 'sib'], 'sib', options), ['root'])
  })

  it('select all filtered then prune', () => {
    const next = selectAllCategories([], options, options)
    assert.deepEqual(next, ['root'])
  })

  it('clear categories in filtered list', () => {
    const visible: ScopeCategoryOption[] = options.filter((o) => o.id === 'sib')
    assert.deepEqual(clearCategoriesInList(['root', 'sib'], visible), ['root'])
  })

  it('clear filtered explains parent still covering children', () => {
    const visible = options.filter((o) => o.id === 'leaf' || o.id === 'mid')
    const result = clearFilteredCategoriesResult(['root'], visible, options)
    assert.deepEqual(result.nextIds, ['root'])
    assert.equal(result.coveredRemainCount, 2)
  })
})

describe('filterCategoriesByQuery', () => {
  const options = flattenCategoryTreeForPicker(tree)

  it('filters by name (case-insensitive)', () => {
    const hits = filterCategoriesByQuery(options, 'leaf')
    assert.deepEqual(
      hits.map((o) => o.id),
      ['leaf'],
    )
  })

  it('empty query returns all', () => {
    assert.equal(filterCategoriesByQuery(options, '  ').length, options.length)
  })
})

describe('product/variant selection helpers', () => {
  it('merge / toggle / remove preserve selection across “pages”', () => {
    const page1 = mergeSelectedItems([], [
      { id: 'p1', label: 'A' },
      { id: 'p2', label: 'B' },
    ])
    const page2 = mergeSelectedItems(page1, [{ id: 'p3', label: 'C' }])
    assert.equal(page2.length, 3)
    const toggled = toggleSelectedItem(page2, { id: 'p2', label: 'B' })
    assert.deepEqual(
      toggled.map((x) => x.id),
      ['p1', 'p3'],
    )
    assert.deepEqual(
      removeSelectedIds(page2, ['p1', 'p3']).map((x) => x.id),
      ['p2'],
    )
  })

  it('uniqueIds dedupes', () => {
    assert.deepEqual(uniqueIds(['a', 'a', 'b', '']), ['a', 'b'])
  })
})

describe('buildScopePayload', () => {
  const options = flattenCategoryTreeForPicker(tree)

  it('CATEGORY include + mixed excludes; product exclude not expanded to variants', () => {
    const payload = buildScopePayload({
      target: 'CATEGORY',
      categoryIds: ['root', 'leaf'],
      categoryOptions: options,
      productItems: [],
      variantItems: [],
      excludeCategoryIds: ['sib'],
      excludeProducts: [
        { id: 'prod-1', label: 'Rose' },
        { id: 'prod-1', label: 'Rose dup' },
      ],
      excludeVariants: [{ id: 'var-c5', label: 'Rose · C5' }],
    })
    assert.deepEqual(payload.targetIds, ['root'])
    assert.deepEqual(payload.excludeCategoryIds, ['sib'])
    assert.deepEqual(payload.excludeProductIds, ['prod-1'])
    assert.deepEqual(payload.excludeVariantIds, ['var-c5'])
  })

  it('PRODUCT vs VARIANT target ids', () => {
    const products = buildScopePayload({
      target: 'PRODUCT',
      categoryIds: [],
      categoryOptions: options,
      productItems: [
        { id: 'p1', label: 'A' },
        { id: 'p2', label: 'B' },
      ],
      variantItems: [{ id: 'v1', label: 'A · C2' }],
      excludeCategoryIds: [],
      excludeProducts: [],
      excludeVariants: [],
    })
    assert.deepEqual(products.targetIds, ['p1', 'p2'])

    const variants = buildScopePayload({
      target: 'VARIANT',
      categoryIds: [],
      categoryOptions: options,
      productItems: [{ id: 'p1', label: 'A' }],
      variantItems: [
        { id: 'v1', label: 'A · C2' },
        { id: 'v2', label: 'A · C5' },
      ],
      excludeCategoryIds: [],
      excludeProducts: [],
      excludeVariants: [],
    })
    assert.deepEqual(variants.targetIds, ['v1', 'v2'])
  })

  it('edit restore: prune stored parent+child; keep product vs variant excludes separate', () => {
    const restoredCategoryIds = pruneRedundantCategoryIds(['root', 'mid', 'leaf'], options)
    assert.deepEqual(restoredCategoryIds, ['root'])

    const payload = buildScopePayload({
      target: 'ALL_PRODUCTS',
      categoryIds: restoredCategoryIds,
      categoryOptions: options,
      productItems: [],
      variantItems: [],
      excludeCategoryIds: ['mid', 'leaf'],
      excludeProducts: [{ id: 'prod-x', label: 'Plant X' }],
      excludeVariants: [{ id: 'var-1', label: 'Plant X · C5' }],
    })
    assert.deepEqual(payload.targetIds, [])
    assert.deepEqual(payload.excludeCategoryIds, ['mid'])
    assert.deepEqual(payload.excludeProductIds, ['prod-x'])
    assert.deepEqual(payload.excludeVariantIds, ['var-1'])
    assert.ok(!payload.excludeVariantIds.includes('prod-x'))
  })
})
