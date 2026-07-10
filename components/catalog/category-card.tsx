'use client'

import { ArrowRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { CategoryCoverImage } from '@/components/catalog/category-cover-image'
import { Card } from '@/components/ui/card'
import type { CatalogCategory } from '@/lib/catalog/types'
import { categoryHref } from '@/lib/catalog/paths'
import { intlLocaleForApp } from '@/lib/i18n/intl-locale'
import { Link } from '@/i18n/navigation'
import { pressableClassName } from '@/lib/pressable'
import { cn } from '@/lib/utils'

type CategoryCardProps = {
  category: CatalogCategory
  className?: string
  compact?: boolean
}

export function CategoryCard({ category, className, compact = false }: CategoryCardProps) {
  const locale = useLocale()
  const t = useTranslations('catalog')
  const numberLocale = intlLocaleForApp(locale)
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
          'flex h-24 flex-row gap-0 overflow-hidden rounded-xl border-border/50 py-0 shadow-sm',
          'transition-[box-shadow,border-color] duration-100 ease-out',
          'hover:border-primary/25 hover:shadow-md',
        )}
      >
        <div
          className={cn(
            'relative shrink-0 self-stretch overflow-hidden bg-muted',
            compact ? 'w-[38%]' : 'w-[40%] sm:w-[42%]',
          )}
        >
          <CategoryCoverImage
            src={category.image}
            alt={category.name}
            imageClassName="object-cover object-center transition-transform duration-500 ease-out group-hover/card:scale-[1.04]"
          />
        </div>

        <div
          className={cn(
            'relative z-[1] -ml-5 flex min-w-0 flex-1 flex-col justify-center rounded-l-none rounded-r-xl border-l border-white/25',
            'bg-white/40 backdrop-blur-md supports-[backdrop-filter]:bg-white/30',
            'shadow-[-8px_0_20px_rgba(0,0,0,0.06)]',
            compact ? 'gap-0.5 p-2 pl-5' : 'gap-1 p-2.5 pl-6 sm:pl-7',
          )}
        >
          <p
            className={cn(
              'font-medium uppercase tracking-[0.14em] text-foreground/55',
              compact ? 'text-[10px]' : 'text-[11px]',
            )}
          >
            {t('categoryLabel')}
          </p>
          <h3
            className={cn(
              'line-clamp-2 font-sans font-medium leading-snug text-foreground transition-colors group-hover/card:text-primary',
              compact ? 'text-base' : 'text-base sm:text-[17px]',
            )}
          >
            {category.name}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                'min-w-0 truncate text-muted-foreground',
                compact ? 'text-xs' : 'text-sm',
              )}
            >
              {plantCountLabel}
            </p>
            <ArrowRight
              className={cn(
                'shrink-0 text-primary transition-transform duration-200 group-hover/card:translate-x-0.5',
                compact ? 'h-4 w-4' : 'h-5 w-5',
              )}
              aria-hidden
            />
          </div>
        </div>
      </Card>
    </Link>
  )
}
