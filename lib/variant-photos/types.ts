export type VariantPhoto = {
  id: string
  url: string
  alt: string
  createdAt?: string
  photoDate?: string
  plantName?: string
  plantSize?: string
  ean?: string
  fileSizeBytes?: number
}

export type CatalogPhotoItem = {
  id: string
  url: string
  ean: string
  fileSizeBytes: number
  createdAt: string
  updatedAt: string
  appProperties: Record<string, string>
  productId?: string | null
  productSlug?: string | null
  categorySlug?: string | null
  productName?: string | null
  productImageUrl?: string | null
  variantId?: string | null
  price?: number | null
  stock?: number | null
  availableFrom?: string | null
  variantLabel?: string | null
  quantityPrices?: Array<{
    minQuantity: number
    discountType: string
    value: number
    validFrom: string | null
    validTo: string | null
  }>
}

export type CatalogPhotosPage = {
  items: CatalogPhotoItem[]
  total: number
  totalFileSizeBytes?: number
  page: number
  pageSize: number
  totalPages: number
}

export function mapCatalogPhotoToVariantPhoto(photo: CatalogPhotoItem): VariantPhoto {
  const plantNameFromPhoto = photo.productName || photo.appProperties.plantName || ''
  const plantSize = photo.appProperties.plantSize || photo.variantLabel || ''
  const plantName = plantNameFromPhoto
  return {
    id: photo.id,
    url: photo.url,
    alt: [plantName, plantSize].filter(Boolean).join(' · ') || photo.ean,
    createdAt: photo.createdAt,
    photoDate: photo.appProperties.date?.trim() || undefined,
    plantName,
    plantSize,
    ean: photo.ean,
    fileSizeBytes: photo.fileSizeBytes,
  }
}
