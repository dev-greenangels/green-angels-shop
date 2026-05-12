import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/product-card'
import { plants } from '@/lib/data'

export function NewArrivalsSection() {
  // Get featured and new plants
  const featuredPlants = plants.filter(p => p.isFeatured || p.isNew).slice(0, 4)

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Новинки та бестселери
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Найпопулярніші рослини цього сезону та нові надходження
            </p>
          </div>
          <Button variant="outline" asChild className="self-start md:self-auto">
            <Link href="/catalog">
              Всі рослини
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredPlants.map((plant) => (
            <ProductCard key={plant.id} plant={plant} />
          ))}
        </div>
      </div>
    </section>
  )
}
