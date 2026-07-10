'use client'

import { useMemo, useState } from 'react'
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

export function PromoMultiCategoryPicker({
  options,
  selectedIds,
  onChange,
  loading,
  label = 'Категорії',
}: {
  options: CategoryOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  loading?: boolean
  label?: string
}) {
  const [open, setOpen] = useState(false)

  const selectedOptions = useMemo(
    () => options.filter((o) => selectedIds.includes(o.id)),
    [options, selectedIds],
  )

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-full justify-between font-normal"
            disabled={loading}
          >
            {selectedIds.length ? `Обрано: ${selectedIds.length}` : 'Обрати категорії'}
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="z-[80] w-[var(--radix-popover-trigger-width)] border-border/60 bg-popover p-0 shadow-lg shadow-black/10"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandInput placeholder="Пошук категорії…" className="h-8" />
            <CommandList>
              <CommandEmpty>Не знайдено</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={`${option.name} ${option.id}`}
                    onSelect={() => toggle(option.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3.5 w-3.5',
                        selectedIds.includes(option.id) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="truncate text-sm">
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
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <Badge key={option.id} variant="secondary" className="gap-1 text-xs font-normal">
              {option.name}
              <button type="button" onClick={() => toggle(option.id)} aria-label="Прибрати">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
