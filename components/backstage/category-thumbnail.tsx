'use client'

import { useEffect, useState } from 'react'

import { BrandLogo } from '@/components/brand-logo'
import {
  CATEGORY_DEFAULT_IMAGE,
  isCategoryPlaceholderImage,
  resolveBackstageThumbnailSrc,
} from '@/lib/category-image'
import { cn } from '@/lib/utils'

export function CategoryThumbnail({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  const [resolvedSrc, setResolvedSrc] = useState(() => resolveBackstageThumbnailSrc(src))

  useEffect(() => {
    setResolvedSrc(resolveBackstageThumbnailSrc(src))
  }, [src])

  const showLogo = isCategoryPlaceholderImage(resolvedSrc)

  return (
    <div className={cn('overflow-hidden bg-muted', className)}>
      {showLogo ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/90 via-background to-accent/50 p-3">
          <BrandLogo
            alt={alt}
            width={120}
            height={40}
            imgClassName="max-h-8 w-auto max-w-[85%] object-contain opacity-90"
          />
        </div>
      ) : (
        <img
          src={resolvedSrc}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => {
            if (resolvedSrc !== CATEGORY_DEFAULT_IMAGE) {
              setResolvedSrc(CATEGORY_DEFAULT_IMAGE)
            }
          }}
        />
      )}
    </div>
  )
}
