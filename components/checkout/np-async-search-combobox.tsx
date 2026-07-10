'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { ChevronsUpDown, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { InputClearButton } from '@/components/ui/input-with-clear'

import {
  FieldHint,
  RequiredLabel,
} from '@/components/auth/auth-form-ui'
import { NP_COMBOBOX_ITEM_CLASS } from '@/components/checkout/np-combobox-styles'
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
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 350

export function NpAsyncSearchCombobox({
  id,
  label,
  placeholder,
  emptyText,
  minChars = 2,
  value,
  valueLabel,
  disabled,
  loadOptions,
  onValueChange,
  onBlur,
  error,
  touched,
}: {
  id: string
  label: string
  placeholder: string
  emptyText?: string
  minChars?: number
  value: string
  valueLabel?: string
  disabled?: boolean
  loadOptions: (query: string) => Promise<NpOption[]>
  onValueChange: (option: NpOption) => void
  onBlur?: () => void
  error: string | null
  touched: boolean
}) {
  const t = useTranslations('checkout')
  const tc = useTranslations('common')
  const resolvedEmptyText = emptyText ?? tc('nothingFound')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(valueLabel ?? '')
  const [options, setOptions] = useState<NpOption[]>([])
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)
  const anchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open && value) {
      setQuery(valueLabel ?? '')
    }
  }, [open, value, valueLabel])

  const runSearch = useCallback(
    async (nextQuery: string) => {
      const trimmed = nextQuery.trim()
      if (trimmed.length < minChars) {
        if (minChars > 0) {
          setOptions([])
          setLoading(false)
          return
        }
      }

      const current = ++requestId.current
      setLoading(true)
      try {
        const result = await loadOptions(trimmed)
        if (current === requestId.current) {
          setOptions(result)
        }
      } catch {
        if (current === requestId.current) {
          setOptions([])
        }
      } finally {
        if (current === requestId.current) {
          setLoading(false)
        }
      }
    },
    [loadOptions, minChars],
  )

  useEffect(() => {
    if (!open || disabled) return
    const timer = window.setTimeout(() => {
      void runSearch(query)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [open, disabled, query, runSearch])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      if (value) {
        setQuery(valueLabel ?? '')
      }
      onBlur?.()
    }
  }

  const handleSelect = (opt: NpOption) => {
    onValueChange(opt)
    setQuery(opt.label)
    setOpen(false)
    onBlur?.()
  }

  const showClear = !disabled && query.length > 0

  const handleClear = () => {
    setQuery('')
    onValueChange({ id: '', label: '' })
    setOptions([])
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
              placeholder={placeholder}
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
            {showClear && <InputClearButton className="right-9" onClear={handleClear} />}
            {loading ? (
              <Loader2 className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin opacity-50" />
            ) : (
              <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 shrink-0 opacity-50" />
            )}
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
              {query.trim().length < minChars ? (
                <CommandEmpty>{t('npMinChars', { count: minChars })}</CommandEmpty>
              ) : loading ? (
                <CommandEmpty>{t('npSearching')}</CommandEmpty>
              ) : (
                <CommandEmpty>{resolvedEmptyText}</CommandEmpty>
              )}
              <CommandGroup className="p-0">
                {options.map((opt, index) => {
                  const prev = options[index - 1]
                  const showPostomatHeader =
                    opt.group === 'postomat' && prev?.group !== 'postomat'

                  return (
                    <Fragment key={opt.id}>
                      {showPostomatHeader && (
                        <>
                          <div className="border-t border-border/40" aria-hidden />
                          <div className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                            {t('npPostomats')}
                          </div>
                        </>
                      )}
                      <CommandItem
                        value={opt.id}
                        onSelect={() => handleSelect(opt)}
                        className={NP_COMBOBOX_ITEM_CLASS}
                      >
                        <span className="line-clamp-2 text-sm leading-snug">{opt.label}</span>
                      </CommandItem>
                    </Fragment>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FieldHint id={`${id}-error`} show={touched} message={error} />
    </div>
  )
}
