'use client'

import { useTranslations } from 'next-intl'
import { Plus, Trash2 } from 'lucide-react'

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
import {
  createQuantityPriceDraft,
  type QuantityDiscountType,
  type VariantQuantityPriceDraft,
} from '@/lib/backstage/variant-pricing'

export function VariantPricingExtras({
  availableFrom,
  quantityPrices,
  onAvailableFromChange,
  onQuantityPricesChange,
  idPrefix,
}: {
  availableFrom: string
  quantityPrices: VariantQuantityPriceDraft[]
  onAvailableFromChange: (value: string) => void
  onQuantityPricesChange: (rows: VariantQuantityPriceDraft[]) => void
  idPrefix: string
}) {
  const tp = useTranslations('pricing')

  const updateRow = (clientId: string, patch: Partial<VariantQuantityPriceDraft>) => {
    onQuantityPricesChange(
      quantityPrices.map((row) => (row.clientId === clientId ? { ...row, ...patch } : row)),
    )
  }

  const removeRow = (clientId: string) => {
    onQuantityPricesChange(quantityPrices.filter((row) => row.clientId !== clientId))
  }

  const addRow = () => {
    onQuantityPricesChange([...quantityPrices, createQuantityPriceDraft()])
  }

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

      <div className="space-y-3">
        <div>
          <Label>{tp('quantityDiscounts')}</Label>
          <p className="text-xs text-muted-foreground">{tp('quantityDiscountsHint')}</p>
        </div>

        {quantityPrices.length > 0 ? (
          <div className="space-y-2">
            {quantityPrices.map((row) => (
              <div
                key={row.clientId}
                className="grid gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]"
              >
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{tp('fromQty')}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={row.minQuantity}
                    onChange={(e) => updateRow(row.clientId, { minQuantity: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{tp('type')}</Label>
                  <Select
                    value={row.discountType}
                    onValueChange={(value) =>
                      updateRow(row.clientId, { discountType: value as QuantityDiscountType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_price">{tp('fixedPrice')}</SelectItem>
                      <SelectItem value="percent">{tp('percent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {row.discountType === 'percent' ? tp('discountPercent') : tp('pricePerUnit')}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max={row.discountType === 'percent' ? '99' : undefined}
                    step={row.discountType === 'percent' ? '1' : '0.01'}
                    value={row.value}
                    onChange={(e) => updateRow(row.clientId, { value: e.target.value })}
                    placeholder={row.discountType === 'percent' ? '10' : '400'}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{tp('validFrom')}</Label>
                  <Input
                    type="date"
                    value={row.validFrom}
                    onChange={(e) => updateRow(row.clientId, { validFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{tp('validTo')}</Label>
                  <Input
                    type="date"
                    value={row.validTo}
                    onChange={(e) => updateRow(row.clientId, { validTo: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="self-end text-destructive hover:text-destructive"
                  onClick={() => removeRow(row.clientId)}
                  aria-label={tp('deleteDiscount')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{tp('noDiscounts')}</p>
        )}

        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-2 h-4 w-4" />
          {tp('addDiscount')}
        </Button>
      </div>
    </div>
  )
}
