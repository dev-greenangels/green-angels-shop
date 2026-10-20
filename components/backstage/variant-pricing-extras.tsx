'use client'

import { useTranslations } from 'next-intl'

import { VariantAbraSalesPrices } from '@/components/backstage/variant-abra-sales-prices'
import { VariantDiscountRulesPanel } from '@/components/backstage/variant-discount-rules-panel'
import { VariantFinalPricePreview } from '@/components/backstage/variant-final-price-preview'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Per-variant pricing stack:
 * A Retail (parent) · B ABRA read-only · C DiscountRules · D Final preview
 */
export function VariantPricingExtras({
  availableFrom,
  onAvailableFromChange,
  idPrefix,
  productId,
  variantId,
  variantLabel,
}: {
  availableFrom: string
  onAvailableFromChange: (value: string) => void
  idPrefix: string
  productId?: string | null
  variantId?: string | null
  variantLabel: string
}) {
  const tp = useTranslations('pricing')
  const t = useTranslations('productVariantPricing')

  return (
    <div className="space-y-4 border-t border-border/60 pt-4">
      <div className="space-y-2 sm:max-w-xs">
        <Label htmlFor={`${idPrefix}-available-from`}>{tp('availableFrom')}</Label>
        <Input
          id={`${idPrefix}-available-from`}
          type="date"
          value={availableFrom}
          onChange={(e) => onAvailableFromChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{tp('availableFromHint')}</p>
      </div>

      <VariantAbraSalesPrices productId={productId} variantId={variantId} />

      <div className="space-y-1.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('discountsTitle')}
        </h4>
        <p className="text-[11px] text-muted-foreground">{t('discountsHint')}</p>
        <VariantDiscountRulesPanel variantId={variantId} variantLabel={variantLabel} />
      </div>

      <VariantFinalPricePreview variantId={variantId} />
    </div>
  )
}
