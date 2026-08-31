'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Trash2 } from 'lucide-react'

import { ContentLocaleLabel, LocaleTranslationButton, TranslationHint } from '@/components/backstage/content-locale-banner'
import { ColorDisplayModeField } from '@/components/backstage/color-display-mode-field'
import { ColorHexField } from '@/components/backstage/color-hex-field'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CharacteristicDefinition, ColorDisplayMode } from '@/lib/backstage/characteristics'
import { CHARACTERISTIC_ICON_OPTIONS } from '@/lib/characteristics/icons'
import { cn } from '@/lib/utils'

export type CharacteristicOptionDraft = {
  key: string
  id?: string
  label: string
  labelHint?: { locale: string; text: string } | null
  slug: string
  colorHex: string
}

function useValueTypeLabel(valueType: CharacteristicDefinition['valueType']) {
  const tValueTypes = useTranslations('valueTypes')
  return tValueTypes(valueType)
}

export function createOptionDraft(partial?: Partial<CharacteristicOptionDraft>): CharacteristicOptionDraft {
  return {
    key: crypto.randomUUID(),
    label: '',
    slug: '',
    colorHex: '',
    ...partial,
  }
}

function definitionToOptionDrafts(definition: CharacteristicDefinition): CharacteristicOptionDraft[] {
  return definition.options.map((option) => ({
    key: option.id,
    id: option.id,
    label: option.label,
    labelHint: option.labelHint ?? null,
    slug: option.slug,
    colorHex: option.colorHex ?? '',
  }))
}

export type CharacteristicEditorActions = {
  isDirty: boolean
  saving?: boolean
  save: () => Promise<void>
  delete: () => void
}

