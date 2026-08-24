'use client'

import { useLocale, useTranslations } from 'next-intl'

import { CategoryCoverImage } from '@/components/catalog/category-cover-image'
import { Card } from '@/components/ui/card'
import type { CatalogCategory } from '@/lib/catalog/types'
import { categoryHref } from '@/lib/catalog/paths'
import { isCategoryPlaceholderImage } from '@/lib/category-image'
import { intlLocaleForApp } from '@/lib/i18n/intl-locale'
import { Link } from '@/i18n/navigation'
import { pressableClassName } from '@/lib/pressable'
import { cn } from '@/lib/utils'

type CategoryCardProps = {
  category: CatalogCategory
  className?: string
  compact?: boolean
}

const overlayTextShadowOnImage =
  '[text-shadow:0_1px_2px_rgba(0,0,0,0.42),0_0_1px_rgba(0,0,0,0.25)]'

const overlayTextShadowStrongOnImage =
  '[text-shadow:0_1px_3px_rgba(0,0,0,0.58),0_0_2px_rgba(0,0,0,0.4)]'

const overlayTextShadowOnLight =
  '[text-shadow:0_1px_1px_rgba(255,255,255,0.55)]'

export function CategoryCard({ category, className, compact = false }: CategoryCardProps) {
  const locale = useLocale()
  const t = useTranslations('catalog')
  const numberLocale = intlLocaleForApp(locale)
  const hasCoverImage = !isCategoryPlaceholderImage(category.image)
  const plantCountLabel = t('plantCount', {
    count: category.plantCount.toLocaleString(numberLocale),
  })

  return (
    <Link
      href={categoryHref(category.slug)}
      className={cn(
        pressableClassName,
        'group/card block h-full rounded-xl outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        '[-webkit-tap-highlight-color:transparent] select-none',
        className,
      )}
    >
      <Card
        className={cn(
          '@container relative aspect-square gap-0 overflow-hidden rounded-xl border-0 p-0 shadow-md',
          'transition-[box-shadow] duration-200 ease-out hover:shadow-lg',
        )}
      >
        <CategoryCoverImage
          src={category.image}
          alt={category.name}
          className="absolute inset-0"
          imageClassName="object-cover object-center transition-transform duration-500 ease-out group-hover/card:scale-[1.05]"
          logoClassName={compact ? 'p-4' : 'p-6 md:p-8'}
        />

        {hasCoverImage ? (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/30"
            aria-hidden
          />
        ) : null}

        <div
          className={cn(
            'absolute inset-x-[8%] bottom-[6%]',
            compact
              ? 'text-[clamp(9px,5.6cqw,14px)]'
              : 'text-[clamp(11px,6.5cqw,17px)]',
          )}
        >
          <div
            className={cn(
              'flex w-full flex-col items-center rounded-[0.2rem] text-center',
              'gap-[clamp(3px,1.4cqw,7px)] px-[clamp(7px,3.4cqw,14px)] py-[clamp(6px,2.8cqw,11px)]',
              hasCoverImage
                ? 'border border-white/70 bg-white/30'
                : 'border-2 border-white/90 bg-white/88 shadow-sm',
            )}
          >
            <p
              className={cn(
                'text-[0.56em] font-[900] uppercase leading-none tracking-[0.08em]',
                hasCoverImage ? 'text-white/90' : 'text-foreground/60',
                hasCoverImage ? overlayTextShadowStrongOnImage : overlayTextShadowOnLight,
              )}
            >
              {t('categoryLabel')}
            </p>
            <h3
              className={cn(
                'line-clamp-2 w-full text-[1em] font-sans font-bold uppercase leading-snug tracking-wide',
                hasCoverImage
                  ? 'text-white'
                  : 'text-foreground transition-colors group-hover/card:text-primary',
                hasCoverImage ? overlayTextShadowOnImage : overlayTextShadowOnLight,
              )}
            >
              {category.name}
            </h3>
            <p
              className={cn(
                'text-[0.78em] font-[700] leading-none',
                hasCoverImage ? 'text-white/70' : 'text-foreground/70',
                hasCoverImage ? overlayTextShadowStrongOnImage : overlayTextShadowOnLight,
              )}
            >
              {plantCountLabel}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
