'use client'

import { Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { FormattedPrice } from '@/components/commerce/formatted-price'
import {
  adjustCatalogPriceRange,
  resolveCatalogPriceRange,
  setCatalogPriceRange,
  type CatalogFilters,
  type CatalogPriceBounds,
} from '@/lib/catalog/filter-plants'
import { cn } from '@/lib/utils'

type CatalogPriceFilterProps = {
  filters: CatalogFilters
  bounds: CatalogPriceBounds
  onFilterChange: (filters: CatalogFilters) => void
}

const BOUND_BTN_CLASS =
  'size-7 shrink-0 rounded-md border-border/60 text-muted-foreground hover:text-foreground'

type PriceBoundStepperProps = {
  value: number
  decreaseLabel: string
  increaseLabel: string
  canDecrease: boolean
  canIncrease: boolean
  onDecrease: () => void
  onIncrease: () => void
  className?: string
}

function PriceBoundStepper({
  value,
  decreaseLabel,
  increaseLabel,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
  className,
}: PriceBoundStepperProps) {
  return (
    <div className={cn('flex min-w-0 flex-1 items-center gap-0.5', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={BOUND_BTN_CLASS}
        disabled={!canDecrease}
        onClick={onDecrease}
        aria-label={decreaseLabel}
      >
        <Minus className="size-3.5" />
      </Button>
      <span
        className="min-w-0 flex-1 truncate text-center text-xs font-medium tabular-nums"
      >
        <FormattedPrice amount={value} className="inline" />
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={BOUND_BTN_CLASS}
        disabled={!canIncrease}
        onClick={onIncrease}
        aria-label={increaseLabel}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  )
}

export function CatalogPriceFilter({ filters, bounds, onFilterChange }: CatalogPriceFilterProps) {
  const t = useTranslations('filter')
  const disabled = bounds.max <= bounds.min

  const resolved = resolveCatalogPriceRange(filters.price, bounds)
  const [localRange, setLocalRange] = useState<[number, number]>([resolved.min, resolved.max])

  useEffect(() => {
    setLocalRange([resolved.min, resolved.max])
  }, [resolved.min, resolved.max, bounds.min, bounds.max])

  const commitRange = (min: number, max: number) => {
    const next: [number, number] = [min, max]
    setLocalRange(next)
    onFilterChange(setCatalogPriceRange(filters, min, max, bounds))
  }

  const adjustBound = (bound: 'min' | 'max', direction: -1 | 1) => {
    const next = adjustCatalogPriceRange(
      { min: localRange[0], max: localRange[1] },
      bound,
      direction,
      bounds,
    )
    commitRange(next.min, next.max)
  }

  if (disabled) {
    return <p className="text-sm text-muted-foreground">{t('priceUnavailable')}</p>
  }

  const [min, max] = localRange

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <PriceBoundStepper
          value={min}
          decreaseLabel={t('priceDecreaseMin')}
          increaseLabel={t('priceIncreaseMin')}
          canDecrease={min > bounds.min}
          canIncrease={min < max}
          onDecrease={() => adjustBound('min', -1)}
          onIncrease={() => adjustBound('min', 1)}
        />
        <span className="shrink-0 text-xs text-muted-foreground">—</span>
        <PriceBoundStepper
          value={max}
          decreaseLabel={t('priceDecreaseMax')}
          increaseLabel={t('priceIncreaseMax')}
          canDecrease={max > min}
          canIncrease={max < bounds.max}
          onDecrease={() => adjustBound('max', -1)}
          onIncrease={() => adjustBound('max', 1)}
        />
      </div>
      <Slider
        min={bounds.min}
        max={bounds.max}
        step={1}
        value={localRange}
        onValueChange={(value) => setLocalRange([value[0]!, value[1]!])}
        onValueCommit={(value) =>
          onFilterChange(setCatalogPriceRange(filters, value[0]!, value[1]!, bounds))
        }
        className="py-0.5 [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:hover:ring-2 [&_[data-slot=slider-thumb]]:focus-visible:ring-2 [&_[data-slot=slider-track]]:h-1"
      />
      <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <FormattedPrice amount={bounds.min} />
        <FormattedPrice amount={bounds.max} />
      </div>
    </div>
  )
}
