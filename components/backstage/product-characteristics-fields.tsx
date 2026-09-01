'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ColorSwatchPreview } from '@/components/backstage/color-hex-field'
import { CharacteristicIconInline } from '@/components/backstage/characteristic-icon-inline'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import {
  characteristicsFormFromLegacy,
  emptyCharacteristicsForm,
  fetchCharacteristicDefinitions,
  hasCharacteristicsFormValue,
  isMultiOptionCharacteristic,
  type CharacteristicDefinition,
  type ProductCharacteristicsFormState,
} from '@/lib/backstage/characteristics'
import { cn } from '@/lib/utils'

type ProductCharacteristicsFieldsProps = {
  value: ProductCharacteristicsFormState
  legacy?: {
    sunRequirement?: string
    soilType?: string
    hardinessZone?: string
    wateringNeeds?: string
    height?: string
  }
  onChange: (value: ProductCharacteristicsFormState) => void
}

type ChipEntry = {
  key: string
  characteristicId: string
  optionId?: string
  label: string
  valueLabel: string
  icon: string | null
  colorHex?: string | null
}

function normalizeField(
  definition: CharacteristicDefinition,
  fieldValue: string | string[] | undefined,
): string | string[] {
  if (isMultiOptionCharacteristic(definition)) {
    if (Array.isArray(fieldValue)) return fieldValue
    return fieldValue ? [fieldValue] : []
  }
  if (Array.isArray(fieldValue)) return fieldValue[0] ?? ''
  return fieldValue ?? ''
}

