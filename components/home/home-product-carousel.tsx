import { ProductCard } from '@/components/product-card'
import { PRODUCT_CARD_CAROUSEL_SLOT_CLASS } from '@/lib/catalog/product-card-layout'
import { cn } from '@/lib/utils'
import type { Plant } from '@/lib/types'

type HomeProductCarouselProps = {
  plants: Plant[]
  className?: string
}

export function HomeProductCarousel({ plants, className }: HomeProductCarouselProps) {
  return (
    <div
      className={cn(
        '-mx-[var(--site-shell-padding-x)] overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      <div className="flex w-max gap-2.5 px-[var(--site-shell-padding-x)] sm:gap-3 md:gap-4">
        {plants.map((plant) => (
          <div key={plant.id} className={PRODUCT_CARD_CAROUSEL_SLOT_CLASS}>
            <ProductCard plant={plant} />
          </div>
        ))}
      </div>
    </div>
  )
}
