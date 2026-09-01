'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Save, Trash2 } from 'lucide-react'

import { useContentLocaleSwitchSave } from '@/components/backstage/backstage-content-locale'

import { VariantAttributeValuesForm } from '@/components/backstage/variant-attribute-values-form'
import { ColorDisplayModeField } from '@/components/backstage/color-display-mode-field'
import { TranslationHint, ContentLocaleLabel, LocaleTranslationButton } from '@/components/backstage/content-locale-banner'
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
  type ColorDisplayMode,
} from '@/lib/backstage/variant-attributes'
import { VARIANT_ATTRIBUTE_ICON_OPTIONS } from '@/lib/variant-attributes/icons'
import { cn } from '@/lib/utils'

export function VariantAttributeEditor({
  attribute,
  saving,
  onSave,
  onDelete,
  onReload,
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
    showOnProductPage: boolean
    icon: string | null
    colorDisplayMode: ColorDisplayMode | null
    values: ValueDraft[]
  }) => Promise<void>
  onDelete: () => Promise<void>
  onReload?: () => void
}) {
  const tActions = useTranslations('actions')
  const tHints = useTranslations('hints')
  const tLabels = useTranslations('labels')
  const tPages = useTranslations('pages.attributes')
  const tBanner = useTranslations('contentBanner')
  const tAttrIcons = useTranslations('attributeIcons')
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
  const [showOnProductPage, setShowOnProductPage] = useState(attribute.showOnProductPage)
  const [icon, setIcon] = useState(attribute.icon ?? '')
  const [colorDisplayMode, setColorDisplayMode] = useState<ColorDisplayMode>(
    attribute.colorDisplayMode ?? 'BOTH',
  )
  const [values, setValues] = useState<ValueDraft[]>(() => attributeToValueDrafts(attribute))

  const showUnit = attributeTypeNeedsUnit(valueType)
  const isColorType = valueType === 'COLOR'

  useEffect(() => {
    setName(attribute.name)
    setSlug(attribute.slug)
    setValueType(normalizeVariantAttributeType(attribute.valueType))
    setDescription(attribute.description ?? '')
    setUnit(attribute.unit ?? '')
    setLegacyId(attribute.legacyId ?? '')
    setIsFilterable(attribute.isFilterable)
    setParticipatesInLabel(attribute.participatesInLabel)
    setShowOnProductPage(attribute.showOnProductPage)
    setIcon(attribute.icon ?? '')
    setColorDisplayMode(attribute.colorDisplayMode ?? 'BOTH')
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
          showOnProductPage,
          showOnProductPage ? icon.trim() || null : null,
          isColorType ? colorDisplayMode : null,
          values,
        ),
        baseline,
      ),
    [name, slug, valueType, description, unit, legacyId, isFilterable, participatesInLabel, showOnProductPage, icon, colorDisplayMode, isColorType, values, baseline],
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
      showOnProductPage,
      icon: showOnProductPage ? icon.trim() || null : null,
      colorDisplayMode: isColorType ? colorDisplayMode : null,
      values,
    })
  }

  useContentLocaleSwitchSave(() => handleSave(), { when: () => isDirty })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
        <div className="min-w-0 space-y-1">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            {name.trim() || slug.trim() || attribute.slug}
          </h2>
          <p className="text-sm text-muted-foreground">{tPages('editHint')}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => void onDelete()}
            disabled={saving}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {tActions('deleteAttribute')}
          </Button>
          <Button type="button" size="sm" onClick={() => void handleSave()} disabled={saving || !isDirty}>
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

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <div className="space-y-4 pb-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <ContentLocaleLabel
                htmlFor="edit-attr-name"
                translationTarget={{ kind: 'variant-attribute-name', attributeId: attribute.id }}
                translationFieldLabel={tLabels('nameRequired')}
                onTranslationsSaved={onReload}
              >
                {tLabels('nameRequired')}
              </ContentLocaleLabel>
              <Input
                id="edit-attr-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tBanner('missingPlaceholder')}
              />
              <TranslationHint hint={attribute.nameHint} />
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
            <div className="flex flex-col gap-4 sm:col-span-2 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1 space-y-2">
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
              <div className="min-w-0 flex-1 space-y-2">
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
              <ContentLocaleLabel
                htmlFor="edit-attr-desc"
                translationTarget={{ kind: 'variant-attribute-description', attributeId: attribute.id }}
                translationFieldLabel={tLabels('description')}
                multiline
                onTranslationsSaved={onReload}
              >
                {tLabels('description')}
              </ContentLocaleLabel>
              <Textarea
                id="edit-attr-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder={tHints('attributeDescriptionPlaceholder')}
                className="resize-none"
              />
              <TranslationHint hint={attribute.descriptionHint} />
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
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-attr-product-page"
                  checked={showOnProductPage}
                  onCheckedChange={(checked) => setShowOnProductPage(checked === true)}
                />
                <Label htmlFor="edit-attr-product-page" className="font-normal">
                  {tLabels('showOnProductPage')}
                </Label>
              </div>
            </div>
            {showOnProductPage ? (
              <div className="space-y-2 sm:col-span-2">
                <Label>{tLabels('productPageIcon')}</Label>
                <div className="grid grid-cols-4 gap-2">
                  {VARIANT_ATTRIBUTE_ICON_OPTIONS.map((option) => {
                    const Icon = option.icon
                    const active = icon === option.name
                    return (
                      <button
                        key={option.name}
                        type="button"
                        onClick={() => setIcon(option.name)}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition-colors',
                          active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/30',
                        )}
                      >
                        <Icon className="h-10 w-10" />
                        <span className="line-clamp-2 text-center leading-tight">{tAttrIcons(option.name)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
            {isColorType && showOnProductPage ? (
              <ColorDisplayModeField value={colorDisplayMode} onChange={setColorDisplayMode} />
            ) : null}
          </div>

          <div className="border-t border-border/60 pt-4">
            <VariantAttributeValuesForm
              attributeId={attribute.id}
              valueType={valueType}
              unit={unit}
              values={values}
              onValuesChange={setValues}
              onTranslationsSaved={onReload}
            />
          </div>
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
        {item.showOnProductPage ? ` · ${tStatus('onProductPage')}` : ''}
      </p>
    </button>
  )
}