export function ProductCharacteristicsFields({
  value,
  legacy,
  onChange,
}: ProductCharacteristicsFieldsProps) {
  const tHints = useTranslations('hints')
  const { locale: contentLocale } = useBackstageContentLocale()
  const [definitions, setDefinitions] = useState<CharacteristicDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingCharacteristicId, setPendingCharacteristicId] = useState('')
  const [pendingValueId, setPendingValueId] = useState('')
  const [pendingMultiValueIds, setPendingMultiValueIds] = useState<string[]>([])
  const [pendingScalar, setPendingScalar] = useState('')
  const [valuePickerOpen, setValuePickerOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchCharacteristicDefinitions({ locale: contentLocale, edit: false })
      .then((items) => {
        if (cancelled) return
        setDefinitions(items)
        if (!hasCharacteristicsFormValue(value) && legacy) {
          onChange(characteristicsFormFromLegacy(items, legacy))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentLocale])

  const current = useMemo(() => {
    if (Object.keys(value).length) return value
    return emptyCharacteristicsForm(definitions)
  }, [value, definitions])

  const chips: ChipEntry[] = useMemo(() => {
    const entries: ChipEntry[] = []
    for (const definition of definitions) {
      const fieldValue = normalizeField(definition, current[definition.id])
      if (isMultiOptionCharacteristic(definition)) {
        const ids = Array.isArray(fieldValue) ? fieldValue : []
        for (const optionId of ids) {
          const option = definition.options.find((item) => item.id === optionId)
          if (!option) continue
          entries.push({
            key: `${definition.id}:${optionId}`,
            characteristicId: definition.id,
            optionId,
            label: definition.name,
            valueLabel: option.label,
            icon: definition.icon,
            colorHex: option.colorHex,
          })
        }
        continue
      }

      if (definition.valueType === 'SELECT') {
        const optionId = typeof fieldValue === 'string' ? fieldValue : ''
        if (!optionId) continue
        const option = definition.options.find((item) => item.id === optionId)
        if (!option) continue
        entries.push({
          key: definition.id,
          characteristicId: definition.id,
          optionId,
          label: definition.name,
          valueLabel: option.label,
          icon: definition.icon,
          colorHex: option.colorHex,
        })
        continue
      }

      const scalar = typeof fieldValue === 'string' ? fieldValue.trim() : ''
      if (!scalar) continue
      entries.push({
        key: definition.id,
        characteristicId: definition.id,
        label: definition.name,
        valueLabel: definition.unit ? `${scalar} ${definition.unit}` : scalar,
        icon: definition.icon,
      })
    }
    return entries
  }, [definitions, current])

  const availableDefinitions = useMemo(() => {
    return definitions.filter((definition) => {
      const fieldValue = normalizeField(definition, current[definition.id])
      if (isMultiOptionCharacteristic(definition)) {
        const selected = Array.isArray(fieldValue) ? fieldValue : []
        return definition.options.some((option) => !selected.includes(option.id))
      }
      if (definition.valueType === 'SELECT') {
        return !(typeof fieldValue === 'string' && fieldValue)
      }
      return !(typeof fieldValue === 'string' && fieldValue.trim())
    })
  }, [definitions, current])

  const pendingDefinition =
    definitions.find((item) => item.id === pendingCharacteristicId) ?? null

  const pendingOptions = useMemo(() => {
    if (!pendingDefinition) return []
    if (
      pendingDefinition.valueType !== 'SELECT' &&
      !isMultiOptionCharacteristic(pendingDefinition)
    ) {
      return []
    }
    const fieldValue = normalizeField(pendingDefinition, current[pendingDefinition.id])
    const selected = Array.isArray(fieldValue)
      ? fieldValue
      : fieldValue
        ? [fieldValue]
        : []
    return pendingDefinition.options.filter((option) => !selected.includes(option.id))
  }, [pendingDefinition, current])

  const isMultiPending = pendingDefinition
    ? isMultiOptionCharacteristic(pendingDefinition)
    : false

  const canAdd = (() => {
    if (!pendingCharacteristicId || !pendingDefinition) return false
    if (pendingDefinition.valueType === 'SELECT') {
      return Boolean(pendingValueId)
    }
    if (isMultiOptionCharacteristic(pendingDefinition)) {
      return pendingMultiValueIds.length > 0
    }
    return Boolean(pendingScalar.trim())
  })()

  const resetPendingValues = () => {
    setPendingValueId('')
    setPendingMultiValueIds([])
    setPendingScalar('')
    setValuePickerOpen(false)
  }

  const handleClearChip = (chip: ChipEntry) => {
    const definition = definitions.find((item) => item.id === chip.characteristicId)
    if (!definition) return

    if (isMultiOptionCharacteristic(definition)) {
      const fieldValue = normalizeField(definition, current[definition.id])
      const selected = Array.isArray(fieldValue) ? fieldValue : []
      onChange({
        ...current,
        [definition.id]: selected.filter((id) => id !== chip.optionId),
      })
      return
    }

    onChange({
      ...current,
      [definition.id]: '',
    })
  }

  const handleAdd = () => {
    if (!pendingDefinition || !canAdd) return

    if (isMultiOptionCharacteristic(pendingDefinition)) {
      const fieldValue = normalizeField(pendingDefinition, current[pendingDefinition.id])
      const selected = Array.isArray(fieldValue) ? fieldValue : []
      const next = [...selected]
      for (const optionId of pendingMultiValueIds) {
        if (!next.includes(optionId)) next.push(optionId)
      }
      onChange({
        ...current,
        [pendingDefinition.id]: next,
      })
    } else if (pendingDefinition.valueType === 'SELECT' && pendingValueId) {
      onChange({
        ...current,
        [pendingDefinition.id]: pendingValueId,
      })
    } else if (
      pendingDefinition.valueType === 'TEXT' ||
      pendingDefinition.valueType === 'NUMBER'
    ) {
      onChange({
        ...current,
        [pendingDefinition.id]: pendingScalar.trim(),
      })
    }

    setPendingCharacteristicId('')
    resetPendingValues()
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">{tHints('loadingCharacteristics')}</p>
  }

  if (!definitions.length) {
    return (
      <p className="text-sm text-muted-foreground">{tHints('noCharacteristicsConfigured')}</p>
    )
  }

  const isScalarPending =
    pendingDefinition?.valueType === 'TEXT' || pendingDefinition?.valueType === 'NUMBER'

  const pendingMultiSummary =
    pendingMultiValueIds.length === 0
      ? tHints('selectValue')
      : pendingMultiValueIds
          .map((id) => pendingOptions.find((option) => option.id === id)?.label ?? id)
          .filter(Boolean)
          .join(', ')

  return (
    <div className="space-y-3">
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/70 bg-muted/40 py-0.5 pl-2.5 pr-1 text-xs"
            >
              <span className="inline-flex min-w-0 items-center gap-1 truncate">
                <CharacteristicIconInline icon={chip.icon} />
                <span className="text-muted-foreground">{chip.label}:</span>{' '}
                {chip.colorHex ? (
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <ColorSwatchPreview hex={chip.colorHex} />
                    {chip.valueLabel}
                  </span>
                ) : (
                  <span className="font-medium text-foreground">{chip.valueLabel}</span>
                )}
              </span>
              <button
                type="button"
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
                onClick={() => handleClearChip(chip)}
                aria-label={tHints('removeCharacteristic')}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{tHints('noCharacteristicsSelected')}</p>
      )}

      {availableDefinitions.length > 0 ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-[9.5rem] space-y-1.5 sm:w-[11rem]">
            <Label className="text-xs leading-4">{tHints('characteristicLabel')}</Label>
            <Select
              value={pendingCharacteristicId || '__none__'}
              onValueChange={(next) => {
                setPendingCharacteristicId(next === '__none__' ? '' : next)
                resetPendingValues()
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={tHints('selectCharacteristic')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{tHints('notSelectedOption')}</SelectItem>
                {availableDefinitions.map((definition) => (
                  <SelectItem key={definition.id} value={definition.id}>
                    <span className="inline-flex items-center gap-2">
                      <CharacteristicIconInline icon={definition.icon} />
                      <span>
                        {definition.name}
                        {definition.unit ? ` (${definition.unit})` : ''}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isScalarPending ? (
            <div className="w-[9.5rem] space-y-1.5 sm:w-[11rem]">
              <Label className="text-xs leading-4">{tHints('valueLabel')}</Label>
              <Input
                className="h-9"
                value={pendingScalar}
                placeholder={tHints('enterValue')}
                inputMode={pendingDefinition?.valueType === 'NUMBER' ? 'decimal' : 'text'}
                onChange={(event) => setPendingScalar(event.target.value)}
              />
            </div>
          ) : isMultiPending ? (
            <div className="w-[9.5rem] space-y-1.5 sm:w-[11rem]">
              <Label className="text-xs leading-4">{tHints('valueLabel')}</Label>
              <Popover open={valuePickerOpen} onOpenChange={setValuePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-9 w-full justify-between px-2.5 font-normal',
                      !pendingMultiValueIds.length && 'text-muted-foreground',
                    )}
                    disabled={!pendingDefinition || pendingOptions.length === 0}
                  >
                    <span className="truncate text-left text-xs">{pendingMultiSummary}</span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-3" align="start">
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {pendingOptions.map((option) => {
                      const checked = pendingMultiValueIds.includes(option.id)
                      return (
                        <label
                          key={option.id}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => {
                              setPendingMultiValueIds((prev) =>
                                next
                                  ? [...prev, option.id]
                                  : prev.filter((id) => id !== option.id),
                              )
                            }}
                          />
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            {option.colorHex ? <ColorSwatchPreview hex={option.colorHex} /> : null}
                            <span className="truncate">{option.label}</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <div className="w-[9.5rem] space-y-1.5 sm:w-[11rem]">
              <Label className="text-xs leading-4">{tHints('valueLabel')}</Label>
              <Select
                value={pendingValueId || '__none__'}
                onValueChange={(next) => setPendingValueId(next === '__none__' ? '' : next)}
                disabled={!pendingDefinition}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder={tHints('selectValue')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{tHints('notSelectedOption')}</SelectItem>
                  {pendingOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <span className="inline-flex items-center gap-2">
                        {option.colorHex ? <ColorSwatchPreview hex={option.colorHex} /> : null}
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <span className="block text-xs leading-4 opacity-0" aria-hidden>
              .
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              disabled={!canAdd}
              onClick={handleAdd}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {tHints('addCharacteristic')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
