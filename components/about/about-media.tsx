'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

import {
  CATEGORY_DEFAULT_IMAGE,
  isCategoryPlaceholderImage,
} from '@/lib/category-image'
import { resolveCmsDisplayImageUrl } from '@/lib/media/cms-image-url'
import { cn } from '@/lib/utils'

type AboutImageProps = {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

export function AboutImage({ src, alt, className, priority }: AboutImageProps) {
  const [failed, setFailed] = useState(false)
  const resolvedSrc = resolveCmsDisplayImageUrl(src)
  const displaySrc =
    failed || isCategoryPlaceholderImage(resolvedSrc)
      ? CATEGORY_DEFAULT_IMAGE
      : resolvedSrc

  useEffect(() => {
    setFailed(false)
  }, [src])

  return (
    <div className={cn('relative overflow-hidden bg-secondary', className)}>
      <Image
        src={displaySrc}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

type AboutVideoEmbedProps = {
  src: string
  title: string
  className?: string
}

export function AboutVideoEmbed({ src, title, className }: AboutVideoEmbedProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border/60 bg-black shadow-sm',
        className,
      )}
    >
      <div className="aspect-video">
        <iframe
          title={title}
          src={src}
          className="h-full w-full border-0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  )
}
