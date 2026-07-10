'use client'

import Image from 'next/image'
import { ZoomIn } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'

type VariantPhotoThumbnailProps = {
  imageUrl: string
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

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('viewPhoto', { alt })}
      className={cn(
        'group relative h-[4.75rem] w-[4.25rem] shrink-0 overflow-hidden rounded-lg',
        'border-2 border-border/80 bg-muted shadow-sm ring-offset-background',
        'transition hover:border-primary/70 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className,
      )}
    >
      <Image
        src={imageUrl}
        alt={alt}
        fill
        sizes="68px"
        unoptimized
        className="object-cover transition-transform duration-200 group-hover:scale-105"
      />
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          'bg-gradient-to-t from-black/45 via-black/10 to-transparent',
          'opacity-80 transition group-hover:opacity-100',
        )}
        aria-hidden
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">
          <ZoomIn className="h-4 w-4" />
        </span>
      </span>
    </button>
  )
}
