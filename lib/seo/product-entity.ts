import type { Plant } from '@/lib/types'

/** Contract for a later Product JSON-LD task — no Schema.org emit here. */
export type ProductSeoEntity = {
  name: string
  description: string
  image: string | null
  url: string
  locale: string
  sku: string | null
  brand: string | null
  price: number | null
  currency: string | null
  availability: 'in_stock' | 'out_of_stock' | 'preorder' | null
}

export function toProductSeoEntity(input: {
  plant: Plant
  url: string
  locale: string
  brand?: string | null
  currency?: string | null
}): ProductSeoEntity {
  const variants = input.plant.variants ?? []
  const inStock = variants.some((variant) => variant.stock > 0) || input.plant.stock > 0
  const preorder = variants.some((variant) => Boolean(variant.availableFrom))

  return {
    name: input.plant.name,
    description: input.plant.shortDescription || input.plant.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    image: input.plant.images.find((url) => url && !url.includes('placeholder')) ?? input.plant.images[0] ?? null,
    url: input.url,
    locale: input.locale,
    sku: input.plant.sku || variants[0]?.sku || null,
    brand: input.brand ?? null,
    price: input.plant.price > 0 ? input.plant.price : null,
    currency: input.currency ?? null,
    availability: inStock ? 'in_stock' : preorder ? 'preorder' : 'out_of_stock',
  }
}
