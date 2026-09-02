'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

import { CATEGORY_DEFAULT_IMAGE } from '@/lib/category-image'
import { resolveCmsDisplayImageUrl } from '@/lib/media/cms-image-url'

type NurseryGalleryImageProps = {
  src: string
  alt: string
  sizes: string
  className?: string
}

export function NurseryGalleryImage({ src, alt, sizes, className }: NurseryGalleryImageProps) {
  const [failed, setFailed] = useState(false)
  const resolvedSrc = resolveCmsDisplayImageUrl(src)
  const displaySrc = failed ? CATEGORY_DEFAULT_IMAGE : resolvedSrc

  useEffect(() => {
    setFailed(false)
  }, [src])

  return (
    <Image
      src={displaySrc}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  )
}
