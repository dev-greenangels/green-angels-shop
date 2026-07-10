'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Save, Trash2 } from 'lucide-react'

import { VariantAttributeValuesForm } from '@/components/backstage/variant-attribute-values-form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  attributeToValueDrafts,
  attributeTypeNeedsUnit,
  isVariantAttributeDirty,
  normalizeVariantAttributeType,
  snapshotFromAttribute,
  snapshotFromDrafts,
  VARIANT_ATTRIBUTE_TYPES,
  type ValueDraft,
  type VariantAttribute,
  type VariantAttributeType,
} from '@/lib/backstage/variant-attributes'
import { cn } from '@/lib/utils'

export function VariantAttributeEditor({
  attribute,
  saving,
  onSave,
  onDelete,
}: {
  attribute: VariantAttribute
  saving?: boolean
  onSave: (payload: {
    name: string
    slug: string
    valueType: VariantAttributeType
    description: string | null
    unit: string | null
    legacyId: string | null
    isFilterable: boolean
    participatesInLabel: boolean
    values: ValueDraft[]
  }) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const tActions = useTranslations('actions')
  const tHints = useTranslations('hints')
  const tLabels = useTranslations('labels')
  const tPages = useTranslations('pages.attributes')
  const tAttrTypes = useTranslations('variantAttributeTypes')
  const tAttrTypeHints = useTranslations('variantAttributeTypeHints')

  const [name, setName] = useState(attribute.name)
  const [slug, setSlug] = useState(attribute.slug)
  const [valueType, setValueType] = useState<VariantAttributeType>(() =>
    normalizeVariantAttributeType(attribute.valueType),
  )
  const [description, setDescription] = useState(attribute.description ?? '')
  const [unit, setUnit] = useState(attribute.unit ?? '')
  const [legacyId, setLegacyId] = useState(attribute.legacyId ?? '')
  const [isFilterable, setIsFilterable] = useState(attribute.isFilterable)
  const [participatesInLabel, setParticipatesInLabel] = useState(attribute.participatesInLabel)
  const [values, setValues] = useState<ValueDraft[]>(() => attributeToValueDrafts(attribute))

  const showUnit = attributeTypeNeedsUnit(valueType)

  useEffect(() => {
    setName(attribute.name)
    setSlug(attribute.slug)
    setValueType(normalizeVariantAttributeType(attribute.valueType))
    setDescription(attribute.description ?? '')
    setUnit(attribute.unit ?? '')
    setLegacyId(attribute.legacyId ?? '')
    setIsFilterable(attribute.isFilterable)
    setParticipatesInLabel(attribute.participatesInLabel)
    setValues(attributeToValueDrafts(attribute))
  }, [attribute])

  const baseline = useMemo(() => snapshotFromAttribute(attribute), [attribute])

  const isDirty = useMemo(
    () =>
      isVariantAttributeDirty(
        snapshotFromDrafts(
          name,
          slug,
          valueType,
          description,
          unit,
          legacyId,
          isFilterable,
          participatesInLabel,
          values,
        ),
        baseline,
      ),
    [name, slug, valueType, description, unit, legacyId, isFilterable, participatesInLabel, values, baseline],
  )

  const handleSave = async () => {
    await onSave({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      valueType,
      description: description.trim() || null,
      unit: unit.trim() || null,
      legacyId: legacyId.trim() || null,
      isFilterable,
      participatesInLabel,
      values,
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <div className="space-y-4 pb-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-attr-name">{tLabels('nameRequired')}</Label>
              <Input id="edit-attr-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-attr-legacy">{tLabels('legacyId')}</Label>
              <Input
                id="edit-attr-legacy"
                value={legacyId}
                onChange={(e) => setLegacyId(e.target.value)}
                placeholder={tHints('optional')}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-attr-type">{tPages('attributeType')}</Label>
              <Select
                value={valueType}
                onValueChange={(v) => setValueType(v as VariantAttributeType)}
              >
                <SelectTrigger id="edit-attr-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VARIANT_ATTRIBUTE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {tAttrTypes(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{tAttrTypeHints(valueType)}</p>
              <p className="text-xs text-muted-foreground">{tHints('attributeTypeChangeHint')}</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-attr-slug">{tLabels('slugTechnical')}</Label>
              <Input
                id="edit-attr-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="font-mono text-sm"
                placeholder="obkhvat-krony"
              />
              <p className="text-xs text-muted-foreground">{tHints('attributeSlugHint')}</p>
            </div>
            {showUnit ? (
              <div className="space-y-2">
                <Label htmlFor="edit-attr-unit">{tLabels('unit')}</Label>
                <Input
                  id="edit-attr-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={tHints('unitPlaceholder')}
                />
                <p className="text-xs text-muted-foreground">{tHints('optional')}</p>
              </div>
            ) : null}
            <div className={cn('space-y-2', !showUnit && 'sm:col-span-2')}>
              <Label htmlFor="edit-attr-desc">{tLabels('description')}</Label>
              <Textarea
                id="edit-attr-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder={tHints('attributeDescriptionPlaceholder')}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{tHints('attributeDescriptionHint')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-attr-filterable"
                  checked={isFilterable}
                  onCheckedChange={(checked) => setIsFilterable(checked === true)}
                />
                <Label htmlFor="edit-attr-filterable" className="font-normal">
                  {tLabels('inCatalogFilters')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-attr-label"
                  checked={participatesInLabel}
                  onCheckedChange={(checked) => setParticipatesInLabel(checked === true)}
                />
                <Label htmlFor="edit-attr-label" className="font-normal">
                  {tLabels('inVariantName')}
                </Label>
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 pt-4">
            <VariantAttributeValuesForm
              valueType={valueType}
              unit={unit}
              values={values}
              onValuesChange={setValues}
            />
          </div>
        </div>
      </div>

      <div
        className={cn(
          'shrink-0 border-t border-border/60 bg-background pt-4',
          'supports-[backdrop-filter]:bg-background/95',
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => void onDelete()}
            disabled={saving}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {tActions('deleteAttribute')}
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving || !isDirty}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tActions('saving')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {tActions('saveChanges')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function VariantAttributeListItem({
  item,
  active,
  onClick,
}: {
  item: VariantAttribute
  active: boolean
  onClick: () => void
}) {
  const tStatus = useTranslations('status')
  const tAttrTypes = useTranslations('variantAttributeTypes')
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border px-3 py-3 text-left transition-colors',
        active
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/30 hover:bg-muted/40',
      )}
    >
      <p className="font-medium text-foreground">{item.name}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {tAttrTypes(normalizeVariantAttributeType(item.valueType))} · {tStatus('values', { count: item.values.length })}
        {item.legacyId ? ` · ID: ${item.legacyId}` : ''}
        {item.isFilterable ? ` · ${tStatus('filterable')}` : ''}
      </p>
    </button>
  )
}
