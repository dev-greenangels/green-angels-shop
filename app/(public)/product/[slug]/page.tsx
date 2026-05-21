'use client'

import { useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Sun, Droplets, Mountain, Thermometer } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductCard } from '@/components/product-card'
import { ProductVariantsTable } from '@/components/product/product-variants-table'
import { useCartStore } from '@/lib/cart-store'
import { plants, categories } from '@/lib/data'
import {
  getPlantVariants,
  isPlantFullyUnavailable,
  isPlantOrderable,
} from '@/lib/plant-variants'
import { formatPrice, getMinVariantPrice } from '@/lib/product-pricing'
import type { ProductVariant } from '@/lib/types'

const sunLabels = {
  'full-sun': 'Повне сонце',
  'partial-shade': 'Напівтінь',
  'full-shade': 'Тінь',
}

const soilLabels = {
  acidic: 'Кислий',
  neutral: 'Нейтральний',
  alkaline: 'Лужний',
  any: 'Будь-який',
}

const waterLabels = {
  low: 'Низькі',
  moderate: 'Помірні',
  high: 'Високі',
}

export default function ProductPage() {
  const params = useParams()
  const slug = params.slug as string
  const plant = plants.find(p => p.slug === slug)

  if (!plant) {
    notFound()
  }

  const [selectedImage, setSelectedImage] = useState(0)
  const { addItem, openCart } = useCartStore()

  const category = categories.find(c => c.slug === plant.category)
  const relatedPlants = plants.filter(p => p.category === plant.category && p.id !== plant.id).slice(0, 4)
  const variants = getPlantVariants(plant)
  const canOrder = isPlantOrderable(variants)
  const fullyUnavailable = isPlantFullyUnavailable(variants)
  const priceFrom = Math.min(...variants.map(getMinVariantPrice))

  const handleBuy = (variant: ProductVariant, quantity: number, unitPrice: number) => {
    addItem(plant, quantity, { variant, unitPrice })
    openCart()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">
              Головна
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/catalog" className="hover:text-foreground transition-colors">
              Каталог
            </Link>
            <ChevronRight className="h-4 w-4" />
            {category && (
              <>
                <Link href={`/catalog/${category.slug}`} className="hover:text-foreground transition-colors">
                  {category.name}
                </Link>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
            <span className="text-foreground truncate max-w-[200px]">{plant.name}</span>
          </nav>

          {/* Product details */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* Images */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                <Image
                  src={plant.images[selectedImage] || '/images/placeholder-plant.jpg'}
                  alt={plant.name}
                  fill
                  className="object-cover"
                  priority
                />
                {plant.isNew && (
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                    Новинка
                  </Badge>
                )}
                {plant.originalPrice && (
                  <Badge variant="destructive" className="absolute top-4 right-4">
                    -{Math.round((1 - plant.price / plant.originalPrice) * 100)}%
                  </Badge>
                )}
              </div>
              {plant.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {plant.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                        selectedImage === index ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${plant.name} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Артикул: {plant.sku}
                </p>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {plant.name}
                </h1>
                <p className="text-lg text-muted-foreground italic">
                  {plant.latinName}
                </p>
              </div>

              {canOrder ? (
                <p className="text-muted-foreground">
                  від{' '}
                  <span className="text-3xl font-bold text-foreground">{formatPrice(priceFrom)}</span>
                  {variants.length > 1 && <span> · {variants.length} розмірів</span>}
                </p>
              ) : (
                <p className="text-lg font-semibold text-muted-foreground">Немає в наявності</p>
              )}

              <p className="text-muted-foreground leading-relaxed">
                {plant.description}
              </p>

              {/* Quick specs */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Sun className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Освітлення</p>
                    <p className="text-sm font-medium">{sunLabels[plant.sunRequirement]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Droplets className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Полив</p>
                    <p className="text-sm font-medium">{waterLabels[plant.wateringNeeds]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Mountain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ґрунт</p>
                    <p className="text-sm font-medium">{soilLabels[plant.soilType]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Thermometer className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Зона</p>
                    <p className="text-sm font-medium">{plant.hardinessZone}</p>
                  </div>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Висота: </span>
                <span className="font-medium">{plant.height}</span>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <ProductVariantsTable
              variants={variants}
              plantId={plant.id}
              plantName={plant.name}
              fullyOutOfStock={fullyUnavailable}
              onBuy={handleBuy}
            />
          </div>

          {/* Care tabs */}
          <div className="mb-16">
            <Tabs defaultValue="planting" className="w-full">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 mb-6">
                <TabsTrigger
                  value="planting"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  Посадка
                </TabsTrigger>
                <TabsTrigger
                  value="light"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  Освітлення
                </TabsTrigger>
                <TabsTrigger
                  value="care"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  Догляд
                </TabsTrigger>
              </TabsList>
              <TabsContent value="planting" className="mt-0">
                <div className="bg-secondary/30 rounded-xl p-6">
                  <h3 className="font-serif text-xl font-semibold mb-4">Інструкції з посадки</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {plant.plantingInstructions}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="light" className="mt-0">
                <div className="bg-secondary/30 rounded-xl p-6">
                  <h3 className="font-serif text-xl font-semibold mb-4">Вимоги до освітлення</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {plant.lightRequirements}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="care" className="mt-0">
                <div className="bg-secondary/30 rounded-xl p-6">
                  <h3 className="font-serif text-xl font-semibold mb-4">Догляд за рослиною</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {plant.careInstructions}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Related products */}
          {relatedPlants.length > 0 && (
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
                Схожі рослини
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedPlants.map((relatedPlant) => (
                  <ProductCard key={relatedPlant.id} plant={relatedPlant} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
