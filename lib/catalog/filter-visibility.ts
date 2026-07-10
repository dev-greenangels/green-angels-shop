import type { CatalogFilterDefinitions } from '@/lib/backstage/characteristics'

export type CatalogFiltersVisibilitySettings = {
  price: boolean
  showAllCharacteristics: boolean
  characteristicSlugs: string[]
  showAllVariantAttributes: boolean
  variantAttributeSlugs: string[]
}

export const DEFAULT_CATALOG_FILTERS_VISIBILITY: CatalogFiltersVisibilitySettings = {
  price: true,
  showAllCharacteristics: true,
  characteristicSlugs: [],
  showAllVariantAttributes: true,
  variantAttributeSlugs: [],
}

export const DEFAULT_PLANTS_ALPHABET_FILTERS_VISIBILITY: CatalogFiltersVisibilitySettings = {
  price: true,
  showAllCharacteristics: false,
  characteristicSlugs: [],
  showAllVariantAttributes: false,
  variantAttributeSlugs: ['konteyner'],
}

export function applyCatalogFiltersVisibility(
  definitions: CatalogFilterDefinitions,
  visibility: CatalogFiltersVisibilitySettings,
): CatalogFilterDefinitions {
  const characteristics = visibility.showAllCharacteristics
    ? definitions.characteristics
    : definitions.characteristics.filter((item) =>
        visibility.characteristicSlugs.includes(item.slug),
      )

  const variantAttributes = visibility.showAllVariantAttributes
    ? definitions.variantAttributes
    : definitions.variantAttributes.filter((item) =>
        visibility.variantAttributeSlugs.includes(item.slug),
      )

  return {
    ...definitions,
    characteristics,
    variantAttributes,
  }
}

export function hasVisibleCatalogFilters(visibility: CatalogFiltersVisibilitySettings): boolean {
  return (
    visibility.price ||
    visibility.showAllCharacteristics ||
    visibility.characteristicSlugs.length > 0 ||
    visibility.showAllVariantAttributes ||
    visibility.variantAttributeSlugs.length > 0
  )
}
