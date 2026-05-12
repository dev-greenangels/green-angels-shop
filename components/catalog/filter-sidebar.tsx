'use client'

import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { containerSizes, sunRequirements, soilTypes, hardinessZones } from '@/lib/data'

interface FilterSidebarProps {
  filters: {
    containerSize: string[]
    sunRequirement: string[]
    soilType: string[]
    hardinessZone: string[]
  }
  onFilterChange: (filters: FilterSidebarProps['filters']) => void
}

function FilterContent({ filters, onFilterChange }: FilterSidebarProps) {
  const toggleFilter = (category: keyof typeof filters, value: string) => {
    const current = filters[category]
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onFilterChange({ ...filters, [category]: updated })
  }

  const clearFilters = () => {
    onFilterChange({
      containerSize: [],
      sunRequirement: [],
      soilType: [],
      hardinessZone: [],
    })
  }

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0)

  return (
    <div className="space-y-4">
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Очистити фільтри
        </Button>
      )}

      <Accordion type="multiple" defaultValue={['container', 'sun', 'soil', 'zone']} className="w-full">
        <AccordionItem value="container">
          <AccordionTrigger className="text-sm font-semibold">
            Розмір контейнера
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {containerSizes.map((size) => (
                <div key={size.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`container-${size.value}`}
                    checked={filters.containerSize.includes(size.value)}
                    onCheckedChange={() => toggleFilter('containerSize', size.value)}
                  />
                  <Label
                    htmlFor={`container-${size.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {size.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sun">
          <AccordionTrigger className="text-sm font-semibold">
            Освітлення
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {sunRequirements.map((sun) => (
                <div key={sun.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sun-${sun.value}`}
                    checked={filters.sunRequirement.includes(sun.value)}
                    onCheckedChange={() => toggleFilter('sunRequirement', sun.value)}
                  />
                  <Label
                    htmlFor={`sun-${sun.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {sun.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="soil">
          <AccordionTrigger className="text-sm font-semibold">
            Тип ґрунту
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {soilTypes.map((soil) => (
                <div key={soil.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`soil-${soil.value}`}
                    checked={filters.soilType.includes(soil.value)}
                    onCheckedChange={() => toggleFilter('soilType', soil.value)}
                  />
                  <Label
                    htmlFor={`soil-${soil.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {soil.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="zone">
          <AccordionTrigger className="text-sm font-semibold">
            Зона морозостійкості
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {hardinessZones.map((zone) => (
                <div key={zone.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`zone-${zone.value}`}
                    checked={filters.hardinessZone.includes(zone.value)}
                    onCheckedChange={() => toggleFilter('hardinessZone', zone.value)}
                  />
                  <Label
                    htmlFor={`zone-${zone.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {zone.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden mb-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Фільтри
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Фільтри</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent filters={filters} onFilterChange={onFilterChange} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 bg-card rounded-lg border border-border p-4">
          <h3 className="font-serif text-lg font-semibold mb-4">Фільтри</h3>
          <FilterContent filters={filters} onFilterChange={onFilterChange} />
        </div>
      </aside>
    </>
  )
}
