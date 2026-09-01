'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, Plus, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  addVariantSelectionValue,
  attributeHasAvailableValues,
  getSelectedValueIds,
  removeVariantSelectionValue,
  type VariantAttributeSelections,
} from '@/lib/backstage/variant-selections'
import {
  buildVariantLabel,
  type VariantAttribute,
} from '@/lib/backstage/variant-attributes'
import { VariantPricingExtras } from '@/components/backstage/variant-pricing-extras'
import { SalesUnitSelect } from '@/components/backstage/sales-unit-select'
import {
  createVariantDraft,
  type PricingMode,
  type ProductVariantDraft,
} from '@/lib/backstage/product-form'
import { cn } from '@/lib/utils'

const pricingModeOptionClassName = cn(
  'flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm transition-all sm:flex-initial sm:px-3.5',
  'text-muted-foreground hover:text-foreground',
  'has-[:checked]:border-border/80 has-[:checked]:bg-background has-[:checked]:font-medium has-[:checked]:text-foreground has-[:checked]:shadow-sm',
)

const pricingModeRadioClassName =
  'size-3.5 shrink-0 border-border/80 bg-background shadow-sm data-[state=checked]:border-primary'

export function VariantAttributePicker({
  attributes,
  selections,
  onChange,
  onClear,
}: {
  attributes: VariantAttribute[]
  selections: VariantAttributeSelections
  onChange: (attributeId: string, valueId: string) => void
  onClear: (attributeId: string, valueId?: string) => void
}) {
  const tp = useTranslations('pricing')
  const [pendingAttributeId, setPendingAttributeId] = useState('')
  const [pendingValueId, setPendingValueId] = useState('')

  const selectedEntries = attributes.flatMap((attr) =>
    getSelectedValueIds(selections, attr.id)
      .map((valueId) => {
        const value = attr.values.find((item) => item.id === valueId)
        if (!value) return null
        return { attr, value }
      })
      .filter((item): item is { attr: VariantAttribute; value: VariantAttribute['values'][number] } =>
        Boolean(item),
      ),
  )

  const availableAttributes = attributes.filter((attr) =>
    attr.valueType === 'COLOR'
      ? attributeHasAvailableValues(attr, selections)
      : !getSelectedValueIds(selections, attr.id).length,
  )
  const pendingAttribute = attributes.find((attr) => attr.id === pendingAttributeId) ?? null
  const pendingValueOptions =
    pendingAttribute?.valueType === 'COLOR'
      ? (pendingAttribute.values ?? []).filter(
          (value) => !getSelectedValueIds(selections, pendingAttribute.id).includes(value.id),
        )
      : (pendingAttribute?.values ?? [])

  const handleAdd = () => {
    if (!pendingAttributeId || !pendingValueId) return
    onChange(pendingAttributeId, pendingValueId)
    if (pendingAttribute?.valueType !== 'COLOR') {
      setPendingAttributeId('')
    }
    setPendingValueId('')
  }

  return (
    <div className="space-y-3">
      {selectedEntries.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedEntries.map(({ attr, value }) => (
            <span
              key={`${attr.id}-${value.id}`}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/70 bg-muted/40 py-0.5 pl-2.5 pr-1 text-xs"
            >
              <span className="truncate">
                <span className="text-muted-foreground">{attr.name}:</span>{' '}
                <span className="font-medium text-foreground">{value.label}</span>
              </span>
              <button
                type="button"
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
                onClick={() => onClear(attr.id, attr.valueType === 'COLOR' ? value.id : undefined)}
                aria-label={tp('removeAttribute')}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{tp('noAttributesSelected')}</p>
      )}

      {availableAttributes.length > 0 ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-[9.5rem] space-y-1.5 sm:w-[11rem]">
            <Label className="text-xs leading-4">{tp('attributeLabel')}</Label>
            <Select
              value={pendingAttributeId || '__none__'}
              onValueChange={(value) => {
                setPendingAttributeId(value === '__none__' ? '' : value)
                setPendingValueId('')
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={tp('selectAttribute')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{tp('notSelectedOption')}</SelectItem>
                {availableAttributes.map((attr) => (
                  <SelectItem key={attr.id} value={attr.id}>
                    {attr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[9.5rem] space-y-1.5 sm:w-[11rem]">
            <Label className="text-xs leading-4">{tp('valueLabel')}</Label>
            <Select
              value={pendingValueId || '__none__'}
              onValueChange={(value) => setPendingValueId(value === '__none__' ? '' : value)}
              disabled={!pendingAttribute}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={tp('selectValue')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{tp('notSelectedOption')}</SelectItem>
                {pendingValueOptions.map((value) => (
                  <SelectItem key={value.id} value={value.id}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <span className="block text-xs leading-4 opacity-0" aria-hidden>
              .
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              disabled={!pendingAttributeId || !pendingValueId}
              onClick={handleAdd}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {tp('addAttribute')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function ProductPricingModeSwitcher({
  value,
  onChange,
  className,
}: {
  value: PricingMode
  onChange: (mode: PricingMode) => void
  className?: string
}) {
  const tp = useTranslations('pricing')

  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as PricingMode)}
      className={cn(
        'inline-flex w-full max-w-lg shrink-0 gap-1 rounded-lg border border-border/80 bg-muted/50 p-1 shadow-sm sm:w-auto',
        className,
      )}
    >
      <label htmlFor="pricing-simple" className={pricingModeOptionClassName}>
        <RadioGroupItem value="simple" id="pricing-simple" className={pricingModeRadioClassName} />
        <span className="truncate">{tp('simpleProduct')}</span>
      </label>
      <label
        htmlFor="pricing-variants"
        className={pricingModeOptionClassName}
        title={tp('bySizesTitle')}
      >
        <RadioGroupItem
          value="variants"
          id="pricing-variants"
          className={pricingModeRadioClassName}
        />
        <span className="truncate">{tp('bySizes')}</span>
      </label>
    </RadioGroup>
  )
}

function VariantAccordionItem({
  variant,
  index,
  attributes,
  expanded,
  canRemove,
  onToggle,
  onChange,
  onRemove,
}: {
  variant: ProductVariantDraft
  index: number
  attributes: VariantAttribute[]
  expanded: boolean
  canRemove: boolean
  onToggle: () => void
  onChange: (patch: Partial<ProductVariantDraft>) => void
  onRemove: () => void
}) {
  const tp = useTranslations('pricing')
  const th = useTranslations('hints')
  const label = buildVariantLabel(attributes, variant.selections)
  const displayLabel = label || tp('variantSelectSizes', { n: index + 1 })
  const stockCount =
    variant.stock.trim() === '' ? 0 : Math.max(0, Number(variant.stock) || 0)

  const updateSelection = (attributeId: string, valueId: string) => {
    const attribute = attributes.find((item) => item.id === attributeId)
    if (!attribute) return
    onChange({
      selections: addVariantSelectionValue(variant.selections, attribute, valueId),
    })
  }

  const clearSelection = (attributeId: string, valueId?: string) => {
    const attribute = attributes.find((item) => item.id === attributeId)
    if (!attribute) return
    onChange({
      selections: removeVariantSelectionValue(variant.selections, attribute, valueId),
    })
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-background/40 transition-colors',
        expanded && 'border-primary/40 ring-1 ring-primary/15',
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3 text-left hover:bg-muted/40"
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              expanded && 'rotate-180',
            )}
          />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{displayLabel}</span>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
              stockCount < 1
                ? 'bg-red-100 text-red-800'
                : stockCount < 20
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800',
            )}
          >
            {tp('stockUnitsShort', { count: stockCount })}
          </span>
        </button>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mr-2 h-8 w-8 shrink-0 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            aria-label={tp('deleteVariant')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-clip">
          {expanded ? (
          <div
            className="space-y-4 overflow-y-auto overscroll-contain border-t border-border/60 px-4 py-4 [overflow-anchor:none]"
            style={{ maxHeight: '28rem' }}
          >
          {attributes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {tp('createAttributesPrefix')}{' '}
              <Link href="/backstage/attributes" className="text-primary underline">
                {tp('attributesSection')}
              </Link>
              .
            </p>
          ) : (
            <VariantAttributePicker
              attributes={attributes}
              selections={variant.selections}
              onChange={(attributeId, valueId) => updateSelection(attributeId, valueId)}
              onClear={(attributeId, valueId) => clearSelection(attributeId, valueId)}
            />
          )}

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor={`variant-sku-${variant.clientId}`}>SKU</Label>
              <Input
                id={`variant-sku-${variant.clientId}`}
                value={variant.sku}
                onChange={(e) => onChange({ sku: e.target.value })}
                placeholder="TH-SM-C5-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`variant-ean-${variant.clientId}`}>EAN</Label>
              <Input
                id={`variant-ean-${variant.clientId}`}
                value={variant.ean}
                onChange={(e) => onChange({ ean: e.target.value })}
                placeholder="4820000000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`variant-price-${variant.clientId}`}>{tp('basePrice')}</Label>
              <Input
                id={`variant-price-${variant.clientId}`}
                type="number"
                min="0"
                step="0.01"
                value={variant.price}
                onChange={(e) => onChange({ price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`variant-stock-${variant.clientId}`}>{tp('inStock')}</Label>
              <Input
                id={`variant-stock-${variant.clientId}`}
                type="number"
                min="0"
                value={variant.stock}
                onChange={(e) => onChange({ stock: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <SalesUnitSelect
                id={`variant-unit-${variant.clientId}`}
                value={variant.salesUnitId}
                onChange={(salesUnitId) => onChange({ salesUnitId })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`variant-legacy-${variant.clientId}`}>{tp('legacyIdShort')}</Label>
              <Input
                id={`variant-legacy-${variant.clientId}`}
                value={variant.legacyId}
                onChange={(e) => onChange({ legacyId: e.target.value })}
                placeholder={th('optional')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`variant-weight-${variant.clientId}`}>Вага, кг</Label>
              <Input
                id={`variant-weight-${variant.clientId}`}
                type="number"
                min="0"
                step="0.01"
                value={variant.weight}
                onChange={(e) => onChange({ weight: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`variant-length-${variant.clientId}`}>Довжина, см</Label>
              <Input
                id={`variant-length-${variant.clientId}`}
                type="number"
                min="0"
                step="0.1"
                value={variant.lengthCm}
                onChange={(e) => onChange({ lengthCm: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`variant-width-${variant.clientId}`}>Ширина, см</Label>
              <Input
                id={`variant-width-${variant.clientId}`}
                type="number"
                min="0"
                step="0.1"
                value={variant.widthCm}
                onChange={(e) => onChange({ widthCm: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`variant-height-${variant.clientId}`}>Висота, см</Label>
              <Input
                id={`variant-height-${variant.clientId}`}
                type="number"
                min="0"
                step="0.1"
                value={variant.heightCm}
                onChange={(e) => onChange({ heightCm: e.target.value })}
              />
            </div>
          </div>

          <VariantPricingExtras
            idPrefix={`variant-${variant.clientId}`}
            availableFrom={variant.availableFrom}
            quantityPrices={variant.quantityPrices}
            onAvailableFromChange={(availableFrom) => onChange({ availableFrom })}
            onQuantityPricesChange={(quantityPrices) => onChange({ quantityPrices })}
          />
          </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function VariantAccordionList({
  variants,
  attributes,
  attributesLoading,
  onVariantsChange,
}: {
  variants: ProductVariantDraft[]
  attributes: VariantAttribute[]
  attributesLoading?: boolean
  onVariantsChange: (variants: ProductVariantDraft[]) => void
}) {
  const tp = useTranslations('pricing')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!expandedId) return
    if (variants.some((v) => v.clientId === expandedId)) return
    setExpandedId(null)
  }, [variants, expandedId])

  const updateVariant = (clientId: string, patch: Partial<ProductVariantDraft>) => {
    onVariantsChange(variants.map((v) => (v.clientId === clientId ? { ...v, ...patch } : v)))
  }

  const removeVariant = (clientId: string) => {
    const next = variants.filter((v) => v.clientId !== clientId)
    onVariantsChange(next)
    if (expandedId === clientId) {
      setExpandedId(null)
    }
  }

  const addVariant = () => {
    const draft = createVariantDraft()
    onVariantsChange([...variants, draft])
    setExpandedId(draft.clientId)
  }

  return (
    <div className="space-y-2">
      {attributesLoading ? (
        <p className="text-sm text-muted-foreground">{tp('loadingAttributes')}</p>
      ) : null}
      <div className="space-y-2 [overflow-anchor:none]">
        {variants.map((variant, index) => (
          <VariantAccordionItem
            key={variant.clientId}
            variant={variant}
            index={index}
            attributes={attributes}
            expanded={expandedId === variant.clientId}
            canRemove={variants.length > 1}
            onToggle={() =>
              setExpandedId((prev) => (prev === variant.clientId ? null : variant.clientId))
            }
            onChange={(patch) => updateVariant(variant.clientId, patch)}
            onRemove={() => removeVariant(variant.clientId)}
          />
        ))}
      </div>
      <Button type="button" variant="outline" onClick={addVariant}>
        <Plus className="mr-2 h-4 w-4" />
        {tp('addVariant')}
      </Button>
    </div>
  )
}

export function ProductPricingSection({
  pricingMode,
  simpleSku,
  simpleEan,
  simpleStock,
  simplePrice,
  onSimpleChange,
  variants,
  onVariantsChange,
  attributes,
  attributesLoading,
}: {
  pricingMode: PricingMode
  simpleSku: string
  simpleEan: string
  simpleStock: string
  simplePrice: string
  onSimpleChange: (
    field: 'simpleSku' | 'simpleEan' | 'simpleStock' | 'simplePrice',
    value: string,
  ) => void
  variants: ProductVariantDraft[]
  onVariantsChange: (variants: ProductVariantDraft[]) => void
  attributes: VariantAttribute[]
  attributesLoading?: boolean
}) {
  const tp = useTranslations('pricing')
  const simpleVariant = variants[0] ?? createVariantDraft()

  const patchSimpleVariant = (patch: Partial<ProductVariantDraft>) => {
    const base = variants[0] ?? createVariantDraft()
    onVariantsChange([{ ...base, ...patch }, ...variants.slice(1)])
  }
  return (
    <div data-pricing-section className="overflow-hidden">
      {pricingMode === 'simple' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="simple-sku">{tp('skuArticle')}</Label>
            <Input
              id="simple-sku"
              value={simpleSku}
              onChange={(e) => onSimpleChange('simpleSku', e.target.value)}
              placeholder="TH-SM-001"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="simple-ean">EAN</Label>
            <Input
              id="simple-ean"
              value={simpleEan}
              onChange={(e) => onSimpleChange('simpleEan', e.target.value)}
              placeholder="4820000000000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="simple-price">{tp('basePrice')}</Label>
            <Input
              id="simple-price"
              type="number"
              min="0"
              step="0.01"
              value={simplePrice}
              onChange={(e) => onSimpleChange('simplePrice', e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="simple-stock">{tp('inStock')}</Label>
            <Input
              id="simple-stock"
              type="number"
              min="0"
              value={simpleStock}
              onChange={(e) => onSimpleChange('simpleStock', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <SalesUnitSelect
              id="simple-sales-unit"
              value={simpleVariant.salesUnitId}
              onChange={(salesUnitId) => patchSimpleVariant({ salesUnitId })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="simple-weight">Вага, кг</Label>
            <Input
              id="simple-weight"
              type="number"
              min="0"
              step="0.01"
              value={simpleVariant.weight}
              onChange={(e) => patchSimpleVariant({ weight: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="simple-length">Довжина, см</Label>
            <Input
              id="simple-length"
              type="number"
              min="0"
              step="0.1"
              value={simpleVariant.lengthCm}
              onChange={(e) => patchSimpleVariant({ lengthCm: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="simple-width">Ширина, см</Label>
            <Input
              id="simple-width"
              type="number"
              min="0"
              step="0.1"
              value={simpleVariant.widthCm}
              onChange={(e) => patchSimpleVariant({ widthCm: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="simple-height">Висота, см</Label>
            <Input
              id="simple-height"
              type="number"
              min="0"
              step="0.1"
              value={simpleVariant.heightCm}
              onChange={(e) => patchSimpleVariant({ heightCm: e.target.value })}
            />
          </div>

          <div className="sm:col-span-2">
            <VariantPricingExtras
              idPrefix="simple"
              availableFrom={simpleVariant.availableFrom}
              quantityPrices={simpleVariant.quantityPrices}
              onAvailableFromChange={(availableFrom) => patchSimpleVariant({ availableFrom })}
              onQuantityPricesChange={(quantityPrices) => patchSimpleVariant({ quantityPrices })}
            />
          </div>
        </div>
      ) : (
        <VariantAccordionList
          variants={variants}
          attributes={attributes}
          attributesLoading={attributesLoading}
          onVariantsChange={onVariantsChange}
        />
      )}
    </div>
  )
}
