'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { FavoriteButton } from '@/components/favorites/favorite-button'
import { ProductCoverImage } from '@/components/product/product-cover-image'
import { Badge } from '@/components/ui/badge'
import { resolveThumbUrl } from '@/lib/media/paths'
import { cn } from '@/lib/utils'

const mainNavButtonClassName = cn(
  'absolute top-1/2 z-[2] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full',
  'bg-black/50 text-white',
  'transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
)

const thumbNavButtonClassName = cn(
  'absolute top-1/2 z-[2] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full',
  'bg-black/50 text-white',
  'transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
)

type ProductImageGalleryProps = {
  images: string[]
  productId: string
  productName: string
  isNew?: boolean
}

export function ProductImageGallery({
  images,
  productId,
  productName,
  isNew = false,
}: ProductImageGalleryProps) {
  const t = useTranslations('product')
  const [selectedImage, setSelectedImage] = useState(0)
  const [canScrollThumbsPrev, setCanScrollThumbsPrev] = useState(false)
  const [canScrollThumbsNext, setCanScrollThumbsNext] = useState(false)
  const thumbStripRef = useRef<HTMLDivElement>(null)

  const hasMultiple = images.length > 1
  const safeIndex = Math.min(selectedImage, Math.max(0, images.length - 1))

  const updateThumbScrollState = useCallback(() => {
    const el = thumbStripRef.current
    if (!el) {
      setCanScrollThumbsPrev(false)
      setCanScrollThumbsNext(false)
      return
    }
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanScrollThumbsPrev(el.scrollLeft > 2)
    setCanScrollThumbsNext(maxScroll > 2 && el.scrollLeft < maxScroll - 2)
  }, [])

  useEffect(() => {
    setSelectedImage(0)
  }, [images])

  useEffect(() => {
    const el = thumbStripRef.current
    if (!el || !hasMultiple) return

    updateThumbScrollState()
    el.addEventListener('scroll', updateThumbScrollState, { passive: true })
    const observer = new ResizeObserver(updateThumbScrollState)
    observer.observe(el)

    return () => {
      el.removeEventListener('scroll', updateThumbScrollState)
      observer.disconnect()
    }
  }, [hasMultiple, images.length, updateThumbScrollState])

  useEffect(() => {
    const el = thumbStripRef.current
    if (!el) return
    const thumb = el.querySelector<HTMLElement>(`[data-thumb-index="${safeIndex}"]`)
    thumb?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
  }, [safeIndex])

  const goPrev = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length)
  }

  const goNext = () => {
    setSelectedImage((prev) => (prev + 1) % images.length)
  }

  const scrollThumbs = (direction: 'prev' | 'next') => {
    const el = thumbStripRef.current
    if (!el) return
    const delta = Math.max(120, Math.floor(el.clientWidth * 0.7))
    el.scrollBy({ left: direction === 'next' ? delta : -delta, behavior: 'smooth' })
  }

  if (images.length === 0) {
    return (
      <div className="relative aspect-square w-full max-w-full overflow-hidden rounded-xl bg-muted">
        <ProductCoverImage src={null} alt={productName} imageClassName="object-cover" />
      </div>
    )
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-4">
      <div className="relative aspect-square w-full max-w-full overflow-hidden rounded-xl bg-muted">
        <ProductCoverImage
          src={images[safeIndex]}
          alt={productName}
          imageClassName="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        {isNew ? (
          <Badge className="absolute left-3 top-3 z-[2] bg-primary text-primary-foreground">
            {t('newBadge')}
          </Badge>
        ) : null}
        <div className="absolute bottom-2 right-2 z-[2]">
          <FavoriteButton productId={productId} tone="overlay" />
        </div>

        {hasMultiple ? (
          <>
            <button
              type="button"
              className={cn(mainNavButtonClassName, 'left-2')}
              onClick={goPrev}
              aria-label={t('prevPhoto')}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              className={cn(mainNavButtonClassName, 'right-2')}
              onClick={goNext}
              aria-label={t('nextPhoto')}
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
            </button>
            <span
              className="absolute bottom-2 left-2 z-[2] rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-medium tabular-nums leading-none text-white"
              aria-live="polite"
            >
              {safeIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {hasMultiple ? (
        <div className="relative max-w-full">
          {canScrollThumbsPrev ? (
            <button
              type="button"
              className={cn(thumbNavButtonClassName, 'left-0')}
              onClick={() => scrollThumbs('prev')}
              aria-label={t('scrollThumbsBack')}
            >
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          ) : null}

          <div
            ref={thumbStripRef}
            className={cn(
              'flex max-w-full gap-2.5 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              canScrollThumbsPrev ? 'pl-8' : 'pl-0',
              canScrollThumbsNext ? 'pr-8' : 'pr-0',
            )}
          >
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                data-thumb-index={index}
                onClick={() => setSelectedImage(index)}
                aria-label={t('photoN', { n: index + 1 })}
                aria-current={index === safeIndex ? 'true' : undefined}
                className={cn(
                  'relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:h-20 sm:w-20',
                  index === safeIndex ? 'border-primary' : 'border-transparent opacity-80 hover:opacity-100',
                )}
              >
                <ProductCoverImage
                  src={resolveThumbUrl(image)}
                  alt={`${productName} ${index + 1}`}
                  imageClassName="object-cover"
                  sizes="80px"
                  logoClassName="p-2"
                />
              </button>
            ))}
          </div>

          {canScrollThumbsNext ? (
            <button
              type="button"
              className={cn(thumbNavButtonClassName, 'right-0')}
              onClick={() => scrollThumbs('next')}
              aria-label={t('scrollThumbsForward')}
            >
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
