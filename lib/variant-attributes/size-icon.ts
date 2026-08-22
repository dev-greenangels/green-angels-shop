import type { ProductVariant } from '@/lib/types'
import { resolveVariantAttributeIcon } from '@/lib/variant-attributes/icons'

/** First nursery icon on a variant’s show-on-page attributes (size mark). */
export function getVariantSizeIconName(
  variant: Pick<ProductVariant, 'displayAttributes'> | null | undefined,
): string | null {
  for (const attr of variant?.displayAttributes ?? []) {
    if (attr.icon && resolveVariantAttributeIcon(attr.icon)) {
      return attr.icon
    }
  }
  return null
}
