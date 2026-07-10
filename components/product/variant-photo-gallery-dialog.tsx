'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import type { VariantPhoto } from '@/lib/variant-photos/types'
import { cn } from '@/lib/utils'

const galleryNavButtonClassName = cn(
  'absolute top-1/2 z-10 -translate-y-1/2 rounded-full',
  'bg-black/55 p-2 text-white shadow-md backdrop-blur-sm',
  'transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80',
  'disabled:pointer-events-none disabled:opacity-30',
)

const thumbStripNavButtonClassName = cn(
  'absolute top-1/2 z-10 -translate-y-1/2 rounded-full',
  'bg-black/55 p-1 text-white shadow-md backdrop-blur-sm',
  'transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80',
)

function formatPhotoDate(value: string | null | undefined, locale: string) {
  if (!value?.trim()) return null
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

type VariantPhotoGalleryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  photos: VariantPhoto[]
  initialIndex?: number
  title?: string
  plantName?: string
  variantLabel?: string
}

export function VariantPhotoGalleryDialog({
  open,
  onOpenChange,
  photos,
  initialIndex = 0,
  title,
  plantName,
  variantLabel,
}: VariantPhotoGalleryDialogProps) {
  const locale = useLocale()
  const t = useTranslations('product')
  const tCatalog = useTranslations('catalog')
  const tc = useTranslations('common')
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const thumbStripRef = useRef<HTMLDivElement>(null)
  const [canScrollThumbsPrev, setCanScrollThumbsPrev] = useState(false)
  const [canScrollThumbsNext, setCanScrollThumbsNext] = useState(false)

  useEffect(() => {
    if (open) setActiveIndex(initialIndex)
  }, [open, initialIndex])

  const photoCount = photos.length
  const hasMultiple = photoCount > 1
  const activePhoto = photos[activeIndex]
  const photoDateLabel = formatPhotoDate(activePhoto?.photoDate, locale)

  const goPrev = useCallback(() => {
    if (!hasMultiple) return
    setActiveIndex((current) => (current - 1 + photoCount) % photoCount)
  }, [hasMultiple, photoCount])

  const goNext = useCallback(() => {
    if (!hasMultiple) return
    setActiveIndex((current) => (current + 1) % photoCount)
  }, [hasMultiple, photoCount])

  const updateThumbScrollState = useCallback(() => {
    const el = thumbStripRef.current
    if (!el) return
    setCanScrollThumbsPrev(el.scrollLeft > 4)
    setCanScrollThumbsNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  const scrollThumbs = useCallback((direction: 'prev' | 'next') => {
    const el = thumbStripRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'next' ? 120 : -120, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, goNext, goPrev])

  useEffect(() => {
    if (!open || !hasMultiple) return

    const el = thumbStripRef.current
    if (!el) return

    const activeThumb = el.querySelector<HTMLElement>(`[data-thumb-index="${activeIndex}"]`)
    activeThumb?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })

    const frame = requestAnimationFrame(updateThumbScrollState)
    return () => cancelAnimationFrame(frame)
  }, [activeIndex, hasMultiple, open, updateThumbScrollState])

  useEffect(() => {
    if (!open || !hasMultiple) return

    const el = thumbStripRef.current
    if (!el) return

    updateThumbScrollState()
    el.addEventListener('scroll', updateThumbScrollState, { passive: true })
    const resizeObserver = new ResizeObserver(updateThumbScrollState)
    resizeObserver.observe(el)

    return () => {
      el.removeEventListener('scroll', updateThumbScrollState)
      resizeObserver.disconnect()
    }
  }, [hasMultiple, open, photos.length, updateThumbScrollState])

  const displayTitle =
    title ||
    [plantName, variantLabel].filter(Boolean).join(' · ') ||
    activePhoto?.alt ||
    t('galleryTitle')
  const titleName = plantName || (title?.includes(' · ') ? title.split(' · ')[0] : title)
  const titleSize =
    variantLabel || (title?.includes(' · ') ? title.split(' · ').slice(1).join(' · ') : undefined)

  if (!activePhoto) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[min(100vw-1rem,28rem)] overflow-visible border-0 bg-transparent p-0 shadow-none sm:max-w-md"
      >
        <div className="relative">
          <button
            type="button"
            className="absolute right-0 top-0 z-[75] inline-flex h-7 w-7 -translate-y-[calc(100%+0.35rem)] items-center justify-center rounded-full bg-black/85 text-white shadow-md transition hover:bg-black sm:h-8 sm:w-8 md:translate-x-[calc(100%+0.5rem)] md:translate-y-0"
            onClick={() => onOpenChange(false)}
            aria-label={tc('close')}
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>

          <div className="overflow-hidden rounded-xl bg-background shadow-xl">
            <DialogTitle className="sr-only">{displayTitle}</DialogTitle>

            <div className="relative bg-muted">
              {hasMultiple ? (
                <span
                  className="absolute left-2 top-2 z-10 rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur-sm sm:text-xs"
                  aria-live="polite"
                >
                  {activeIndex + 1} / {photoCount}
                </span>
              ) : null}

              <div className="flex min-h-[320px] items-center justify-center sm:min-h-[480px]">
                <Image
                  key={activePhoto.id}
                  src={activePhoto.url}
                  alt={activePhoto.alt}
                  width={720}
                  height={960}
                  unoptimized
                  priority
                  className="max-h-[72vh] w-full object-contain"
                  sizes="(max-width: 768px) 90vw, 28rem"
                />
              </div>

              {hasMultiple ? (
                <>
                  <button
                    type="button"
                    className={cn(galleryNavButtonClassName, 'left-2 sm:left-3')}
                    onClick={goPrev}
                    aria-label={t('prevPhoto')}
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  <button
                    type="button"
                    className={cn(galleryNavButtonClassName, 'right-2 sm:right-3')}
                    onClick={goNext}
                    aria-label={t('nextPhoto')}
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </>
              ) : null}
            </div>

            {hasMultiple ? (
              <div className="relative border-t border-border/60 bg-background px-1 py-2 sm:px-1.5">
                {canScrollThumbsPrev ? (
                  <button
                    type="button"
                    className={cn(thumbStripNavButtonClassName, 'left-1')}
                    onClick={() => scrollThumbs('prev')}
                    aria-label={t('scrollThumbsBack')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                ) : null}

                <div
                  ref={thumbStripRef}
                  className={cn(
                    'flex gap-1.5 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                    canScrollThumbsPrev ? 'pl-7' : 'pl-1',
                    canScrollThumbsNext ? 'pr-7' : 'pr-1',
                  )}
                >
                  {photos.map((photo, index) => {
                    const isActive = index === activeIndex
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        data-thumb-index={index}
                        onClick={() => setActiveIndex(index)}
                        aria-label={t('viewPhoto', { alt: photo.alt })}
                        aria-current={isActive ? 'true' : undefined}
                        className={cn(
                          'relative h-11 w-11 shrink-0 overflow-hidden rounded-md border-2 transition sm:h-12 sm:w-12',
                          isActive
                            ? 'border-primary opacity-100 ring-1 ring-primary/30'
                            : 'border-transparent opacity-65 hover:opacity-100',
                        )}
                      >
                        <Image
                          src={photo.url}
                          alt=""
                          fill
                          unoptimized
                          sizes="48px"
                          className="object-cover"
                        />
                      </button>
                    )
                  })}
                </div>

                {canScrollThumbsNext ? (
                  <button
                    type="button"
                    className={cn(thumbStripNavButtonClassName, 'right-1')}
                    onClick={() => scrollThumbs('next')}
                    aria-label={t('scrollThumbsForward')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-1 border-t border-border/60 p-3 sm:p-3.5">
              {titleName ? (
                <p className="text-xs font-medium leading-snug text-foreground sm:text-sm">
                  {titleName}
                  {titleSize ? (
                    <span className="font-normal text-muted-foreground"> · {titleSize}</span>
                  ) : null}
                </p>
              ) : null}
              {photoDateLabel ? (
                <p className="text-xs text-muted-foreground">
                  {tCatalog('freshPhotosPhotoFrom')}{' '}
                  <span className="text-foreground">{photoDateLabel}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
