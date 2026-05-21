'use client'

import { useState, useMemo } from 'react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { FilterSidebar } from '@/components/catalog/filter-sidebar'
import { plants, categories } from '@/lib/data'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function CatalogPage() {
  const [filters, setFilters] = useState({
    containerSize: [] as string[],
    sunRequirement: [] as string[],
    soilType: [] as string[],
    hardinessZone: [] as string[],
  })
  const [sortBy, setSortBy] = useState('name')

  const filteredPlants = useMemo(() => {
    let result = [...plants]

    // Apply filters
    if (filters.containerSize.length > 0) {
      result = result.filter(p => filters.containerSize.includes(p.containerSize))
    }
    if (filters.sunRequirement.length > 0) {
      result = result.filter(p => filters.sunRequirement.includes(p.sunRequirement))
    }
    if (filters.soilType.length > 0) {
      result = result.filter(p => filters.soilType.includes(p.soilType))
    }
    if (filters.hardinessZone.length > 0) {
      result = result.filter(p => filters.hardinessZone.includes(p.hardinessZone))
    }

    // Apply sorting
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name, 'uk'))
        break
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }

    return result
  }, [filters, sortBy])

  const totalPlants = categories.reduce((sum, cat) => sum + cat.plantCount, 0)

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 bg-background">
        {/* Header */}
        <div className="bg-secondary/30 py-8 md:py-12">
          <div className="container mx-auto px-4">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
              Каталог рослин
            </h1>
            <p className="text-muted-foreground">
              {totalPlants} позицій у нашому асортименті
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <FilterSidebar filters={filters} onFilterChange={setFilters} />

            {/* Products grid */}
            <div className="flex-1">
              {/* Sort and count */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <p className="text-sm text-muted-foreground">
                  Знайдено: {filteredPlants.length} рослин
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Сортувати:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">За назвою</SelectItem>
                      <SelectItem value="price-asc">Ціна: від низької</SelectItem>
                      <SelectItem value="price-desc">Ціна: від високої</SelectItem>
                      <SelectItem value="newest">Новинки</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Grid */}
              {filteredPlants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredPlants.map((plant) => (
                    <ProductCard key={plant.id} plant={plant} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">
                    Рослин за обраними фільтрами не знайдено
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
