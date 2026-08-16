'use client'

import { Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CATALOG_GRID_BREAKPOINTS,
  GRID_COLUMNS_MAX,
  GRID_COLUMNS_MIN,
} from '@/lib/catalog/grid-columns'
import { CatalogFiltersVisibilityFields } from '@/components/backstage/catalog-filters-visibility-fields'
import { Input } from '@/components/ui/input'
import type {
  CatalogCategoryDisplay,
  CatalogGridColumns,
  CatalogPageSettings,
} from '@/lib/settings/types'
import {
  FRESH_PHOTOS_LIMIT_MAX,
  FRESH_PHOTOS_LIMIT_MIN,
} from '@/lib/settings/fresh-photos-limit'

const DISPLAY_OPTIONS: Array<{
  value: CatalogCategoryDisplay
  label: string
  description: string
}> = [
  {
    value: 'subcategories',
    label: 'Категорії',
    description:
      'На /catalog показувати картки підкатегорій кореня каталогу. Товари — лише на сторінках вкладених категорій.',
  },
  {
    value: 'products',
    label: 'Лише товари',
    description: 'На /catalog показувати сітку товарів кореня каталогу без карток категорій.',
  },
  {
    value: 'both',
    label: 'Категорії і товари',
    description:
      'На /catalog спочатку підкатегорії кореня, нижче — товари цієї гілки.',
  },
]

const COLUMN_OPTIONS = Array.from(
  { length: GRID_COLUMNS_MAX - GRID_COLUMNS_MIN + 1 },
  (_, index) => GRID_COLUMNS_MIN + index,
)

function GridColumnsFields({
  idPrefix,
  title,
  description,
  columns,
  onChange,
}: {
  idPrefix: string
  title: string
  description: string
  columns: CatalogGridColumns
  onChange: (next: CatalogGridColumns) => void
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATALOG_GRID_BREAKPOINTS.map((breakpoint) => (
          <div key={breakpoint.key} className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-${breakpoint.key}`}>
              {breakpoint.label}{' '}
              <span className="font-normal text-muted-foreground">({breakpoint.hint})</span>
            </Label>
            <Select
              value={String(columns[breakpoint.key])}
              onValueChange={(value) =>
                onChange({
                  ...columns,
                  [breakpoint.key]: Number(value),
                })
              }
            >
              <SelectTrigger id={`${idPrefix}-${breakpoint.key}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLUMN_OPTIONS.map((count) => (
                  <SelectItem key={count} value={String(count)}>
                    {count} {count === 1 ? 'картка' : 'картки'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CatalogSettingsForm({
  catalog,
  onChange,
  onSave,
  saving,
  isDirty = false,
}: {
  catalog: CatalogPageSettings
  onChange: (next: CatalogPageSettings) => void
  onSave: () => void
  saving: boolean
  isDirty?: boolean
}) {
  const selected = DISPLAY_OPTIONS.find((option) => option.value === catalog.categoryDisplay)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Каталог</CardTitle>
        <CardDescription>
          Сторінка /catalog відображає категорію з прапорцем «Корінь каталогу». Тут — режим показу
          підкатегорій і товарів, а також кількість карток у ряд для різних розмірів екрана.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="catalog-display">Режим відображення на /catalog</Label>
          <Select
            value={catalog.categoryDisplay}
            onValueChange={(value: CatalogCategoryDisplay) =>
              onChange({ ...catalog, categoryDisplay: value })
            }
          >
            <SelectTrigger id="catalog-display" className="max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISPLAY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected ? (
            <p className="max-w-2xl text-sm text-muted-foreground">{selected.description}</p>
          ) : null}
        </div>

        <GridColumnsFields
          idPrefix="product-grid"
          title="Товари в ряд"
          description="Сітка карток товарів у каталозі, на головній, в обраному та на сторінці товару."
          columns={catalog.productGridColumns}
          onChange={(productGridColumns) => onChange({ ...catalog, productGridColumns })}
        />

        <GridColumnsFields
          idPrefix="category-grid"
          title="Категорії в ряд"
          description="Сітка карток категорій на /catalog, сторінках категорій і на головній."
          columns={catalog.categoryGridColumns}
          onChange={(categoryGridColumns) => onChange({ ...catalog, categoryGridColumns })}
        />

        <CatalogFiltersVisibilityFields
          idPrefix="catalog-filters"
          title="Фільтри каталогу"
          description="Які блоки фільтрів показувати на сторінках категорій, пошуку та в каталозі."
          value={catalog.catalogFilters}
          onChange={(catalogFilters) => onChange({ ...catalog, catalogFilters })}
        />

        <CatalogFiltersVisibilityFields
          idPrefix="plants-filters"
          title="Фільтри «Рослини А-Я»"
          description="Які блоки фільтрів показувати на сторінці /plants."
          value={catalog.plantsAlphabetFilters}
          onChange={(plantsAlphabetFilters) => onChange({ ...catalog, plantsAlphabetFilters })}
        />

        <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-4">
          <p className="font-medium text-foreground">Fresh Photos</p>
          <div className="space-y-1.5">
            <Label htmlFor="fresh-photos-limit">Максимум фото на один розмір товару</Label>
            <Input
              id="fresh-photos-limit"
              type="number"
              min={FRESH_PHOTOS_LIMIT_MIN}
              max={FRESH_PHOTOS_LIMIT_MAX}
              step={1}
              className="max-w-[8rem]"
              value={catalog.freshPhotosLimit}
              onChange={(event) => {
                const parsed = Number(event.target.value)
                onChange({
                  ...catalog,
                  freshPhotosLimit: Number.isFinite(parsed) ? parsed : catalog.freshPhotosLimit,
                })
              }}
            />
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Скільки Fresh Photos дозволено для одного розміру / варіанту товару (sizeId). За
            замовчуванням: 4. Зменшення ліміту не видаляє наявні фото одразу — зайві прибираються при
            наступному завантаженні або імпорті для цього розміру. 0 і відʼємні значення не
            зберігаються.
          </p>
        </div>

        <Button type="button" onClick={onSave} disabled={saving || !isDirty}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Збереження…' : 'Зберегти'}
        </Button>
      </CardContent>
    </Card>
  )
}
