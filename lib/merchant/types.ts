export type MerchantVariantOption = {
  name: string
  value: string
}

export type MerchantFeedItem = {
  id: string
  mpn: string
  itemGroupId: string
  title: string
  description: string
  link: string
  imageLink: string
  additionalImageLinks: string[]
  availability: 'in_stock'
  price: string
  condition: 'new'
  brand: string
  googleProductCategory: string
  productType: string | null
  variantOptions: MerchantVariantOption[]
}

export type MerchantCatalogProduct = {
  id: string
  slug: string
  name: string
  latinName: string | null
  categorySlug: string
  categoryName: string
  description: string | null
  imageUrl: string | null
  images: string[]
  isPublished?: boolean
  variants: Array<{
    id: string
    sku: string | null
    label: string | null
    stock: number
    price: number
    displayAttributes?: Array<{
      name: string
      displayValue: string
      valueType?: string
    }>
  }>
}

export type MerchantMapStats = {
  excludedMissingSku: number
  excludedOutOfStock: number
  excludedInvalidPrice: number
  excludedNoOffer: number
}
