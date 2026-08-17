import type { ProductDisplayCharacteristic, ProductVariant } from '@/lib/types'

export function mergeProductPageDisplayItems(
  characteristics: ProductDisplayCharacteristic[],
  variant?: Pick<ProductVariant, 'displayAttributes'> | null,
): ProductDisplayCharacteristic[] {
  const extras = (variant?.displayAttributes ?? []).map((item) => ({
    ...item,
    id: `attr:${item.id}`,
  }))
  return [...characteristics, ...extras]
}
