'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronsUpDown } from 'lucide-react'

import { InputClearButton } from '@/components/ui/input-with-clear'

import {
  FieldHint,
  RequiredLabel,
} from '@/components/auth/auth-form-ui'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import type { NpOption } from '@/lib/nova-poshta/types'
import { NP_COMBOBOX_ITEM_CLASS } from '@/components/checkout/np-combobox-styles'
import { cn } from '@/lib/utils'

export function NpSearchCombobox({
  id,
  label,
  placeholder,
  searchPlaceholder,
  emptyText = 'Нічого не знайдено',
  value,
  options,
  disabled,
  onValueChange,
  onBlur,
  error,
  touched,
}: {
  id: string
  label: string
  placeholder: string
  searchPlaceholder?: string
  emptyText?: string
  value: string
  options: NpOption[]
  disabled?: boolean
  onValueChange: (value: string) => void
  onBlur?: () => void
  error: string | null
  touched: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const anchorRef = useRef<HTMLDivElement>(null)

  const inputPlaceholder = searchPlaceholder ?? placeholder

  const selectedLabel = useMemo(
    () => options.find((opt) => opt.id === value)?.label,
    [options, value]
  )

  useEffect(() => {
    if (!open && value) {
      setQuery(selectedLabel ?? '')
    }
  }, [open, value, selectedLabel])

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((opt) => opt.label.toLowerCase().includes(q))
  }, [options, query])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      if (value) {
        setQuery(selectedLabel ?? '')
      }
      onBlur?.()
    }
  }

  const handleSelect = (opt: NpOption) => {
    onValueChange(opt.id)
    setQuery(opt.label)
    setOpen(false)
    onBlur?.()
  }

  const showClear = !disabled && query.length > 0

  const handleClear = () => {
    setQuery('')
    onValueChange('')
    setOpen(true)
  }

  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor={id}>{label}</RequiredLabel>
      <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
        <PopoverAnchor asChild>
          <div ref={anchorRef} className="relative">
            <Input
              id={id}
              role="combobox"
              aria-expanded={open}
              aria-autocomplete="list"
              aria-controls={`${id}-listbox`}
              aria-invalid={touched && Boolean(error)}
              disabled={disabled}
              placeholder={inputPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                if (!disabled) setOpen(true)
              }}
              onFocus={() => {
                if (!disabled) setOpen(true)
              }}
              className={cn(
                showClear ? 'pr-16' : 'pr-9',
                touched && error && 'border-destructive/80 ring-destructive/30',
              )}
            />
            {showClear && (
              <InputClearButton
                className="right-9"
                onClear={handleClear}
              />
            )}
            <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 shrink-0 opacity-50" />
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) {
              e.preventDefault()
            }
          }}
        >
          <Command shouldFilter={false}>
            <CommandList id={`${id}-listbox`}>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup className="p-0">
                {filteredOptions.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.id}
                    onSelect={() => handleSelect(opt)}
                    className={NP_COMBOBOX_ITEM_CLASS}
                  >
                    <span className="line-clamp-2 text-sm leading-snug">{opt.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FieldHint id={`${id}-error`} show={touched} message={error} />
    </div>
  )
}
