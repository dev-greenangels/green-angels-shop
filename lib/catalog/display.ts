import type { CatalogCategoryDisplay } from '@/lib/settings/types'

export function shouldShowSubcategories(
  display: CatalogCategoryDisplay,
  childCount: number,
): boolean {
  if (childCount <= 0) return false
  return display === 'subcategories' || display === 'both'
}

export function shouldShowProducts(
  display: CatalogCategoryDisplay,
  childCount: number,
): boolean {
  if (childCount <= 0) return true
  return display === 'products' || display === 'both'
}
