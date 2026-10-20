/**
 * Pure helpers for DiscountRule / PromoCode scope pickers.
 * Category pruning: when a parent is selected, child IDs are omitted from the payload
 * because the pricing engine expands descendants.
 */

export type ScopeCategoryOption = {
  id: string
  name: string
  depth: number
  parentId?: string | null
}

export type ScopeSelectedItem = { id: string; label: string }

export type ScopeCategoryTreeNode = {
  id: string
  name: string
  children?: ScopeCategoryTreeNode[]
}

/** Flatten tree with parentId for descendant pruning. */
export function flattenCategoryTreeForPicker(
  nodes: ScopeCategoryTreeNode[],
  depth = 0,
  parentId: string | null = null,
): ScopeCategoryOption[] {
  const result: ScopeCategoryOption[] = []
  for (const node of nodes) {
    result.push({
      id: node.id,
      name: node.name,
      depth,
      parentId,
    })
    if (node.children?.length) {
      result.push(...flattenCategoryTreeForPicker(node.children, depth + 1, node.id))
    }
  }
  return result
}

export function filterCategoriesByQuery(
  options: ScopeCategoryOption[],
  query: string,
): ScopeCategoryOption[] {
  const q = query.trim().toLowerCase()
  if (!q) return options
  return options.filter(
    (o) => o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q),
  )
}

function parentById(options: ScopeCategoryOption[]): Map<string, string | null> {
  return new Map(options.map((o) => [o.id, o.parentId ?? null]))
}

function collectDescendantIds(
  rootId: string,
  options: ScopeCategoryOption[],
): string[] {
  const childrenByParent = new Map<string | null, string[]>()
  for (const o of options) {
    const key = o.parentId ?? null
    const list = childrenByParent.get(key) ?? []
    list.push(o.id)
    childrenByParent.set(key, list)
  }
  const out: string[] = []
  const stack = [...(childrenByParent.get(rootId) ?? [])]
  while (stack.length) {
    const id = stack.pop()!
    out.push(id)
    for (const child of childrenByParent.get(id) ?? []) stack.push(child)
  }
  return out
}

/** Drop selected children when an ancestor is also selected. */
export function pruneRedundantCategoryIds(
  selectedIds: string[],
  options: ScopeCategoryOption[],
): string[] {
  const parents = parentById(options)
  const selected = new Set(selectedIds)
  return selectedIds.filter((id) => {
    let walk = parents.get(id) ?? null
    while (walk) {
      if (selected.has(walk)) return false
      walk = parents.get(walk) ?? null
    }
    return true
  })
}

/**
 * Toggle one category. Selecting a parent removes selected descendants from the set
 * (engine will expand). Deselect removes only that id.
 */
export function toggleCategorySelection(
  selectedIds: string[],
  id: string,
  options: ScopeCategoryOption[],
): string[] {
  const set = new Set(selectedIds)
  if (set.has(id)) {
    set.delete(id)
    return pruneRedundantCategoryIds([...set], options)
  }
  set.add(id)
  for (const descendantId of collectDescendantIds(id, options)) {
    set.delete(descendantId)
  }
  return pruneRedundantCategoryIds([...set], options)
}

/** Add all visible (filtered) category ids, then prune. */
export function selectAllCategories(
  selectedIds: string[],
  visibleOptions: ScopeCategoryOption[],
  options: ScopeCategoryOption[],
): string[] {
  const set = new Set(selectedIds)
  for (const o of visibleOptions) set.add(o.id)
  return pruneRedundantCategoryIds([...set], options)
}

export function clearCategoriesInList(
  selectedIds: string[],
  visibleOptions: ScopeCategoryOption[],
): string[] {
  const remove = new Set(visibleOptions.map((o) => o.id))
  return selectedIds.filter((id) => !remove.has(id))
}

function hasSelectedAncestorId(
  id: string,
  selected: Set<string>,
  options: ScopeCategoryOption[],
): boolean {
  const parents = parentById(options)
  let walk = parents.get(id) ?? null
  while (walk) {
    if (selected.has(walk)) return true
    walk = parents.get(walk) ?? null
  }
  return false
}

/**
 * Clear only explicitly selected ids in the filtered list.
 * Returns how many visible rows remain covered by a still-selected parent
 * (so the UI can explain that descendant coverage was not removed).
 */
export function clearFilteredCategoriesResult(
  selectedIds: string[],
  visibleOptions: ScopeCategoryOption[],
  options: ScopeCategoryOption[],
): { nextIds: string[]; coveredRemainCount: number } {
  const nextIds = pruneRedundantCategoryIds(
    clearCategoriesInList(selectedIds, visibleOptions),
    options,
  )
  const selected = new Set(nextIds)
  let coveredRemainCount = 0
  for (const option of visibleOptions) {
    if (selected.has(option.id)) continue
    if (hasSelectedAncestorId(option.id, selected, options)) coveredRemainCount += 1
  }
  return { nextIds, coveredRemainCount }
}

export function mergeSelectedItems(
  selected: ScopeSelectedItem[],
  toAdd: ScopeSelectedItem[],
): ScopeSelectedItem[] {
  const byId = new Map(selected.map((item) => [item.id, item]))
  for (const item of toAdd) {
    if (!byId.has(item.id)) byId.set(item.id, item)
  }
  return [...byId.values()]
}

export function removeSelectedIds(
  selected: ScopeSelectedItem[],
  ids: string[],
): ScopeSelectedItem[] {
  const remove = new Set(ids)
  return selected.filter((item) => !remove.has(item.id))
}

export function toggleSelectedItem(
  selected: ScopeSelectedItem[],
  item: ScopeSelectedItem,
): ScopeSelectedItem[] {
  if (selected.some((row) => row.id === item.id)) {
    return selected.filter((row) => row.id !== item.id)
  }
  return [...selected, item]
}

/** Deduplicate payload ids while preserving order. */
export function uniqueIds(ids: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

export function buildScopePayload(input: {
  target: 'ALL_PRODUCTS' | 'CATEGORY' | 'PRODUCT' | 'VARIANT'
  categoryIds: string[]
  categoryOptions: ScopeCategoryOption[]
  productItems: ScopeSelectedItem[]
  variantItems: ScopeSelectedItem[]
  excludeCategoryIds: string[]
  excludeProducts: ScopeSelectedItem[]
  excludeVariants: ScopeSelectedItem[]
}): {
  targetIds: string[]
  excludeCategoryIds: string[]
  excludeProductIds: string[]
  excludeVariantIds: string[]
} {
  let targetIds: string[] = []
  if (input.target === 'CATEGORY') {
    targetIds = pruneRedundantCategoryIds(input.categoryIds, input.categoryOptions)
  } else if (input.target === 'PRODUCT') {
    targetIds = uniqueIds(input.productItems.map((p) => p.id))
  } else if (input.target === 'VARIANT') {
    targetIds = uniqueIds(input.variantItems.map((v) => v.id))
  }

  return {
    targetIds,
    excludeCategoryIds: pruneRedundantCategoryIds(
      input.excludeCategoryIds,
      input.categoryOptions,
    ),
    excludeProductIds: uniqueIds(input.excludeProducts.map((p) => p.id)),
    excludeVariantIds: uniqueIds(input.excludeVariants.map((v) => v.id)),
  }
}
