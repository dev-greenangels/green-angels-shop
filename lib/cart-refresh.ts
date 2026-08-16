import { resolveCartLineVariant } from '@/lib/cart-normalize'
import { fetchCatalogProductBySlug } from '@/lib/catalog/products'
import { isAppLocale } from '@/i18n/routing'
import { getUnitPriceForQuantity } from '@/lib/product-pricing'
import type { CartItem } from '@/lib/types'

function clientCatalogLocale(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const lang = document.documentElement.lang?.trim()
  return lang && isAppLocale(lang) ? lang : undefined
}

/** Оновлює знімки товарів у кошику (залишки, варіанти) з каталогу. */
export async function refreshCartItemPlants(items: CartItem[]): Promise<CartItem[]> {
  if (!items.length) return items

  const locale = clientCatalogLocale()
  const uniqueSlugs = [...new Set(items.map((item) => item.plant.slug))]
  const freshPlants = await Promise.all(
    uniqueSlugs.map(async (slug) => {
      const result = await fetchCatalogProductBySlug(slug, locale)
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
    const freshUnit =
      variant && variant.basePrice > 0
        ? getUnitPriceForQuantity(variant, item.quantity)
        : null
    return {
      ...item,
      plant: freshPlant,
      variantId,
      variantLabel: variant?.label ?? item.variantLabel,
      ...(freshUnit != null && freshUnit > 0 ? { unitPrice: freshUnit } : {}),
    }
  })
}
