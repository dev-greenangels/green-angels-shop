'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { CategoryOption } from '@/components/backstage/category-combobox'
import { cn } from '@/lib/utils'

export function AdditionalCategoriesPicker({
  options,
  primaryCategoryId,
  selectedIds,
  onChange,
  loading,
}: {
  options: CategoryOption[]
  primaryCategoryId: string
  selectedIds: string[]
  onChange: (ids: string[]) => void
  loading?: boolean
}) {
  const tc = useTranslations('common')
  const th = useTranslations('hints')
  const tl = useTranslations('labels')
  const tAria = useTranslations('aria')
  const [open, setOpen] = useState(false)

  const available = useMemo(
    () => options.filter((o) => o.id !== primaryCategoryId),
    [options, primaryCategoryId]
  )

  const selectedOptions = useMemo(
    () => available.filter((o) => selectedIds.includes(o.id)),
    [available, selectedIds]
  )

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className="space-y-2">
      <Label>{tl('additionalCategories')}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
            disabled={loading || !primaryCategoryId}
          >
            {selectedIds.length > 0
              ? tc('selected', { count: selectedIds.length })
              : th('addAdditionalCategories')}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={th('search')} />
            <CommandList>
              <CommandEmpty>{th('categoriesNotFound')}</CommandEmpty>
              <CommandGroup>
                {available.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={`${option.name} ${option.id}`}
                    onSelect={() => toggle(option.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedIds.includes(option.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="truncate">
                      {'— '.repeat(option.depth)}
                      {option.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <Badge key={option.id} variant="secondary" className="gap-1 pr-1">
              {option.name}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted"
                onClick={() => toggle(option.id)}
                aria-label={tAria('removeItem', { name: option.name })}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{th('additionalCategoriesHint')}</p>
      )}
    </div>
  )
}
