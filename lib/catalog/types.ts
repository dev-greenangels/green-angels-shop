export type CatalogProductListItem = {
  id: string
  slug: string
  name: string
  latinName: string | null
  categoryId: string
  categorySlug: string
  categoryName: string
  price: number | null
  stock: number
  imageUrl: string | null
  pricingMode: 'simple' | 'variants'
  variants: CatalogProductVariant[]
  characteristics: {
    sunRequirement?: string
    soilType?: string
    hardinessZone?: string
    wateringNeeds?: string
    height?: string
  }
  createdAt: string
  maxDiscountPercent?: number | null
}

/** Server-resolved absolute unit prices (commercial ladder). */
export type CatalogVariantPriceTier = {
  minQuantity: number
  unitPrice: number
}

export type CatalogProductVariant = {
  id: string
  sku: string | null
  ean: string | null
  stock: number
  price: number
  label: string | null
  availableFrom: string | null
  priceTiers?: CatalogVariantPriceTier[]
  salesUnitId?: string | null
  salesUnitSymbol?: string | null
  displayAttributes?: Array<{
    id: string
    slug: string
    name: string
    icon: string | null
    unit: string | null
    valueType: string
    displayValue: string
    sortOrder: number
  }>
}

export type CatalogProductDetail = CatalogProductListItem & {
  description: string | null
  searchSynonyms?: string | null
  metaTitle?: string | null
  metaDesc?: string | null
  pricingMode: 'simple' | 'variants'
  variants: CatalogProductVariant[]
  images: string[]
  displayCharacteristics?: Array<{
    id: string
    slug: string
    name: string
    icon: string | null
    unit: string | null
    valueType: string
    displayValue: string
    sortOrder: number
  }>
}

export type CatalogCategory = {
  id: string
  name: string
  slug: string
  latinName?: string
  description: string
  footerDescription?: string
  metaTitle?: string
  metaDesc?: string
  image: string
  plantCount: number
  isStockDepleted?: boolean
}
