'use client'

import { useState } from 'react'
import { ArrowUpDown, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CATALOG_SORT_OPTIONS } from '@/lib/catalog/sort-options'
import { cn } from '@/lib/utils'

type CatalogSortSheetProps = {
  sortBy: string
  onSortChange: (value: string) => void
  variant?: 'default' | 'icon'
  className?: string
}

export function CatalogSortSheet({
  sortBy,
  onSortChange,
  variant = 'default',
  className,
}: CatalogSortSheetProps) {
  const [open, setOpen] = useState(false)
  const tc = useTranslations('common')
  const tCatalog = useTranslations('catalog')

  const sortLabel =
    CATALOG_SORT_OPTIONS.some((option) => option.value === sortBy)
      ? tCatalog(`sort.${sortBy}` as 'sort.name')
      : tCatalog('sort.fallback')

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size={variant === 'icon' ? 'icon-sm' : 'default'}
          className={cn(
            variant === 'icon'
              ? 'size-8 shrink-0 shadow-xs'
              : 'h-9 min-h-9 flex-1 min-w-0 gap-2 px-3 text-sm',
            className,
          )}
          aria-label={sortLabel}
        >
          <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          {variant === 'icon' ? (
            <span className="sr-only">{sortLabel}</span>
          ) : (
            <span className="truncate">{sortLabel}</span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6">
        <SheetHeader className="px-0 text-left">
          <SheetTitle>{tc('sortLabel')}</SheetTitle>
          <SheetDescription className="sr-only">{tc('sortDescription')}</SheetDescription>
        </SheetHeader>
        <div className="mt-2 space-y-1">
          {CATALOG_SORT_OPTIONS.map((option) => {
            const selected = sortBy === option.value
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition-colors',
                  selected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/70',
                )}
                onClick={() => {
                  onSortChange(option.value)
                  setOpen(false)
                }}
              >
                <span>{tCatalog(`sort.${option.value}` as 'sort.name')}</span>
                {selected ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
              </button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
