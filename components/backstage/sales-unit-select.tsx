'use client'

import { useTranslations } from 'next-intl'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCommerceSettings, useDefaultSalesUnit } from '@/components/providers/commerce-provider'

export function SalesUnitSelect({
  value,
  onChange,
  id,
}: {
  value?: string
  onChange: (salesUnitId: string) => void
  id?: string
}) {
  const tp = useTranslations('pricing')
  const defaultUnit = useDefaultSalesUnit()
  const { units } = useCommerceSettings()
  const resolved = value?.trim() || defaultUnit.id

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{tp('salesUnit')}</Label>
      <Select value={resolved} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {units
            .filter((unit) => unit.isActive)
            .map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.symbol} — {unit.translations.find((t) => t.locale === 'uk')?.name ?? unit.code}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  )
}
