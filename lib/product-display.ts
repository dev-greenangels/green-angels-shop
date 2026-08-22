import type { ProductDisplayCharacteristic, ProductVariant } from '@/lib/types'

/**
 * Product-page characteristic strip: plant characteristics only.
 * Size / marking attribute icons render next to the size label, not here.
 */
export function mergeProductPageDisplayItems(
  characteristics: ProductDisplayCharacteristic[],
  _variant?: Pick<ProductVariant, 'displayAttributes'> | null,
): ProductDisplayCharacteristic[] {
  return characteristics
}
