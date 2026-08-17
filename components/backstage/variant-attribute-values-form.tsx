'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Search, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createValueDraft,
  normalizeVariantAttributeType,
  parseBulkValuesText,
  type PackagingKind,
  type ValueDraft,
  type VariantAttributeType,
} from '@/lib/backstage/variant-attributes'
import {
  fillEmptyNumbersFromLabel,
  syncNumbersFromLabel,
} from '@/lib/backstage/parse-label-numbers'
import { PACKAGING_KIND_ORDER } from '@/lib/catalog/packaging-kind'
import { cn } from '@/lib/utils'

function ColorSwatch({ hex }: { hex: string }) {
  const valid = /^#[0-9A-Fa-f]{6}$/.test(hex.trim())
  if (!valid) return null
  return (
    <span
      className="inline-block h-5 w-5 shrink-0 rounded-full border border-border"
      style={{ backgroundColor: hex.trim() }}
      aria-hidden
    />
  )
}

function ValueRowFields({
  valueType,
  row,
  unit,
  onPatch,
  onRemove,
  deleteAriaLabel,
  labels,
  numberLocks,
  onNumberLock,
}: {
  valueType: VariantAttributeType
  row: ValueDraft
  unit: string | null
  onPatch: (patch: Partial<ValueDraft>) => void
  onRemove: () => void
  deleteAriaLabel: string
  numberLocks: { min?: boolean; max?: boolean }
  onNumberLock: (field: 'min' | 'max') => void
  labels: {
    name: string
    externalId: string
    volumeLiters: string
    potDiameter: string
    potHeight: string
    tareWeight: string
    packagingKind: string
    packagingKindAuto: string
    packagingKind_POT: string
    packagingKind_ROOT_BALL: string
    packagingKind_BARE_ROOT: string
    packagingKind_POT_ROOT_BALL: string
    min: string
    max: string
    hex: string
    numericValue: string
    namePlaceholder: string
  }
}) {
  const deleteBtn = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-9 w-9 text-destructive hover:text-destructive"
      onClick={onRemove}
      aria-label={deleteAriaLabel}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )

  if (valueType === 'UNIVERSAL') {
    return (
      <div className="grid grid-cols-[1fr_100px_40px] items-center gap-2 px-3 py-2">
        <Input
          value={row.label}
          onChange={(e) => onPatch({ label: e.target.value })}
          placeholder={labels.namePlaceholder}
          className="h-9"
        />
        <Input
          value={row.legacyId}
          onChange={(e) => onPatch({ legacyId: e.target.value })}
          placeholder="ID"
          className="h-9 font-mono text-xs"
        />
        {deleteBtn}
      </div>
    )
  }

  if (valueType === 'CONTAINER') {
    return (
      <div className="space-y-3 rounded-lg border border-border/80 bg-background/30 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{labels.name}</Label>
              <Input
                value={row.label}
                onChange={(e) => onPatch({ label: e.target.value })}
                placeholder="C3, WRB…"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{labels.packagingKind}</Label>
              <Select
                value={row.packagingKind || 'auto'}
                onValueChange={(value) =>
                  onPatch({
                    packagingKind:
                      value === 'auto' ? '' : (value as PackagingKind),
                  })
                }
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder={labels.packagingKind} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{labels.packagingKindAuto}</SelectItem>
                  {PACKAGING_KIND_ORDER.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {labels[`packagingKind_${kind}` as keyof typeof labels]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">{labels.externalId}</Label>
              <Input
                value={row.legacyId}
                onChange={(e) => onPatch({ legacyId: e.target.value })}
                placeholder="ID"
                className="h-9 font-mono text-xs"
              />
            </div>
          </div>
          {deleteBtn}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{labels.volumeLiters}</Label>
            <Input
              value={row.volumeLiters}
              onChange={(e) => onPatch({ volumeLiters: e.target.value })}
              placeholder="—"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{labels.potDiameter}</Label>
            <Input
              value={row.potDiameterCm}
              onChange={(e) => onPatch({ potDiameterCm: e.target.value })}
              placeholder="—"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{labels.potHeight}</Label>
            <Input
              value={row.potHeightCm}
              onChange={(e) => onPatch({ potHeightCm: e.target.value })}
              placeholder="—"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{labels.tareWeight}</Label>
            <Input
              value={row.tareWeightKg}
              onChange={(e) => onPatch({ tareWeightKg: e.target.value })}
              placeholder="—"
              className="h-9 text-sm"
            />
          </div>
        </div>
      </div>
    )
  }

  if (valueType === 'RANGE') {
    return (
      <div className="grid grid-cols-[1fr_72px_72px_80px_40px] items-center gap-2 px-3 py-2">
        <Input
          value={row.label}
          onChange={(e) => {
            const label = e.target.value
            onPatch({
              label,
              ...syncNumbersFromLabel(
                { label, numericMin: row.numericMin, numericMax: row.numericMax },
                'RANGE',
                numberLocks,
              ),
            })
          }}
          placeholder="H80-100, H80+…"
          className="h-9"
        />
        <Input
          value={row.numericMin}
          onChange={(e) => {
            onNumberLock('min')
            onPatch({ numericMin: e.target.value })
          }}
          placeholder="—"
          className="h-9 text-xs"
          title={labels.min}
        />
        <Input
          value={row.numericMax}
          onChange={(e) => {
            onNumberLock('max')
            onPatch({ numericMax: e.target.value })
          }}
          placeholder="—"
          className="h-9 text-xs"
          title={labels.max}
        />
        <Input
          value={row.legacyId}
          onChange={(e) => onPatch({ legacyId: e.target.value })}
          placeholder="ID"
          className="h-9 font-mono text-xs"
        />
        {deleteBtn}
      </div>
    )
  }

  if (valueType === 'COLOR') {
    return (
      <div className="grid grid-cols-[1fr_120px_80px_40px] items-center gap-2 px-3 py-2">
        <Input
          value={row.label}
          onChange={(e) => onPatch({ label: e.target.value })}
          placeholder="Жовтий…"
          className="h-9"
        />
        <div className="flex items-center gap-2">
          <ColorSwatch hex={row.colorHex} />
          <Input
            value={row.colorHex}
            onChange={(e) => onPatch({ colorHex: e.target.value })}
            placeholder="#FFD500"
            className="h-9 font-mono text-xs"
          />
        </div>
        <Input
          value={row.legacyId}
          onChange={(e) => onPatch({ legacyId: e.target.value })}
          placeholder="ID"
          className="h-9 font-mono text-xs"
        />
        {deleteBtn}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[1fr_88px_80px_40px] items-center gap-2 px-3 py-2">
      <Input
        value={row.label}
        onChange={(e) => {
          const label = e.target.value
          onPatch({
            label,
            ...syncNumbersFromLabel(
              { label, numericMin: row.numericMin, numericMax: row.numericMax },
              'NUMBER',
              numberLocks,
            ),
          })
        }}
        placeholder={unit ? `500 ${unit}` : '500 грн'}
        className="h-9"
      />
      <Input
        value={row.numericMin}
        onChange={(e) => {
          onNumberLock('min')
          onPatch({ numericMin: e.target.value })
        }}
        placeholder="—"
        className="h-9 text-xs"
        title={labels.numericValue}
      />
      <Input
        value={row.legacyId}
        onChange={(e) => onPatch({ legacyId: e.target.value })}
        placeholder="ID"
        className="h-9 font-mono text-xs"
      />
      {deleteBtn}
    </div>
  )
}

function ValueTableHeader({
  valueType,
  unit,
  labels,
}: {
  valueType: VariantAttributeType
  unit: string | null
  labels: Record<string, string>
}) {
  const unitSuffix = unit ? ` (${unit})` : ''

  if (valueType === 'UNIVERSAL') {
    return (
      <div className="grid grid-cols-[1fr_100px_40px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
        <span>{labels.name}</span>
        <span>{labels.externalId}</span>
        <span />
      </div>
    )
  }

  if (valueType === 'CONTAINER') {
    return null
  }

  if (valueType === 'RANGE') {
    return (
      <div className="grid grid-cols-[1fr_72px_72px_80px_40px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
        <span>{labels.name}</span>
        <span>
          {labels.min}
          {unitSuffix}
        </span>
        <span>
          {labels.max}
          {unitSuffix}
        </span>
        <span>{labels.externalId}</span>
        <span />
      </div>
    )
  }

  if (valueType === 'COLOR') {
    return (
      <div className="grid grid-cols-[1fr_120px_80px_40px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
        <span>{labels.name}</span>
        <span>{labels.hex}</span>
        <span>{labels.externalId}</span>
        <span />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[1fr_88px_80px_40px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
      <span>{labels.name}</span>
      <span>
        {labels.numericValue}
        {unitSuffix}
      </span>
      <span>{labels.externalId}</span>
      <span />
    </div>
  )
}

export function VariantAttributeValuesForm({
  valueType: rawValueType,
  unit,
  values,
  onValuesChange,
  showSearch = true,
  showBulk = true,
  emptyMessage,
  className,
}: {
  valueType: VariantAttributeType | string
  unit: string
  values: ValueDraft[]
  onValuesChange: (values: ValueDraft[]) => void
  showSearch?: boolean
  showBulk?: boolean
  emptyMessage?: string
  className?: string
}) {
  const tActions = useTranslations('actions')
  const tHints = useTranslations('hints')
  const tLabels = useTranslations('labels')
  const tAria = useTranslations('aria')
  const tCommon = useTranslations('common')
  const tPages = useTranslations('pages.attributes')
  const tBanner = useTranslations('contentBanner')

  const valueType = normalizeVariantAttributeType(rawValueType)
  const [valueSearch, setValueSearch] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [showBulkPanel, setShowBulkPanel] = useState(false)
  const numberLocksRef = useRef<Map<string, { min?: boolean; max?: boolean }>>(new Map())

  useEffect(() => {
    if (valueType !== 'RANGE' && valueType !== 'NUMBER') return
    let changed = false
    const next = values.map((row) => {
      const patch = fillEmptyNumbersFromLabel(row, valueType)
      if (!patch.numericMin && !patch.numericMax) return row
      changed = true
      return { ...row, ...patch }
    })
    if (changed) onValuesChange(next)
    // Only re-fill when attribute type switches to RANGE/NUMBER.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: type-change autofill
  }, [valueType])

  const lockNumberField = (key: string, field: 'min' | 'max') => {
    const prev = numberLocksRef.current.get(key) ?? {}
    numberLocksRef.current.set(key, { ...prev, [field]: true })
  }

  const getNumberLocks = (key: string) => numberLocksRef.current.get(key) ?? {}

  const fieldLabels = useMemo(
    () => ({
      name: tLabels('name'),
      externalId: tLabels('externalId'),
      volumeLiters: tLabels('volumeLiters'),
      potDiameter: tLabels('potDiameter'),
      potHeight: tLabels('potHeight'),
      tareWeight: tLabels('tareWeight'),
      packagingKind: tLabels('packagingKind'),
      packagingKindAuto: tLabels('packagingKindAuto'),
      packagingKind_POT: tLabels('packagingKind_POT'),
      packagingKind_ROOT_BALL: tLabels('packagingKind_ROOT_BALL'),
      packagingKind_BARE_ROOT: tLabels('packagingKind_BARE_ROOT'),
      packagingKind_POT_ROOT_BALL: tLabels('packagingKind_POT_ROOT_BALL'),
      min: 'Min',
      max: 'Max',
      hex: 'HEX',
      numericValue: tLabels('numericValue'),
      namePlaceholder: tBanner('missingPlaceholder'),
    }),
    [tLabels, tHints, tBanner],
  )

  const filteredValues = useMemo(() => {
    const q = valueSearch.trim().toLowerCase()
    if (!q) return values
    return values.filter(
      (v) => v.label.toLowerCase().includes(q) || v.legacyId.toLowerCase().includes(q),
    )
  }, [values, valueSearch])

  const patchValue = (key: string, patch: Partial<ValueDraft>) => {
    onValuesChange(values.map((v) => (v.key === key ? { ...v, ...patch } : v)))
  }

  const removeValue = (key: string) => {
    numberLocksRef.current.delete(key)
    onValuesChange(values.filter((v) => v.key !== key))
  }

  const addEmptyRow = () => {
    setValueSearch('')
    onValuesChange([...values, createValueDraft()])
  }

  const applyBulk = () => {
    const parsed = parseBulkValuesText(bulkText)
    if (parsed.length === 0) return
    onValuesChange([
      ...values,
      ...parsed.map((entry) =>
        createValueDraft({ label: entry.label, legacyId: entry.legacyId ?? '' }),
      ),
    ])
    setBulkText('')
    setShowBulkPanel(false)
  }

  const bulkSupported = valueType === 'UNIVERSAL' || valueType === 'CONTAINER'
  const unitLabel = unit.trim() || null
  const showTableHeader = valueType !== 'CONTAINER'

  return (
    <div className={cn('space-y-3', className)}>
      {valueType === 'RANGE' ? (
        <p className="text-xs text-muted-foreground">{tHints('rangeValueHint')}</p>
      ) : null}
      {valueType === 'CONTAINER' ? (
        <p className="text-xs text-muted-foreground">{tHints('containerValueHint')}</p>
      ) : null}

      <div className="sticky top-0 z-10 -mx-1 border-b border-border/60 bg-background/95 px-1 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-background/90">
        <div className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{tLabels('values', { count: values.length })}</p>
            {showBulk && bulkSupported ? (
              <p className="text-xs text-muted-foreground">{tHints('bulkValueFormat')}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {showBulk && bulkSupported ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBulkPanel((v) => !v)}
              >
                {tActions('bulkAdd')}
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={addEmptyRow}>
              <Plus className="mr-1 h-4 w-4" />
              {tActions('addRow')}
            </Button>
          </div>
        </div>
        {showTableHeader ? (
          <div className="overflow-x-auto border-t border-border/60 bg-muted/40">
            <ValueTableHeader valueType={valueType} unit={unitLabel} labels={fieldLabels} />
          </div>
        ) : null}
      </div>

      {showBulk && bulkSupported && showBulkPanel ? (
        <div className="backstage-glass space-y-2 rounded-lg border p-3">
          <Textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={4}
            placeholder={'C2\nC5 | ext-c5\nWRB'}
            className="font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={applyBulk}>
              {tActions('addToList')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowBulkPanel(false)}>
              {tActions('hide')}
            </Button>
          </div>
        </div>
      ) : null}

      {showSearch ? (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={valueSearch}
            onChange={(e) => setValueSearch(e.target.value)}
            placeholder={tHints('searchValueOrId')}
            className="pl-9"
          />
        </div>
      ) : null}

      {filteredValues.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
          {values.length === 0
            ? (emptyMessage ?? tPages('addFirstValue'))
            : tCommon('nothingFound')}
        </p>
      ) : valueType === 'CONTAINER' ? (
        <div className="space-y-3">
          {filteredValues.map((row) => (
            <ValueRowFields
              key={row.key}
              valueType={valueType}
              row={row}
              unit={unitLabel}
              onPatch={(patch) => patchValue(row.key, patch)}
              onRemove={() => removeValue(row.key)}
              deleteAriaLabel={tAria('deleteValue')}
              labels={fieldLabels}
              numberLocks={getNumberLocks(row.key)}
              onNumberLock={(field) => lockNumberField(row.key, field)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-background/40">
          <div className="divide-y divide-border">
            {filteredValues.map((row) => (
              <ValueRowFields
                key={row.key}
                valueType={valueType}
                row={row}
                unit={unitLabel}
                onPatch={(patch) => patchValue(row.key, patch)}
                onRemove={() => removeValue(row.key)}
                deleteAriaLabel={tAria('deleteValue')}
                labels={fieldLabels}
                numberLocks={getNumberLocks(row.key)}
                onNumberLock={(field) => lockNumberField(row.key, field)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
