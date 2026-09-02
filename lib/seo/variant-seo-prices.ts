import { getMinVariantPrice } from '@/lib/product-pricing'
import { canOrderVariant } from '@/lib/plant-variants'
import type { Plant } from '@/lib/types'

/**
 * Stored (Nest) unit prices used for JSON-LD Offer / AggregateOffer.
 * Prefers purchasable variants; falls back to in-stock, then any variant.
 */
export function resolveSeoVariantStoredPrices(plant: Plant): number[] {
  const variants = plant.variants ?? []
  if (!variants.length) {
    return plant.price > 0 ? [plant.price] : []
  }

  const purchasable = variants.filter(canOrderVariant)
  const inStock = variants.filter((variant) => variant.stock > 0)
  const pool = purchasable.length > 0 ? purchasable : inStock.length > 0 ? inStock : variants

  const prices = pool.map((variant) => getMinVariantPrice(variant)).filter((price) => price > 0)
  return prices.length > 0 ? prices : plant.price > 0 ? [plant.price] : []
}
