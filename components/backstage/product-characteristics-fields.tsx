'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ColorSwatchPreview } from '@/components/backstage/color-hex-field'
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
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import {
  characteristicsFormFromLegacy,
  emptyCharacteristicsForm,
  fetchCharacteristicDefinitions,
  hasCharacteristicsFormValue,
  type CharacteristicDefinition,
  type ProductCharacteristicsFormState,
} from '@/lib/backstage/characteristics'

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
}

function normalizeField(
  definition: CharacteristicDefinition,
  fieldValue: string | string[] | undefined,
): string | string[] {
  if (definition.valueType === 'MULTI_SELECT' || definition.valueType === 'COLOR') {
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
  const [pendingScalar, setPendingScalar] = useState('')

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
    // Seed from legacy once; refetch labels when content locale changes.
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
      if (definition.valueType === 'MULTI_SELECT' || definition.valueType === 'COLOR') {
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
      })
    }
    return entries
  }, [definitions, current])

  const availableDefinitions = useMemo(() => {
    return definitions.filter((definition) => {
      const fieldValue = normalizeField(definition, current[definition.id])
      if (definition.valueType === 'MULTI_SELECT' || definition.valueType === 'COLOR') {
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
      pendingDefinition.valueType !== 'MULTI_SELECT' &&
      pendingDefinition.valueType !== 'COLOR'
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

  const canAdd = (() => {
    if (!pendingCharacteristicId || !pendingDefinition) return false
    if (
      pendingDefinition.valueType === 'SELECT' ||
      pendingDefinition.valueType === 'MULTI_SELECT' ||
      pendingDefinition.valueType === 'COLOR'
    ) {
      return Boolean(pendingValueId)
    }
    return Boolean(pendingScalar.trim())
  })()

  const handleClearChip = (chip: ChipEntry) => {
    const definition = definitions.find((item) => item.id === chip.characteristicId)
    if (!definition) return

    if (definition.valueType === 'MULTI_SELECT' || definition.valueType === 'COLOR') {
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

    if (
      (pendingDefinition.valueType === 'MULTI_SELECT' ||
        pendingDefinition.valueType === 'COLOR') &&
      pendingValueId
    ) {
      const fieldValue = normalizeField(pendingDefinition, current[pendingDefinition.id])
      const selected = Array.isArray(fieldValue) ? fieldValue : []
      if (selected.includes(pendingValueId)) return
      onChange({
        ...current,
        [pendingDefinition.id]: [...selected, pendingValueId],
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
    setPendingValueId('')
    setPendingScalar('')
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

  return (
    <div className="space-y-3">
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/70 bg-muted/40 py-0.5 pl-2.5 pr-1 text-xs"
            >
              <span className="truncate">
                <span className="text-muted-foreground">{chip.label}:</span>{' '}
                {(() => {
                  const definition = definitions.find((item) => item.id === chip.characteristicId)
                  const option = definition?.options.find((item) => item.id === chip.optionId)
                  return option?.colorHex ? (
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <ColorSwatchPreview hex={option.colorHex} />
                      {chip.valueLabel}
                    </span>
                  ) : (
                    <span className="font-medium text-foreground">{chip.valueLabel}</span>
                  )
                })()}
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
                setPendingValueId('')
                setPendingScalar('')
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={tHints('selectCharacteristic')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{tHints('notSelectedOption')}</SelectItem>
                {availableDefinitions.map((definition) => (
                  <SelectItem key={definition.id} value={definition.id}>
                    {definition.name}
                    {definition.unit ? ` (${definition.unit})` : ''}
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
