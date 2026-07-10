'use client'

import { ArrowDownWideNarrow } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CatalogSortSheet } from '@/components/catalog/catalog-sort-sheet'
import { CATALOG_SORT_OPTIONS } from '@/lib/catalog/sort-options'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type CatalogSortControlProps = {
  sortBy: string
  onSortChange: (value: string) => void
  className?: string
}

export function CatalogSortControl({ sortBy, onSortChange, className }: CatalogSortControlProps) {
  const tCatalog = useTranslations('catalog')

  return (
    <>
      <CatalogSortSheet
        sortBy={sortBy}
        onSortChange={onSortChange}
        variant="icon"
        className={cn('lg:hidden', className)}
      />

      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger
          size="sm"
          className={cn(
            'hidden h-8 w-[9.5rem] gap-1.5 px-2.5 lg:inline-flex',
            className,
          )}
        >
          <ArrowDownWideNarrow className="h-4 w-4 shrink-0 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATALOG_SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {tCatalog(`sort.${option.value}` as 'sort.name')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
