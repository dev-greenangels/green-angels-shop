'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Sun, ArrowUpDown, MoveHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getPlantVariants } from '@/lib/plant-variants'
import { formatPrice, getVariantPriceRange } from '@/lib/product-pricing'
import { cn } from '@/lib/utils'
import type { Plant } from '@/lib/types'

interface ProductCardProps {
  plant: Plant
}

const sunLabels = {
  'full-sun': 'Сонце',
  'partial-shade': 'Напівтінь',
  'full-shade': 'Тінь',
}

export function ProductCard({ plant }: ProductCardProps) {
  const { min: priceMin, max: priceMax } = getVariantPriceRange(getPlantVariants(plant))
  const hasPriceRange = priceMin !== priceMax
  const href = `/product/${plant.slug}`

  return (
    <Link
      href={href}
      className={cn(
        'group/card block rounded-xl outline-none',
        'transition-[transform,box-shadow] duration-200 ease-out',
        'hover:-translate-y-0.5 hover:shadow-lg',
        'active:translate-y-0 active:scale-[0.98] active:shadow-md',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
      )}
    >
      <Card
        className={cn(
          'h-full overflow-hidden border-border/50 shadow-sm',
          'transition-colors duration-200',
          'group-hover/card:border-primary/35 group-hover/card:shadow-none',
          'group-active/card:border-primary/50 group-active/card:bg-primary/[0.03]'
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={plant.images[0] || '/images/placeholder-plant.jpg'}
            alt={plant.name}
            fill
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
          />
          {plant.isNew && (
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
              Новинка
            </Badge>
          )}
          {plant.originalPrice && (
            <Badge variant="destructive" className="absolute top-3 right-3">
              -{Math.round((1 - plant.price / plant.originalPrice) * 100)}%
            </Badge>
          )}
        </div>

        <CardContent className="flex flex-col gap-3 px-4">
          <div className="space-y-1">
            <h3 className="font-serif font-semibold text-foreground line-clamp-1 transition-colors group-hover/card:text-primary">
              {plant.name}
            </h3>
            <p className="text-sm text-muted-foreground italic line-clamp-1">{plant.latinName}</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Sun className="h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span>{sunLabels[plant.sunRequirement]}</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span>{plant.height}</span>
            </div>
            <div className="flex items-center gap-1">
              <MoveHorizontal className="h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span>{plant.width}</span>
            </div>
          </div>

          <div className="mt-auto space-y-3 border-t border-border/60 pt-3">
            <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-base text-muted-foreground">
              <span className="text-sm">Ціна від</span>
              <span className="text-lg font-semibold text-primary">{formatPrice(priceMin)}</span>
              {hasPriceRange && (
                <>
                  <span className="text-sm">до</span>
                  <span className="text-lg font-semibold text-primary">{formatPrice(priceMax)}</span>
                </>
              )}
            </p>
            <span
              className={cn(
                'flex h-10 w-full items-center justify-center rounded-md text-sm font-medium',
                'bg-primary text-primary-foreground shadow-sm',
                'transition-colors duration-200',
                'group-hover/card:bg-primary/90',
                'group-active/card:bg-primary/80'
              )}
            >
              Детальніше
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
