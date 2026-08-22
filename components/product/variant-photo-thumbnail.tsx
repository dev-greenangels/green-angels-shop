'use client'

import Image from 'next/image'
import { Camera, ZoomIn } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'

type VariantPhotoThumbnailProps = {
  /** When missing, render a muted placeholder (still clickable). */
  imageUrl?: string | null
  alt: string
  onClick: () => void
  className?: string
}

export function VariantPhotoThumbnail({
  imageUrl,
  alt,
  onClick,
  className,
}: VariantPhotoThumbnailProps) {
  const t = useTranslations('product')
  const trimmed = imageUrl?.trim() || ''
  const hasImage = Boolean(trimmed)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={hasImage ? t('viewPhoto', { alt }) : t('viewFreshPhotos', { alt })}
      className={cn(
        'group relative h-[4.75rem] w-[4.25rem] shrink-0 overflow-hidden rounded-lg',
        'border-2 border-border/80 bg-muted shadow-sm ring-offset-background',
        'transition hover:border-primary/70 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className,
      )}
    >
      {hasImage ? (
        <Image
          src={trimmed}
          alt={alt}
          fill
          sizes="68px"
          unoptimized
          className="object-cover transition-transform duration-200 group-hover:scale-105"
        />
      ) : (
        <span
          className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-b from-muted via-secondary/15 to-accent/30 text-muted-foreground"
          aria-hidden
        >
          <Camera className="h-5 w-5 opacity-70" />
        </span>
      )}
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          hasImage
            ? 'bg-gradient-to-t from-black/45 via-black/10 to-transparent opacity-80 transition group-hover:opacity-100'
            : 'bg-black/5 opacity-70 transition group-hover:opacity-100',
        )}
        aria-hidden
      >
        <span
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm',
            hasImage ? 'bg-black/45 text-white' : 'bg-background/80 text-foreground shadow-sm',
          )}
        >
          <ZoomIn className="h-4 w-4" />
        </span>
      </span>
    </button>
  )
}
