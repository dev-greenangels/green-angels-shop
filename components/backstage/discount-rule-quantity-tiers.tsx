'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DiscountRuleQuantityTier, DiscountValueType } from '@/lib/backstage/pricing'

export type QuantityTierDraft = {
  clientId: string
  minQuantity: string
  type: DiscountValueType
  value: string
}

export function tiersFromRule(
  tiers: DiscountRuleQuantityTier[] | undefined,
): QuantityTierDraft[] {
  return (tiers ?? []).map((tier, index) => ({
    clientId: tier.id ?? `tier-${index}-${tier.minQuantity}`,
    minQuantity: String(tier.minQuantity),
    type: tier.type,
    value: String(tier.value),
  }))
}

export function tiersToPayload(tiers: QuantityTierDraft[]) {
  return tiers
    .filter((row) => row.minQuantity.trim() && row.value.trim())
    .map((row) => ({
      minQuantity: Number(row.minQuantity),
      type: row.type,
      value: Number(row.value),
    }))
}

export function DiscountRuleQuantityTiersEditor({
  tiers,
  onChange,
}: {
  tiers: QuantityTierDraft[]
  onChange: (tiers: QuantityTierDraft[]) => void
}) {
  const t = useTranslations('discountRules')

  const update = (clientId: string, patch: Partial<QuantityTierDraft>) => {
    onChange(tiers.map((row) => (row.clientId === clientId ? { ...row, ...patch } : row)))
  }

  const nextSuggestedMin = () => {
    const maxima = tiers
      .map((row) => Number(row.minQuantity))
      .filter((n) => Number.isFinite(n) && n >= 1)
    if (!maxima.length) return '1'
    return String(Math.max(...maxima) + 5)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Label className="text-xs font-medium">{t('tiersTitle')}</Label>
          <p className="text-xs text-muted-foreground">{t('tiersHint')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 shrink-0"
          onClick={() =>
            onChange([
              ...tiers,
              {
                clientId: `new-${Date.now()}`,
                minQuantity: nextSuggestedMin(),
                type: tiers[0]?.type ?? 'PERCENT',
                value: '5',
              },
            ])
          }
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {t('addTier')}
        </Button>
      </div>

      {tiers.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('noTiers')}</p>
      ) : (
        <div className="space-y-2">
          {tiers.map((row) => (
            <div
              key={row.clientId}
              className="grid gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5 sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('fromQty')}</Label>
                <Input
                  type="number"
                  min={1}
                  className="h-8 text-sm"
                  value={row.minQuantity}
                  onChange={(e) => update(row.clientId, { minQuantity: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('type')}</Label>
                <Select
                  value={row.type}
                  onValueChange={(value) =>
                    update(row.clientId, { type: value as DiscountValueType })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[80]">
                    <SelectItem value="PERCENT">{t('typePercent')}</SelectItem>
                    <SelectItem value="FIXED">{t('typeFixed')}</SelectItem>
                    <SelectItem value="FIXED_PRICE">{t('typeFixedPrice')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {row.type === 'PERCENT'
                    ? t('valuePercent')
                    : row.type === 'FIXED_PRICE'
                      ? t('valueFixedPrice')
                      : t('valueFixed')}
                </Label>
                <Input
                  type="number"
                  min={0.01}
                  step={row.type === 'PERCENT' ? '1' : '0.01'}
                  max={row.type === 'PERCENT' ? 100 : undefined}
                  className="h-8 text-sm"
                  value={row.value}
                  onChange={(e) => update(row.clientId, { value: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={tiers.length <= 1}
                  onClick={() => onChange(tiers.filter((item) => item.clientId !== row.clientId))}
                  aria-label={t('removeTier')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
