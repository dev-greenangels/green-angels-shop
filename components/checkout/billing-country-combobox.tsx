'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  billingCountryDisplayName,
  billingCountryFlagEmoji,
  sortedBillingCountryOptions,
} from '@/lib/checkout/billing-countries'
import { cn } from '@/lib/utils'

export function BillingCountryCombobox({
  id,
  value,
  onChange,
  preferFirst,
  disabled,
  invalid,
  className,
}: {
  id?: string
  value: string
  onChange: (code: string) => void
  /** Codes to pin at top (e.g. host market). */
  preferFirst?: string[]
  disabled?: boolean
  invalid?: boolean
  className?: string
}) {
  const t = useTranslations('checkout')
  const locale = useLocale()
  const [open, setOpen] = useState(false)

  const options = useMemo(
    () => sortedBillingCountryOptions(locale, preferFirst),
    [locale, preferFirst],
  )

  const selectedCode = value.trim().toLowerCase()
  const selectedLabel = selectedCode
    ? billingCountryDisplayName(selectedCode, locale)
    : ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-between border-2 font-normal',
            selectedCode && 'border-primary/35 bg-primary/[0.06] font-medium',
            invalid && 'border-destructive/80 ring-destructive/30',
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            {selectedCode ? (
              <>
                <span aria-hidden>{billingCountryFlagEmoji(selectedCode)}</span>
                <span className="truncate">
                  {selectedLabel}
                  <span className="ml-1.5 text-muted-foreground">
                    ({selectedCode.toUpperCase()})
                  </span>
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">{t('billingCountry')}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={t('billingCountrySearch')} />
          <CommandList className="max-h-72">
            <CommandEmpty>{t('billingCountryNotFound')}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.code}
                  value={`${option.label} ${option.code}`}
                  onSelect={() => {
                    onChange(option.code)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      selectedCode === option.code ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span aria-hidden className="mr-2">
                    {billingCountryFlagEmoji(option.code)}
                  </span>
                  <span className="truncate">{option.label}</span>
                  <span className="ml-auto pl-2 text-xs text-muted-foreground">
                    {option.code.toUpperCase()}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
