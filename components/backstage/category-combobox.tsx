'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, ChevronsUpDown } from 'lucide-react'

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
import { cn } from '@/lib/utils'

export type CategoryOption = {
  id: string
  name: string
  depth: number
}

export function CategoryCombobox({
  options,
  value,
  onChange,
  loading,
  required,
  label,
}: {
  options: CategoryOption[]
  value: string
  onChange: (categoryId: string) => void
  loading?: boolean
  required?: boolean
  label?: string
}) {
  const tc = useTranslations('common')
  const th = useTranslations('hints')
  const tl = useTranslations('labels')
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => options.find((o) => o.id === value), [options, value])
  const resolvedLabel = label ?? tl('category')

  return (
    <div className="space-y-2">
      <Label>
        {resolvedLabel}
        {required ? ' *' : ''}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={loading}
          >
            {loading
              ? tc('loading')
              : selected
                ? `${'— '.repeat(selected.depth)}${selected.name}`
                : th('selectCategory')}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={th('searchCategory')} />
            <CommandList>
              <CommandEmpty>{th('categoryNotFound')}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={`${option.name} ${option.id}`}
                    onSelect={() => {
                      onChange(option.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.id ? 'opacity-100' : 'opacity-0'
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
    </div>
  )
}
