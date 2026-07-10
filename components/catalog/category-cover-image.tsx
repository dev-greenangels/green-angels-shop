import Image from 'next/image'

import { BrandLogo } from '@/components/brand-logo'
import { isCategoryPlaceholderImage } from '@/lib/category-image'
import { cn } from '@/lib/utils'

export function CategoryCoverImage({
  src,
  alt,
  className,
  imageClassName,
  logoClassName,
}: {
  src: string | null | undefined
  alt: string
  className?: string
  imageClassName?: string
  logoClassName?: string
}) {
  if (!isCategoryPlaceholderImage(src)) {
    return (
      <div className={cn('relative h-full w-full', className)}>
        <Image
          src={src!}
          alt={alt}
          fill
          className={cn('object-cover', imageClassName)}
          unoptimized
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/90 via-background to-accent/50 p-6 md:p-8',
        className,
        logoClassName,
      )}
    >
      <BrandLogo
        alt={alt}
        width={180}
        height={56}
        imgClassName="max-h-12 w-auto max-w-[72%] object-contain opacity-90 md:max-h-14"
      />
    </div>
  )
}
