import { JsonLdScript } from '@/components/seo/json-ld-script'
import { buildProductJsonLd } from '@/lib/seo/product-json-ld'
import type { ProductSeoEntity } from '@/lib/seo/product-entity'

export function ProductJsonLd(props: {
  entity: ProductSeoEntity
  images?: string[]
  gtin?: string | null
  latinName?: string | null
  offer?: { price: number; currency: string } | null
}) {
  return (
    <JsonLdScript
      data={buildProductJsonLd({
        entity: props.entity,
        images: props.images,
        gtin: props.gtin,
        latinName: props.latinName,
        offer: props.offer,
      })}
    />
  )
}
