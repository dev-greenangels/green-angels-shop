'use client'

import { CategoryCard } from '@/components/catalog/category-card'
import { useCategoryGridClassName } from '@/components/providers/catalog-settings-provider'
import type { CatalogCategory } from '@/lib/catalog/types'
import { getCategoryCardsGridClassName } from '@/lib/catalog/grid-columns'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

/** @deprecated Використовуйте getCategoryCardsGridClassName() або useCategoryGridClassName(). */
export const categoryCardsGridClassName = getCategoryCardsGridClassName()

export const homeCategoryCardsGridClassName = categoryCardsGridClassName

export function CategoryCardsGrid({
  categories,
  emptyMessage,
  className,
  gridClassName,
}: {
  categories: CatalogCategory[]
  emptyMessage?: string
  className?: string
  gridClassName?: string
}) {
  const t = useTranslations('catalog')
  const resolvedEmptyMessage = emptyMessage ?? t('emptySubcategoriesDefault')
  const settingsGridClassName = useCategoryGridClassName()
  const resolvedGridClassName = gridClassName ?? settingsGridClassName

  if (categories.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-muted-foreground">{resolvedEmptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn(resolvedGridClassName, className)}>
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  )
}
