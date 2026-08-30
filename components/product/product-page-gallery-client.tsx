'use client'

import type { ReactNode } from 'react'

import { ProductImageGallery } from '@/components/product/product-image-gallery'
import { useProductDisplayImages } from '@/lib/variant-photos/use-variant-photos'
import type { Plant } from '@/lib/types'

type ProductPageGalleryClientProps = {
  plant: Plant
  heroSlot?: ReactNode
  heroImageSrc?: string | null
}

export function ProductPageGalleryClient({
  plant,
  heroSlot,
  heroImageSrc,
}: ProductPageGalleryClientProps) {
  const displayImages = useProductDisplayImages(plant)

  return (
    <ProductImageGallery
      images={displayImages}
      productId={plant.id}
      productName={plant.name}
      isNew={plant.isNew}
      heroSlot={heroSlot}
      heroImageSrc={heroImageSrc}
    />
  )
}
