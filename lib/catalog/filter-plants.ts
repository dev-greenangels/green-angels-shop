import type { CatalogFilterDefinitions } from '@/lib/backstage/characteristics'
import { serializeCatalogFilters } from '@/lib/backstage/characteristics'

export type CatalogPriceRange = {
  min: number | null
  max: number | null
}

export type CatalogPriceBounds = {
  min: number
  max: number
}

export type CatalogFilters = {
  characteristics: Record<string, string[]>
  variantAttributes: Record<string, string[]>
  price: CatalogPriceRange
}

export type CatalogActiveFilterChip = {
  id: string
  label: string
  group: 'price' | 'characteristics' | 'variantAttributes'
  slug?: string
  value?: string
}

export function emptyCatalogFilters(): CatalogFilters {
  return { characteristics: {}, variantAttributes: {}, price: { min: null, max: null } }
}

export function resolveCatalogPriceRange(
  price: CatalogPriceRange,
  bounds: CatalogPriceBounds,
): { min: number; max: number } {
  return {
    min: price.min ?? bounds.min,
    max: price.max ?? bounds.max,
  }
}

export function isCatalogPriceFilterActive(
  price: CatalogPriceRange,
  bounds: CatalogPriceBounds,
): boolean {
  if (bounds.max <= bounds.min) return false
  const resolved = resolveCatalogPriceRange(price, bounds)
  return resolved.min > bounds.min || resolved.max < bounds.max
}

export function hasActiveCatalogFilters(
  filters: CatalogFilters,
  bounds?: CatalogPriceBounds,
): boolean {
  return (
    Object.values(filters.characteristics).some((values) => values.length > 0) ||
    Object.values(filters.variantAttributes).some((values) => values.length > 0) ||
    (bounds
      ? isCatalogPriceFilterActive(filters.price, bounds)
      : filters.price.min != null || filters.price.max != null)
  )
}

export function serializeCatalogFiltersForListing(
  filters: CatalogFilters,
  _bounds?: CatalogPriceBounds,
) {
  return serializeCatalogFilters(filters)
}

export function countActiveCatalogFilters(
  filters: CatalogFilters,
  bounds?: CatalogPriceBounds,
): number {
  let count =
    Object.values(filters.characteristics).reduce((sum, values) => sum + values.length, 0) +
    Object.values(filters.variantAttributes).reduce((sum, values) => sum + values.length, 0)
  if (bounds && isCatalogPriceFilterActive(filters.price, bounds)) {
    count += 1
  }
  return count
}

export function toggleCatalogFilterValue(
  filters: CatalogFilters,
  group: 'characteristics' | 'variantAttributes',
  slug: string,
  value: string,
): CatalogFilters {
  const current = filters[group][slug] ?? []
  const nextValues = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]

  return {
    ...filters,
    [group]: {
      ...filters[group],
      [slug]: nextValues,
    },
  }
}

export function toggleVariantAttributeGroup(
  filters: CatalogFilters,
  attributeSlug: string,
  valueSlugs: string[],
): CatalogFilters {
  const current = filters.variantAttributes[attributeSlug] ?? []
  const allSelected =
    valueSlugs.length > 0 && valueSlugs.every((slug) => current.includes(slug))

  const nextValues = allSelected
    ? current.filter((slug) => !valueSlugs.includes(slug))
    : [...new Set([...current, ...valueSlugs])]

  return {
    ...filters,
    variantAttributes: {
      ...filters.variantAttributes,
      [attributeSlug]: nextValues,
    },
  }
}

export function getVariantAttributeGroupCheckState(
  selected: string[],
  valueSlugs: string[],
): boolean | 'indeterminate' {
  if (!valueSlugs.length) return false
  const selectedCount = valueSlugs.filter((slug) => selected.includes(slug)).length
  if (selectedCount === 0) return false
  if (selectedCount === valueSlugs.length) return true
  return 'indeterminate'
}

export function setCatalogPriceRange(
  filters: CatalogFilters,
  min: number,
  max: number,
  bounds: CatalogPriceBounds,
): CatalogFilters {
  const nextMin = min <= bounds.min ? null : min
  const nextMax = max >= bounds.max ? null : max

  return {
    ...filters,
    price: {
      min: nextMin,
      max: nextMax,
    },
  }
}

export function catalogPriceStep(bounds: CatalogPriceBounds): number {
  const span = bounds.max - bounds.min
  if (span <= 100) return 1
  if (span <= 1_000) return 10
  if (span <= 10_000) return 50
  return 100
}

export function adjustCatalogPriceRange(
  range: { min: number; max: number },
  bound: 'min' | 'max',
  direction: -1 | 1,
  bounds: CatalogPriceBounds,
): { min: number; max: number } {
  const step = catalogPriceStep(bounds) * direction
  if (bound === 'min') {
    const nextMin = Math.min(bounds.max, Math.max(bounds.min, range.min + step))
    return { min: Math.min(nextMin, range.max), max: range.max }
  }
  const nextMax = Math.min(bounds.max, Math.max(bounds.min, range.max + step))
  return { min: range.min, max: Math.max(nextMax, range.min) }
}

export function removeCatalogFilterChip(
  filters: CatalogFilters,
  chip: CatalogActiveFilterChip,
  bounds: CatalogPriceBounds,
): CatalogFilters {
  if (chip.group === 'price') {
    return {
      ...filters,
      price: { min: null, max: null },
    }
  }

  if (!chip.slug || !chip.value) return filters

  return toggleCatalogFilterValue(filters, chip.group, chip.slug, chip.value)
}

export function clearCatalogFilters(): CatalogFilters {
  return emptyCatalogFilters()
}

export function buildCatalogActiveFilterChips(
  filters: CatalogFilters,
  definitions: CatalogFilterDefinitions,
  bounds: CatalogPriceBounds,
  formatPrice: (amount: number) => string,
): CatalogActiveFilterChip[] {
  const chips: CatalogActiveFilterChip[] = []

  if (isCatalogPriceFilterActive(filters.price, bounds)) {
    const resolved = resolveCatalogPriceRange(filters.price, bounds)
    const minLabel = formatPrice(resolved.min)
    const maxLabel = formatPrice(resolved.max)
    chips.push({
      id: 'price',
      group: 'price',
      label: `${minLabel} – ${maxLabel}`,
    })
  }

  for (const attribute of definitions.variantAttributes) {
    for (const valueSlug of filters.variantAttributes[attribute.slug] ?? []) {
      const value = attribute.values.find((item) => item.slug === valueSlug)
      chips.push({
        id: `attr-${attribute.slug}-${valueSlug}`,
        group: 'variantAttributes',
        slug: attribute.slug,
        value: valueSlug,
        label: value?.label ?? valueSlug,
      })
    }
  }

  for (const characteristic of definitions.characteristics) {
    for (const optionSlug of filters.characteristics[characteristic.slug] ?? []) {
      const option = characteristic.options.find((item) => item.slug === optionSlug)
      chips.push({
        id: `char-${characteristic.slug}-${optionSlug}`,
        group: 'characteristics',
        slug: characteristic.slug,
        value: optionSlug,
        label: option?.label ?? optionSlug,
      })
    }
  }

  return chips
}
