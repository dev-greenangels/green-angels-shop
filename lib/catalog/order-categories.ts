import type { CatalogCategory } from '@/lib/catalog/types'

export function orderCategoriesBySlugs(
  categories: CatalogCategory[],
  slugs: string[],
  limit: number,
): CatalogCategory[] {
  if (!slugs.length) {
    return categories.slice(0, limit)
  }

  const bySlug = new Map(categories.map((category) => [category.slug, category]))
  const ordered: CatalogCategory[] = []

  for (const slug of slugs) {
    const category = bySlug.get(slug)
    if (category) ordered.push(category)
  }

  if (ordered.length < limit) {
    const usedIds = new Set(ordered.map((category) => category.id))
    for (const category of categories) {
      if (ordered.length >= limit) break
      if (!usedIds.has(category.id)) ordered.push(category)
    }
  }

  return ordered.slice(0, limit)
}
