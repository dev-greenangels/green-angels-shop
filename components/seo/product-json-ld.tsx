import { JsonLdScript } from '@/components/seo/json-ld-script'
import {
  buildProductStructuredData,
  type ProductStructuredDataContext,
} from '@/lib/seo/build-product-structured-data'
import type { Plant } from '@/lib/types'

export function ProductJsonLd(props: {
  plant: Plant
  productUrl: string
  locale: string
  brand: string
  images?: string[]
  latinName?: string | null
  alternateNames?: string[]
  ctx: ProductStructuredDataContext
}) {
  return (
    <JsonLdScript
      data={buildProductStructuredData({
        plant: props.plant,
        productUrl: props.productUrl,
        locale: props.locale,
        brand: props.brand,
        images: props.images,
        latinName: props.latinName,
        alternateNames: props.alternateNames,
        ctx: props.ctx,
      })}
    />
  )
}
