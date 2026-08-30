'use client'

import { ProductCard } from '@/components/product-card'
import { LISTING_PRODUCT_GRID_CLASS_NAME } from '@/lib/catalog/grid-columns'
import type { Plant } from '@/lib/types'

type ProductRelatedPlantsProps = {
  plants: Plant[]
  title: string
  countLabel: string
}

export function ProductRelatedPlants({ plants, title, countLabel }: ProductRelatedPlantsProps) {
  if (plants.length === 0) return null

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-serif text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground md:text-base">{countLabel}</p>
      </div>
      <div className={LISTING_PRODUCT_GRID_CLASS_NAME}>
        {plants.map((relatedPlant) => (
          <ProductCard key={relatedPlant.id} plant={relatedPlant} layout="grid" />
        ))}
      </div>
    </div>
  )
}
