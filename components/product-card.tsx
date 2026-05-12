'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Sun, Droplets } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useCartStore } from '@/lib/cart-store'
import type { Plant } from '@/lib/types'

interface ProductCardProps {
  plant: Plant
}

const sunLabels = {
  'full-sun': 'Сонце',
  'partial-shade': 'Напівтінь',
  'full-shade': 'Тінь',
}

const waterLabels = {
  low: 'Мало',
  moderate: 'Помірно',
  high: 'Багато',
}

export function ProductCard({ plant }: ProductCardProps) {
  const { addItem, openCart } = useCartStore()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem(plant)
    openCart()
  }

  return (
    <Card className="group overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
      <Link href={`/product/${plant.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={plant.images[0] || '/images/placeholder-plant.jpg'}
            alt={plant.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
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

        <CardContent className="p-4">
          <div className="space-y-2">
            <div>
              <h3 className="font-serif font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {plant.name}
              </h3>
              <p className="text-sm text-muted-foreground italic line-clamp-1">
                {plant.latinName}
              </p>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {plant.shortDescription}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Sun className="h-3.5 w-3.5" />
                <span>{sunLabels[plant.sunRequirement]}</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="h-3.5 w-3.5" />
                <span>{waterLabels[plant.wateringNeeds]}</span>
              </div>
              <span className="ml-auto">{plant.containerSize}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">
                  {plant.price.toLocaleString('uk-UA')} ₴
                </span>
                {plant.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {plant.originalPrice.toLocaleString('uk-UA')} ₴
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
