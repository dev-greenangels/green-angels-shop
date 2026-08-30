'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { FavoriteButton } from '@/components/favorites/favorite-button'
import { ProductCoverImage } from '@/components/product/product-cover-image'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
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
  /** Server-rendered LCP image; shown when the selected URL matches heroImageSrc. */
  heroSlot?: ReactNode
  heroImageSrc?: string | null
}

export function ProductImageGallery({
  images,
  productId,
  productName,
  isNew = false,
  heroSlot,
  heroImageSrc,
}: ProductImageGalleryProps) {
  const t = useTranslations('product')
  const [selectedImage, setSelectedImage] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [canScrollThumbsPrev, setCanScrollThumbsPrev] = useState(false)
  const [canScrollThumbsNext, setCanScrollThumbsNext] = useState(false)
  const thumbStripRef = useRef<HTMLDivElement>(null)

  const hasMultiple = images.length > 1
  const safeIndex = Math.min(selectedImage, Math.max(0, images.length - 1))
  const selectedImageUrl = images[safeIndex]

  const thumbScrollRafRef = useRef<number | null>(null)

  const updateThumbScrollState = useCallback(() => {
    if (thumbScrollRafRef.current != null) return
    thumbScrollRafRef.current = window.requestAnimationFrame(() => {
      thumbScrollRafRef.current = null
      const el = thumbStripRef.current
      if (!el) {
        setCanScrollThumbsPrev(false)
        setCanScrollThumbsNext(false)
        return
      }
      const maxScroll = el.scrollWidth - el.clientWidth
      setCanScrollThumbsPrev(el.scrollLeft > 2)
      setCanScrollThumbsNext(maxScroll > 2 && el.scrollLeft < maxScroll - 2)
    })
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
      if (thumbScrollRafRef.current != null) {
        window.cancelAnimationFrame(thumbScrollRafRef.current)
        thumbScrollRafRef.current = null
      }
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

  const useServerHero =
    Boolean(heroSlot) &&
    Boolean(heroImageSrc) &&
    selectedImageUrl?.trim() === heroImageSrc.trim()

  if (images.length === 0) {
    return (
      <div className="relative mx-auto aspect-[5/6] w-full max-w-[22rem] overflow-hidden rounded-xl bg-muted lg:mx-0 lg:max-w-full">
        <ProductCoverImage src={null} alt={productName} imageClassName="object-contain" />
      </div>
    )
  }

  return (
    <div className="mx-auto min-w-0 w-full max-w-[22rem] space-y-4 lg:mx-0 lg:max-w-full">
      <div className="relative aspect-[5/6] w-full overflow-hidden rounded-xl bg-muted">
        <button
          type="button"
          className="absolute inset-0 z-[1] cursor-zoom-in"
          onClick={() => setGalleryOpen(true)}
          aria-label={t('viewPhoto', { alt: productName })}
        >
          {useServerHero ? (
            heroSlot
          ) : (
            <ProductCoverImage
              src={selectedImageUrl}
              alt={productName}
              imageClassName="object-cover"
              sizes="(max-width: 1024px) 100vw, 22rem"
              priority
            />
          )}
        </button>
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

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="flex h-[min(92dvh,60rem)] max-w-[min(96vw,72rem)] flex-col gap-3 overflow-hidden p-3 sm:p-4">
          <DialogTitle className="sr-only">{t('galleryTitle')}</DialogTitle>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg bg-muted">
            <ProductCoverImage
              src={selectedImageUrl}
              alt={productName}
              imageClassName="object-contain"
              sizes="96vw"
              priority
            />
            {hasMultiple ? (
              <>
                <button
                  type="button"
                  className={cn(mainNavButtonClassName, 'left-2 h-10 w-10 sm:left-4')}
                  onClick={goPrev}
                  aria-label={t('prevPhoto')}
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
                </button>
                <button
                  type="button"
                  className={cn(mainNavButtonClassName, 'right-2 h-10 w-10 sm:right-4')}
                  onClick={goNext}
                  aria-label={t('nextPhoto')}
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
                </button>
                <span className="absolute bottom-3 left-3 z-[2] rounded-md bg-black/55 px-2 py-1 text-xs font-medium tabular-nums text-white">
                  {safeIndex + 1} / {images.length}
                </span>
              </>
            ) : null}
          </div>
          {hasMultiple ? (
            <div className="flex shrink-0 justify-center gap-2 overflow-x-auto py-1">
              {images.map((image, index) => (
                <button
                  key={`dialog-${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  aria-label={t('photoN', { n: index + 1 })}
                  aria-current={index === safeIndex ? 'true' : undefined}
                  className={cn(
                    'relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition sm:h-16 sm:w-16',
                    index === safeIndex
                      ? 'border-primary'
                      : 'border-transparent opacity-70 hover:opacity-100',
                  )}
                >
                  <ProductCoverImage
                    src={resolveThumbUrl(image)}
                    alt=""
                    imageClassName="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