export function CharacteristicEditor({
  definition,
  saving,
  onSave,
  onDelete,
  onActionsChange,
  onReload,
}: {
  definition: CharacteristicDefinition
  saving?: boolean
  onSave: (payload: {
    name: string
    valueType: CharacteristicDefinition['valueType']
    unit: string | null
    isFilterable: boolean
    showOnProductPage: boolean
    icon: string | null
    colorDisplayMode: ColorDisplayMode | null
    options: CharacteristicOptionDraft[]
  }) => Promise<void>
  onDelete: () => Promise<void>
  onActionsChange?: (actions: CharacteristicEditorActions) => void
  onReload?: () => void
}) {
  const tHints = useTranslations('hints')
  const tLabels = useTranslations('labels')
  const tAria = useTranslations('aria')
  const tValueTypes = useTranslations('valueTypes')
  const tBanner = useTranslations('contentBanner')

  const [name, setName] = useState(definition.name)
  const [valueType, setValueType] = useState(definition.valueType)
  const [unit, setUnit] = useState(definition.unit ?? '')
  const [isFilterable, setIsFilterable] = useState(definition.isFilterable)
  const [showOnProductPage, setShowOnProductPage] = useState(definition.showOnProductPage)
  const [icon, setIcon] = useState(definition.icon ?? '')
  const [colorDisplayMode, setColorDisplayMode] = useState<ColorDisplayMode>(
    definition.colorDisplayMode ?? 'BOTH',
  )
  const [options, setOptions] = useState<CharacteristicOptionDraft[]>(() =>
    definitionToOptionDrafts(definition),
  )

  useEffect(() => {
    setName(definition.name)
    setValueType(definition.valueType)
    setUnit(definition.unit ?? '')
    setIsFilterable(definition.isFilterable)
    setShowOnProductPage(definition.showOnProductPage)
    setIcon(definition.icon ?? '')
    setColorDisplayMode(definition.colorDisplayMode ?? 'BOTH')
    setOptions(definitionToOptionDrafts(definition))
  }, [definition])

  const isDirty = useMemo(() => {
    if (name.trim() !== definition.name.trim()) return true
    if (valueType !== definition.valueType) return true
    if ((unit.trim() || null) !== definition.unit) return true
    if (isFilterable !== definition.isFilterable) return true
    if (showOnProductPage !== definition.showOnProductPage) return true
    if ((definition.colorDisplayMode ?? 'BOTH') !== colorDisplayMode) return true
    if ((icon.trim() || null) !== definition.icon) return true
    const baseline = definitionToOptionDrafts(definition)
    if (options.length !== baseline.length) return true
    return options.some((row, index) => {
      const base = baseline[index]
      return (
        row.label.trim() !== base.label.trim() ||
        row.slug.trim() !== base.slug.trim() ||
        row.colorHex.trim() !== base.colorHex.trim() ||
        row.id !== base.id
      )
    })
  }, [definition, icon, isFilterable, name, options, showOnProductPage, colorDisplayMode, unit, valueType])

  const showOptions =
    valueType === 'SELECT' || valueType === 'MULTI_SELECT' || valueType === 'COLOR'
  const isColorType = valueType === 'COLOR'

  const patchOption = (key: string, patch: Partial<CharacteristicOptionDraft>) => {
    setOptions((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  const handleSave = async () => {
    await onSave({
      name: name.trim(),
      valueType,
      unit: unit.trim() || null,
      isFilterable,
      showOnProductPage,
      icon: showOnProductPage ? icon.trim() || null : null,
      colorDisplayMode: isColorType ? colorDisplayMode : null,
      options: options
        .filter((row) => row.id || row.label.trim())
        .map((row) => ({
          key: row.key,
          id: row.id,
          label: row.label,
          slug: row.slug,
          colorHex: row.colorHex.trim() || null,
        })),
    })
  }

  const handleSaveRef = useRef(handleSave)
  handleSaveRef.current = handleSave

  const onDeleteRef = useRef(onDelete)
  onDeleteRef.current = onDelete

  useEffect(() => {
    onActionsChange?.({
      isDirty,
      saving,
      save: () => handleSaveRef.current(),
      delete: () => void onDeleteRef.current(),
    })
  }, [isDirty, saving, onActionsChange])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[12rem] flex-1 basis-[14rem] space-y-2">
              <ContentLocaleLabel
                htmlFor="char-name"
                translationTarget={{ kind: 'characteristic-name', characteristicId: definition.id }}
                translationFieldLabel={tLabels('nameRequired')}
                onTranslationsSaved={onReload}
              >
                {tLabels('nameRequired')}
              </ContentLocaleLabel>
              <Input
                id="char-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tBanner('missingPlaceholder')}
                className="h-9"
              />
              <TranslationHint hint={definition.nameHint} />
            </div>
            <div className="min-w-[10rem] flex-1 basis-[11rem] space-y-2 sm:max-w-[14rem] sm:flex-none">
              <Label>{tLabels('valueType')}</Label>
              <Select
                value={valueType}
                onValueChange={(next) => setValueType(next as CharacteristicDefinition['valueType'])}
              >
                <SelectTrigger className="h-9">
                  <SelectValue>{tValueTypes(valueType)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(['SELECT', 'MULTI_SELECT', 'COLOR', 'NUMBER', 'TEXT'] as const).map((key) => (
                    <SelectItem key={key} value={key}>
                      {tValueTypes(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[6rem] flex-1 basis-[8rem] space-y-2 sm:max-w-[10rem] sm:flex-none">
              <Label htmlFor="char-unit">{tLabels('unit')}</Label>
              <Input
                id="char-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={tHints('unitPlaceholder')}
                className="h-9"
              />
            </div>
          </div>
          {valueType !== definition.valueType ? (
            <p className="text-xs text-muted-foreground">{tHints('valueTypeChangeHint')}</p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-end gap-2 pb-2">
              <Checkbox
                id="char-filterable"
                checked={isFilterable}
                onCheckedChange={(checked) => setIsFilterable(checked === true)}
              />
              <Label htmlFor="char-filterable" className="font-normal">
                {tLabels('showInFilters')}
              </Label>
            </div>
            <div className="flex items-end gap-2 pb-2">
              <Checkbox
                id="char-product-page"
                checked={showOnProductPage}
                onCheckedChange={(checked) => setShowOnProductPage(checked === true)}
              />
              <Label htmlFor="char-product-page" className="font-normal">
                {tLabels('showOnProductPage')}
              </Label>
            </div>
            {showOnProductPage ? (
              <div className="space-y-2 sm:col-span-2">
                <Label>{tLabels('productPageIcon')}</Label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {CHARACTERISTIC_ICON_OPTIONS.map((option) => {
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
                        aria-label={option.name}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="truncate">{option.name}</span>
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

          {showOptions ? (
            <div className="border-t border-border/60 pt-4">
              <div className="sticky top-0 z-10 -mx-1 border-b border-border/60 bg-background/95 px-1 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-background/90">
                <div className="flex items-center justify-between gap-2 py-2.5">
                  <p className="font-medium">{tLabels('options', { count: options.length })}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOptions((prev) => [...prev, createOptionDraft()])}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    {tLabels('option')}
                  </Button>
                </div>
                <div
                  className={cn(
                    'grid gap-2 border-t border-border/60 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground',
                    isColorType
                      ? 'grid-cols-[1fr_1fr_minmax(148px,1fr)_40px]'
                      : 'grid-cols-[1fr_1fr_40px]',
                  )}
                >
                  <span>{tLabels('name')}</span>
                  <span>{tLabels('slugTechnical')}</span>
                  {isColorType ? <span>{tLabels('color')}</span> : null}
                  <span />
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-border bg-background/40">
                {options.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    {tHints('addOptionsForList')}
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {options.map((row) => (
                      <div
                        key={row.key}
                        className={cn(
                          'grid items-start gap-2 px-3 py-2',
                          isColorType
                            ? 'grid-cols-[1fr_1fr_minmax(148px,1fr)_40px]'
                            : 'grid-cols-[1fr_1fr_40px]',
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Input
                              value={row.label}
                              onChange={(e) => patchOption(row.key, { label: e.target.value })}
                              placeholder={tBanner('missingPlaceholder')}
                              className="h-9 min-w-0 flex-1"
                            />
                            {row.id ? (
                              <LocaleTranslationButton
                                translationTarget={{
                                  kind: 'characteristic-option-label',
                                  characteristicId: definition.id,
                                  optionId: row.id,
                                }}
                                translationFieldLabel={tLabels('name')}
                                onTranslationsSaved={onReload}
                              />
                            ) : null}
                          </div>
                          <TranslationHint hint={row.labelHint} />
                        </div>
                        <Input
                          value={row.slug}
                          onChange={(e) => patchOption(row.key, { slug: e.target.value })}
                          placeholder="full-sun"
                          className="h-9 font-mono text-xs"
                          disabled={Boolean(row.id)}
                        />
                        {isColorType ? (
                          <ColorHexField
                            value={row.colorHex}
                            onChange={(colorHex) => patchOption(row.key, { colorHex })}
                            compact
                          />
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          onClick={() =>
                            setOptions((prev) => prev.filter((item) => item.key !== row.key))
                          }
                          aria-label={tAria('deleteOption')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function CharacteristicListItem({
  item,
  active,
  onClick,
}: {
  item: CharacteristicDefinition
  active: boolean
  onClick: () => void
}) {
  const tStatus = useTranslations('status')
  const valueTypeLabel = useValueTypeLabel(item.valueType)
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
        {valueTypeLabel}
        {item.isFilterable ? ` · ${tStatus('inFilters')}` : ''}
        {item.showOnProductPage ? ` · ${tStatus('onProductPage')}` : ''}
      </p>
    </button>
  )
}

export function CreateCharacteristicOptionsList({
  valueType,
  options,
  onChange,
}: {
  valueType: CharacteristicDefinition['valueType']
  options: CharacteristicOptionDraft[]
  onChange: (options: CharacteristicOptionDraft[]) => void
}) {
  const tHints = useTranslations('hints')
  const tLabels = useTranslations('labels')
  const tAria = useTranslations('aria')
  const tBanner = useTranslations('contentBanner')
  const isColorType = valueType === 'COLOR'

  const patchOption = (key: string, patch: Partial<CharacteristicOptionDraft>) => {
    onChange(options.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{tLabels('optionsRequired')}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...options, createOptionDraft()])}
        >
          <Plus className="mr-1 h-4 w-4" />
          {tLabels('option')}
        </Button>
      </div>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tHints('addOptionsForList')}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div
            className={cn(
              'grid gap-2 border-b border-border/60 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground',
              isColorType
                ? 'grid-cols-[1fr_minmax(148px,1fr)_40px]'
                : 'grid-cols-[1fr_40px]',
            )}
          >
            <span>{tLabels('name')}</span>
            {isColorType ? <span>{tLabels('color')}</span> : null}
            <span />
          </div>
          <div className="divide-y divide-border">
            {options.map((row) => (
              <div
                key={row.key}
                className={cn(
                  'grid items-start gap-2 px-3 py-2',
                  isColorType
                    ? 'grid-cols-[1fr_minmax(148px,1fr)_40px]'
                    : 'grid-cols-[1fr_40px]',
                )}
              >
                <Input
                  value={row.label}
                  onChange={(e) => patchOption(row.key, { label: e.target.value })}
                  placeholder={tBanner('missingPlaceholder')}
                  className="h-9"
                />
                {isColorType ? (
                  <ColorHexField
                    value={row.colorHex}
                    onChange={(colorHex) => patchOption(row.key, { colorHex })}
                    compact
                  />
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive"
                  onClick={() => onChange(options.filter((item) => item.key !== row.key))}
                  aria-label={tAria('deleteOption')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function CreateCharacteristicFields({
  name,
  valueType,
  unit,
  isFilterable,
  options,
  onNameChange,
  onValueTypeChange,
  onUnitChange,
  onFilterableChange,
  onOptionsChange,
}: {
  name: string
  valueType: CharacteristicDefinition['valueType']
  unit: string
  isFilterable: boolean
  options: CharacteristicOptionDraft[]
  onNameChange: (value: string) => void
  onValueTypeChange: (value: CharacteristicDefinition['valueType']) => void
  onUnitChange: (value: string) => void
  onFilterableChange: (value: boolean) => void
  onOptionsChange: (options: CharacteristicOptionDraft[]) => void
}) {
  const tHints = useTranslations('hints')
  const tLabels = useTranslations('labels')
  const tValueTypes = useTranslations('valueTypes')
  const tBanner = useTranslations('contentBanner')
  const showOptions = valueType === 'SELECT' || valueType === 'MULTI_SELECT' || valueType === 'COLOR'

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <ContentLocaleLabel htmlFor="create-char-name">{tLabels('nameRequired')}</ContentLocaleLabel>
        <Input
          id="create-char-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={tBanner('missingPlaceholder')}
        />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[10rem] flex-1 space-y-2">
          <Label>{tLabels('valueTypeRequired')}</Label>
          <Select value={valueType} onValueChange={(v) => onValueTypeChange(v as typeof valueType)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['SELECT', 'MULTI_SELECT', 'COLOR', 'NUMBER', 'TEXT'] as const).map((key) => (
                <SelectItem key={key} value={key}>
                  {tValueTypes(key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full min-w-[6rem] max-w-[10rem] space-y-2 sm:w-auto">
          <Label htmlFor="create-char-unit">{tLabels('unit')}</Label>
          <Input
            id="create-char-unit"
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
            placeholder={tHints('optional')}
            className="h-9"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="create-char-filterable"
          checked={isFilterable}
          onCheckedChange={(checked) => onFilterableChange(checked === true)}
        />
        <Label htmlFor="create-char-filterable" className="font-normal">
          {tLabels('showInFilters')}
        </Label>
      </div>
      {showOptions ? (
        <CreateCharacteristicOptionsList
          valueType={valueType}
          options={options}
          onChange={onOptionsChange}
        />
      ) : null}
    </div>
  )
}

export function parseCharacteristicOptionsText(
  text: string,
): Array<{ label: string; slug?: string; colorHex?: string | null }> {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, slug, colorHex] = line.split('|').map((part) => part.trim())
      return {
        label,
        slug: slug || undefined,
        colorHex: colorHex || null,
      }
    })
}
