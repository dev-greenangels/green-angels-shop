import Image from 'next/image'

import { BrandLogo } from '@/components/brand-logo'
import { isProductPlaceholderImage } from '@/lib/product-image'
import { toPublicMediaUrl } from '@/lib/media/public-url'
import { cn } from '@/lib/utils'

export function ProductCoverImageServer({
  src,
  alt,
  className,
  imageClassName,
  logoClassName,
  sizes,
  priority,
}: {
  src: string | null | undefined
  alt: string
  className?: string
  imageClassName?: string
  logoClassName?: string
  sizes?: string
  priority?: boolean
}) {
  const trimmed = toPublicMediaUrl(src)?.trim()
  const showPlaceholder = !trimmed || isProductPlaceholderImage(trimmed)

  if (showPlaceholder) {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center bg-gradient-to-b from-muted via-secondary/20 to-accent/40 p-6',
          className,
          logoClassName,
        )}
      >
        <BrandLogo
          alt={alt}
          width={180}
          height={56}
          imgClassName="max-h-12 w-auto max-w-[72%] object-contain opacity-80 md:max-h-14"
        />
      </div>
    )
  }

  return (
    <Image
      src={trimmed}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes ?? '(max-width: 1024px) 100vw, 50vw'}
      className={cn('max-h-full max-w-full object-cover', imageClassName, className)}
    />
  )
}
