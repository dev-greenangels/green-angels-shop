import { CategoryCard } from '@/components/catalog/category-card'
import { cn } from '@/lib/utils'
import type { CatalogCategory } from '@/lib/catalog/types'

type HomeCategoryCarouselProps = {
  categories: CatalogCategory[]
  className?: string
}

export function HomeCategoryCarousel({ categories, className }: HomeCategoryCarouselProps) {
  return (
    <div
      className={cn(
        '-mx-[var(--site-shell-padding-x)] overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      <div className="flex w-max gap-2.5 px-[var(--site-shell-padding-x)] sm:gap-3 md:gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="w-[72vw] max-w-[18rem] shrink-0 sm:w-[14rem] md:w-[15.5rem] lg:w-[16rem]"
          >
            <CategoryCard category={category} compact />
          </div>
        ))}
      </div>
    </div>
  )
}
