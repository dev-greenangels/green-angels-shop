'use client'

import { useMarketRegion } from '@/components/providers/market-region-provider'
import { getMarketBranding } from '@/lib/branding/market-branding'
import { cn } from '@/lib/utils'

export const LOGO_SRC = '/images/logo.png'
export const WHITE_LOGO_SRC = '/images/whiteLogo.png'

export type BrandLogoProps = {
  alt: string
  className?: string
  imgClassName?: string
  width?: number
  height?: number
  logoSrc?: string
  /** Біле лого без підкладки — для зеленого фону (футер, auth, адмін) */
  variant?: 'default' | 'onDark'
}

export function BrandLogo({
  alt,
  className,
  imgClassName,
  width = 140,
  height = 44,
  logoSrc,
  variant = 'default',
}: BrandLogoProps) {
  const marketRegion = useMarketRegion()
  const branding = getMarketBranding(marketRegion)
  const src = logoSrc ?? (variant === 'onDark' ? branding.footerLogo : branding.headerLogo)
  const resolvedAlt = marketRegion === 'sk' ? branding.applicationName : alt
  const onDark = variant === 'onDark'

  return (
    <span className={cn('inline-flex max-w-full shrink-0 items-center justify-center', className)}>
      <img
        src={src}
        alt={resolvedAlt}
        width={width}
        height={height}
        className={cn(
          'h-auto w-auto object-contain',
          onDark
            ? 'max-h-9 max-w-[min(180px,55vw)] object-center md:max-h-11 md:max-w-[200px]'
            : 'max-h-8 max-w-[min(148px,46vw)] object-left md:max-h-10 md:max-w-[168px]',
          imgClassName
        )}
      />
    </span>
  )
}
