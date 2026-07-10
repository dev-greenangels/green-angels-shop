import {
  DEFAULT_CATEGORY_GRID_COLUMNS,
  DEFAULT_PRODUCT_GRID_COLUMNS,
  normalizeGridColumns,
} from '@/lib/catalog/grid-columns'
import { DEFAULT_CATALOG_SETTINGS } from '@/lib/settings/defaults'
import {
  DEFAULT_CATALOG_FILTERS_VISIBILITY,
  DEFAULT_PLANTS_ALPHABET_FILTERS_VISIBILITY,
  type CatalogFiltersVisibilitySettings,
} from '@/lib/catalog/filter-visibility'
import type { CatalogPageSettings } from '@/lib/settings/types'

function normalizeSlugList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

export function normalizeCatalogFiltersVisibility(
  input: Partial<CatalogFiltersVisibilitySettings> | undefined,
  defaults: CatalogFiltersVisibilitySettings,
): CatalogFiltersVisibilitySettings {
  return {
    price: input?.price ?? defaults.price,
    showAllCharacteristics: input?.showAllCharacteristics ?? defaults.showAllCharacteristics,
    characteristicSlugs: normalizeSlugList(input?.characteristicSlugs ?? defaults.characteristicSlugs),
    showAllVariantAttributes:
      input?.showAllVariantAttributes ?? defaults.showAllVariantAttributes,
    variantAttributeSlugs: normalizeSlugList(
      input?.variantAttributeSlugs ?? defaults.variantAttributeSlugs,
    ),
  }
}

export function normalizeCatalogPageSettings(
  input: Partial<CatalogPageSettings> | undefined,
): CatalogPageSettings {
  const categoryDisplay = input?.categoryDisplay ?? DEFAULT_CATALOG_SETTINGS.categoryDisplay
  const validDisplay =
    categoryDisplay === 'subcategories' ||
    categoryDisplay === 'products' ||
    categoryDisplay === 'both'
      ? categoryDisplay
      : DEFAULT_CATALOG_SETTINGS.categoryDisplay

  return {
    categoryDisplay: validDisplay,
    productGridColumns: normalizeGridColumns(
      input?.productGridColumns,
      DEFAULT_PRODUCT_GRID_COLUMNS,
    ),
    categoryGridColumns: normalizeGridColumns(
      input?.categoryGridColumns,
      DEFAULT_CATEGORY_GRID_COLUMNS,
    ),
    catalogFilters: normalizeCatalogFiltersVisibility(
      input?.catalogFilters,
      DEFAULT_CATALOG_FILTERS_VISIBILITY,
    ),
    plantsAlphabetFilters: normalizeCatalogFiltersVisibility(
      input?.plantsAlphabetFilters,
      DEFAULT_PLANTS_ALPHABET_FILTERS_VISIBILITY,
    ),
  }
}
