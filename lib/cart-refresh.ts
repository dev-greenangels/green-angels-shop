import { resolveCartLineVariant } from '@/lib/cart-normalize'
import { fetchCatalogProductBySlug } from '@/lib/catalog/products'
import type { CartItem } from '@/lib/types'

/** Оновлює знімки товарів у кошику (залишки, варіанти) з каталогу. */
export async function refreshCartItemPlants(items: CartItem[]): Promise<CartItem[]> {
  if (!items.length) return items

  const uniqueSlugs = [...new Set(items.map((item) => item.plant.slug))]
  const freshPlants = await Promise.all(
    uniqueSlugs.map(async (slug) => {
      const result = await fetchCatalogProductBySlug(slug)
      return result.unavailable ? null : result.data
    }),
  )

  const bySlug = new Map(
    freshPlants.filter((plant): plant is NonNullable<typeof plant> => plant !== null).map((plant) => [
      plant.slug,
      plant,
    ]),
  )

  return items.map((item) => {
    const freshPlant = bySlug.get(item.plant.slug)
    if (!freshPlant) return item

    const variant = resolveCartLineVariant(freshPlant, item.variantId)
    const variantId = variant?.id
    return {
      ...item,
      plant: freshPlant,
      variantId,
      variantLabel: variant?.label ?? item.variantLabel,
    }
  })
}
