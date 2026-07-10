'use client'

import { LayoutGrid, List } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { CatalogViewMode } from '@/lib/catalog/view-mode'

type CatalogViewModeToggleProps = {
  value: CatalogViewMode
  onChange: (value: CatalogViewMode) => void
}

export function CatalogViewModeToggle({ value, onChange }: CatalogViewModeToggleProps) {
  const t = useTranslations('catalog')

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(next) => {
        if (next === 'grid' || next === 'list') onChange(next)
      }}
      aria-label={t('viewModeLabel')}
    >
      <ToggleGroupItem value="grid" aria-label={t('viewModeGrid')}>
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label={t('viewModeList')}>
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
