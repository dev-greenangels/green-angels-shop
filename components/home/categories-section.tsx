import Link from 'next/link'
import { ArrowRight, TreePine, TreeDeciduous, Flower2, Shrub } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { categories } from '@/lib/data'

const categoryIcons = {
  conifers: TreePine,
  deciduous: TreeDeciduous,
  perennials: Flower2,
  shrubs: Shrub,
}

export function CategoriesSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Категорії рослин
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Оберіть категорію та знайдіть ідеальні рослини для вашого саду
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug as keyof typeof categoryIcons] || TreePine
            
            return (
              <Link key={category.id} href={`/catalog/${category.slug}`}>
                <Card className="group h-full border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-10 w-10 text-primary" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-serif text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>{category.plantCount} позицій</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
