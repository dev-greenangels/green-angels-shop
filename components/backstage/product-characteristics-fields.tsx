'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

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

export function ProductCharacteristicsFields({
  value,
  legacy,
  onChange,
}: ProductCharacteristicsFieldsProps) {
  const tHints = useTranslations('hints')
  const [definitions, setDefinitions] = useState<CharacteristicDefinition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void fetchCharacteristicDefinitions()
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
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground">{tHints('loadingCharacteristics')}</p>
  }

  if (!definitions.length) {
    return (
      <p className="text-sm text-muted-foreground">{tHints('noCharacteristicsConfigured')}</p>
    )
  }

  const current = Object.keys(value).length ? value : emptyCharacteristicsForm(definitions)

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {definitions.map((definition) => {
        const fieldId = `characteristic-${definition.id}`
        const fieldValue = current[definition.id] ?? (definition.valueType === 'MULTI_SELECT' ? [] : '')

        if (definition.valueType === 'MULTI_SELECT') {
          const selectedIds = Array.isArray(fieldValue) ? fieldValue : fieldValue ? [fieldValue] : []
          return (
            <div key={definition.id} className="space-y-2 sm:col-span-2">
              <Label>{definition.name}</Label>
              <div className="flex flex-wrap gap-3 rounded-md border border-input p-3">
                {definition.options.map((option) => {
                  const checked = selectedIds.includes(option.id)
                  return (
                    <label
                      key={option.id}
                      htmlFor={`${fieldId}-${option.id}`}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox
                        id={`${fieldId}-${option.id}`}
                        checked={checked}
                        onCheckedChange={(next) => {
                          const nextIds = next
                            ? [...selectedIds, option.id]
                            : selectedIds.filter((id) => id !== option.id)
                          onChange({ ...current, [definition.id]: nextIds })
                        }}
                      />
                      <span>{option.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        }

        if (definition.valueType === 'SELECT') {
          const singleValue = Array.isArray(fieldValue) ? (fieldValue[0] ?? '') : fieldValue
          return (
            <div key={definition.id} className="space-y-2">
              <Label htmlFor={fieldId}>{definition.name}</Label>
              <Select
                value={singleValue || undefined}
                onValueChange={(next) => onChange({ ...current, [definition.id]: next })}
              >
                <SelectTrigger id={fieldId}>
                  <SelectValue placeholder={tHints('notSpecified')} />
                </SelectTrigger>
                <SelectContent>
                  {definition.options.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }

        const scalarValue = Array.isArray(fieldValue) ? (fieldValue[0] ?? '') : fieldValue
        return (
          <div key={definition.id} className="space-y-2">
            <Label htmlFor={fieldId}>
              {definition.name}
              {definition.unit ? ` (${definition.unit})` : ''}
            </Label>
            <Input
              id={fieldId}
              value={scalarValue}
              onChange={(event) =>
                onChange({ ...current, [definition.id]: event.target.value })
              }
            />
          </div>
        )
      })}
    </div>
  )
}
