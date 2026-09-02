import type { ProductDisplayCharacteristic, ProductVariant } from '@/lib/types'

import { canOrderVariant } from '@/lib/plant-variants'

/** Schema.org availability URL for a single purchasable variant row. */
export function variantSeoAvailability(
  variant: ProductVariant,
): 'in_stock' | 'out_of_stock' | 'preorder' {
  if (variant.stock > 0) return 'in_stock'
  if (canOrderVariant(variant)) return 'preorder'
  return 'out_of_stock'
}

const VARIES_BY_COLOR = 'https://schema.org/color'
const VARIES_BY_SIZE = 'https://schema.org/size'

function mapValueTypeToVariesBy(valueType: string): string | null {
  switch (valueType) {
    case 'COLOR':
      return VARIES_BY_COLOR
    case 'CONTAINER':
    case 'RANGE':
    case 'NUMBER':
      return VARIES_BY_SIZE
    default:
      return null
  }
}

/** Attributes whose values differ across variants → Google variesBy URLs. */
export function collectProductVariesBy(variants: ProductVariant[]): string[] {
  const valuesBySlug = new Map<string, Set<string>>()
  const typeBySlug = new Map<string, string>()

  for (const variant of variants) {
    for (const attr of variant.displayAttributes ?? []) {
      const value = attr.displayValue?.trim()
      if (!value) continue
      if (!valuesBySlug.has(attr.slug)) {
        valuesBySlug.set(attr.slug, new Set())
        typeBySlug.set(attr.slug, attr.valueType)
      }
      valuesBySlug.get(attr.slug)!.add(value)
    }
  }

  const varies: string[] = []
  for (const [slug, values] of valuesBySlug) {
    if (values.size <= 1) continue
    const mapped = mapValueTypeToVariesBy(typeBySlug.get(slug) ?? '')
    if (mapped && !varies.includes(mapped)) varies.push(mapped)
  }

  if (varies.length === 0 && variants.length > 1) {
    const labels = new Set(variants.map((variant) => variant.label.trim()).filter(Boolean))
    if (labels.size > 1) varies.push(VARIES_BY_SIZE)
  }

  return varies
}

export function variantDisplayName(productName: string, variant: ProductVariant): string {
  const label = variant.label.trim()
  if (!label) return productName.trim()
  if (productName.trim().toLowerCase().includes(label.toLowerCase())) return productName.trim()
  return `${productName.trim()} — ${label}`
}

/** Variant-level Product properties (color, size) from display attributes. */
export function variantSchemaProperties(variant: ProductVariant): Record<string, string> {
  const props: Record<string, string> = {}

  for (const attr of variant.displayAttributes ?? []) {
    const value = attr.displayValue?.trim()
    if (!value) continue
    if (attr.valueType === 'COLOR' && !props.color) {
      props.color = value
    }
  }

  const sizeParts = (variant.displayAttributes ?? [])
    .filter((attr) => ['CONTAINER', 'RANGE', 'NUMBER'].includes(attr.valueType))
    .map((attr) => attr.displayValue.trim())
    .filter(Boolean)

  if (sizeParts.length > 0) {
    props.size = sizeParts.join(' / ')
  } else if (variant.label.trim()) {
    props.size = variant.label.trim()
  }

  return props
}

export function productGroupId(plant: { id: string; sku?: string | null }): string {
  const sku = plant.sku?.trim()
  return sku || plant.id
}
