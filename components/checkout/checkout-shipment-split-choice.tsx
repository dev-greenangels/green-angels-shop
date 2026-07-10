'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { ShipmentDateBadge } from '@/components/product/shipment-date-badge'
import { cn } from '@/lib/utils'
import type { ShipmentSplitMode } from '@/lib/cart-shipment-split'

type CheckoutShipmentSplitChoiceProps = {
  latestDate: string
  mode: ShipmentSplitMode
  onModeChange: (mode: ShipmentSplitMode) => void
  className?: string
  children?: ReactNode
}

export function CheckoutShipmentSplitChoice({
  latestDate,
  mode,
  onModeChange,
  className,
  children,
}: CheckoutShipmentSplitChoiceProps) {
  const t = useTranslations('checkout.shipmentSplit')

  const options: Array<{
    value: ShipmentSplitMode
    title: ReactNode
    description: ReactNode
  }> = [
    {
      value: 'together',
      title: (
        <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span>{t('togetherPrefix')}</span>
          <ShipmentDateBadge date={latestDate} className="align-middle" />
        </span>
      ),
      description: t('togetherDescription'),
    },
    {
      value: 'split',
      title: t('split'),
      description: (
        <span>
          {t('splitDescriptionPrefix')}{' '}
          <span className="font-semibold text-foreground">{latestDate}</span>
        </span>
      ),
    },
  ]

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <p className="text-sm font-semibold text-foreground">{t('title')}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t('hint')}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = mode === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onModeChange(option.value)}
              className={cn(
                'w-full rounded-xl px-3.5 py-3 text-left transition-[background-color,box-shadow,ring]',
                selected
                  ? 'bg-primary/10 ring-2 ring-primary/30'
                  : 'bg-muted/40 hover:bg-muted/60',
              )}
            >
              <div className="text-sm font-semibold text-foreground">{option.title}</div>
              <div className="mt-1 text-xs leading-snug text-muted-foreground">
                {option.description}
              </div>
            </button>
          )
        })}
      </div>

      {children}
    </div>
  )
}
