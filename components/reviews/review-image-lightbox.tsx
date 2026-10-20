'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type ReviewImageLightboxProps = {
  /** Full-size / main URLs (lightbox). */
  images: string[]
  /** Optional list thumbs; defaults to `images`. */
  thumbs?: string[]
  alt: string
  className?: string
}

export function ReviewImageLightbox({ images, thumbs, alt, className }: ReviewImageLightboxProps) {
  const t = useTranslations('reviews')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const activeImage = activeIndex === null ? null : images[activeIndex]
  const strip = thumbs?.length === images.length ? thumbs : images

  if (images.length === 0) return null

  return (
    <>
      <div className={cn('flex flex-wrap gap-2', className)}>
        {strip.map((src, index) => (
          <button
            key={`${images[index] ?? src}-${index}`}
            type="button"
            className="relative h-14 w-14 min-h-11 min-w-11 overflow-hidden rounded-md border border-border/80 bg-muted/30 transition hover:border-primary/40 hover:ring-2 hover:ring-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-16 sm:w-16"
            onClick={() => setActiveIndex(index)}
            aria-label={t('openPhoto', { n: index + 1 })}
          >
            <Image src={src} alt={`${alt} ${index + 1}`} fill className="object-cover" sizes="64px" />
          </button>
        ))}
      </div>

      <Dialog open={activeImage !== null} onOpenChange={(open) => !open && setActiveIndex(null)}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-2 shadow-none sm:max-w-4xl">
          <DialogTitle className="sr-only">{t('lightboxTitle')}</DialogTitle>
          {activeImage ? (
            <div className="relative mx-auto aspect-[4/3] w-full max-h-[80vh] overflow-hidden rounded-xl border bg-background">
              <Image
                src={activeImage}
                alt={alt}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 896px"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
