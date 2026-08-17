'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'

import { ContentLocaleLabel } from '@/components/backstage/content-locale-banner'
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
import type { CharacteristicDefinition } from '@/lib/backstage/characteristics'
import { CHARACTERISTIC_ICON_OPTIONS } from '@/lib/characteristics/icons'
import { cn } from '@/lib/utils'

export type CharacteristicOptionDraft = {
  key: string
  id?: string
  label: string
  slug: string
}

function useValueTypeLabel(valueType: CharacteristicDefinition['valueType']) {
  const tValueTypes = useTranslations('valueTypes')
  return tValueTypes(valueType)
}

function createOptionDraft(partial?: Partial<CharacteristicOptionDraft>): CharacteristicOptionDraft {
  return {
    key: crypto.randomUUID(),
    label: '',
    slug: '',
    ...partial,
  }
}

function definitionToOptionDrafts(definition: CharacteristicDefinition): CharacteristicOptionDraft[] {
  return definition.options.map((option) => ({
    key: option.id,
    id: option.id,
    label: option.label,
    slug: option.slug,
  }))
}

export function CharacteristicEditor({
  definition,
  saving,
  onSave,
  onDelete,
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
    options: CharacteristicOptionDraft[]
  }) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const tActions = useTranslations('actions')
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
    setOptions(definitionToOptionDrafts(definition))
  }, [definition])

  const isDirty = useMemo(() => {
    if (name.trim() !== definition.name.trim()) return true
    if (valueType !== definition.valueType) return true
    if ((unit.trim() || null) !== definition.unit) return true
    if (isFilterable !== definition.isFilterable) return true
    if (showOnProductPage !== definition.showOnProductPage) return true
    if ((icon.trim() || null) !== definition.icon) return true
    const baseline = definitionToOptionDrafts(definition)
    if (options.length !== baseline.length) return true
    return options.some((row, index) => {
      const base = baseline[index]
      return (
        row.label.trim() !== base.label.trim() ||
        row.slug.trim() !== base.slug.trim() ||
        row.id !== base.id
      )
    })
  }, [definition, icon, isFilterable, name, options, showOnProductPage, unit, valueType])

  const showOptions =
    valueType === 'SELECT' || valueType === 'MULTI_SELECT'

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
      options: options.filter((row) => row.label.trim()),
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <div className="space-y-4 pb-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <ContentLocaleLabel htmlFor="char-name">{tLabels('nameRequired')}</ContentLocaleLabel>
              <Input
                id="char-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tBanner('missingPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">Slug: {definition.slug}</p>
            </div>
            <div className="space-y-2">
              <Label>{tLabels('valueType')}</Label>
              <Select
                value={valueType}
                onValueChange={(next) => setValueType(next as CharacteristicDefinition['valueType'])}
              >
                <SelectTrigger>
                  <SelectValue>{tValueTypes(valueType)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(['SELECT', 'MULTI_SELECT', 'NUMBER', 'TEXT'] as const).map((key) => (
                    <SelectItem key={key} value={key}>
                      {tValueTypes(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {valueType !== definition.valueType ? (
                <p className="text-xs text-muted-foreground">{tHints('valueTypeChangeHint')}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="char-unit">{tLabels('unit')}</Label>
              <Input
                id="char-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={tHints('unitPlaceholder')}
              />
            </div>
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
                <div className="grid grid-cols-[1fr_1fr_40px] gap-2 border-t border-border/60 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <span>{tLabels('name')}</span>
                  <span>{tLabels('slugTechnical')}</span>
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
                        className="grid grid-cols-[1fr_1fr_40px] items-center gap-2 px-3 py-2"
                      >
                        <Input
                          value={row.label}
                          onChange={(e) => patchOption(row.key, { label: e.target.value })}
                          placeholder={tBanner('missingPlaceholder')}
                          className="h-9"
                        />
                        <Input
                          value={row.slug}
                          onChange={(e) => patchOption(row.key, { slug: e.target.value })}
                          placeholder="full-sun"
                          className="h-9 font-mono text-xs"
                          disabled={Boolean(row.id)}
                        />
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

      <div
        className={cn(
          'shrink-0 border-t border-border/60 pt-4',
          'bg-background/20 backdrop-blur-md supports-[backdrop-filter]:bg-background/80',
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
              {tLabels('deleteCharacteristic')}
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

export function CreateCharacteristicFields({
  name,
  valueType,
  unit,
  isFilterable,
  optionsText,
  onNameChange,
  onValueTypeChange,
  onUnitChange,
  onFilterableChange,
  onOptionsTextChange,
}: {
  name: string
  valueType: CharacteristicDefinition['valueType']
  unit: string
  isFilterable: boolean
  optionsText: string
  onNameChange: (value: string) => void
  onValueTypeChange: (value: CharacteristicDefinition['valueType']) => void
  onUnitChange: (value: string) => void
  onFilterableChange: (value: boolean) => void
  onOptionsTextChange: (value: string) => void
}) {
  const tHints = useTranslations('hints')
  const tLabels = useTranslations('labels')
  const tValueTypes = useTranslations('valueTypes')
  const tBanner = useTranslations('contentBanner')
  const showOptions = valueType === 'SELECT' || valueType === 'MULTI_SELECT'

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
      <div className="space-y-2">
        <Label>{tLabels('valueTypeRequired')}</Label>
        <Select value={valueType} onValueChange={(v) => onValueTypeChange(v as typeof valueType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['SELECT', 'MULTI_SELECT', 'NUMBER', 'TEXT'] as const).map((key) => (
              <SelectItem key={key} value={key}>
                {tValueTypes(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="create-char-unit">{tLabels('unit')}</Label>
        <Input
          id="create-char-unit"
          value={unit}
          onChange={(e) => onUnitChange(e.target.value)}
          placeholder={tHints('optional')}
        />
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
        <div className="space-y-2">
          <Label htmlFor="create-char-options">{tLabels('optionsRequired')}</Label>
          <textarea
            id="create-char-options"
            value={optionsText}
            onChange={(e) => onOptionsTextChange(e.target.value)}
            rows={8}
            placeholder={tHints('characteristicOptionsPlaceholder')}
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">{tHints('characteristicOptionsFormat')}</p>
        </div>
      ) : null}
    </div>
  )
}

export function parseCharacteristicOptionsText(text: string): Array<{ label: string; slug?: string }> {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, slug] = line.split('|').map((part) => part.trim())
      return { label, slug: slug || undefined }
    })
}
