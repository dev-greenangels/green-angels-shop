'use client'

import { useState } from 'react'

import { FreshPhotoCard } from '@/components/catalog/fresh-photo-card'
import { FreshPhotoLightbox } from '@/components/catalog/fresh-photo-lightbox'
import { PRODUCT_CARD_CAROUSEL_SLOT_CLASS } from '@/lib/catalog/product-card-layout'
import type { CatalogPhotoItem } from '@/lib/variant-photos/types'
import { cn } from '@/lib/utils'

type FreshPlantPhotosCarouselProps = {
  photos: CatalogPhotoItem[]
  locale: string
}

export function FreshPlantPhotosCarousel({ photos, locale }: FreshPlantPhotosCarouselProps) {
  const [selected, setSelected] = useState<CatalogPhotoItem | null>(null)

  return (
    <>
      <div className="-mx-[var(--site-shell-padding-x)] overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-3 px-[var(--site-shell-padding-x)] sm:gap-3.5 md:gap-4">
          {photos.map((photo) => (
            <FreshPhotoCard
              key={photo.id}
              photo={photo}
              locale={locale}
              onImageClick={() => setSelected(photo)}
              className={cn(
                PRODUCT_CARD_CAROUSEL_SLOT_CLASS,
                'group h-full w-[78vw] max-w-[22rem] sm:w-[18.5rem] md:w-[19.5rem] lg:w-[20.5rem]',
              )}
            />
          ))}
        </div>
      </div>

      <FreshPhotoLightbox photo={selected} onClose={() => setSelected(null)} />
    </>
  )
}
