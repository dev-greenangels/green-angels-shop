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
import type { ColorDisplayMode } from '@/lib/backstage/characteristics'

export function ColorDisplayModeField({
  value,
  onChange,
}: {
  value: ColorDisplayMode
  onChange: (value: ColorDisplayMode) => void
}) {
  const tLabels = useTranslations('labels')

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor="color-display-mode">{tLabels('colorDisplayMode')}</Label>
      <Select value={value} onValueChange={(next) => onChange(next as ColorDisplayMode)}>
        <SelectTrigger id="color-display-mode" className="max-w-md">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="BOTH">{tLabels('colorDisplayBoth')}</SelectItem>
          <SelectItem value="TEXT">{tLabels('colorDisplayText')}</SelectItem>
          <SelectItem value="SWATCH">{tLabels('colorDisplaySwatch')}</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{tLabels('colorDisplayModeHint')}</p>
    </div>
  )
}
