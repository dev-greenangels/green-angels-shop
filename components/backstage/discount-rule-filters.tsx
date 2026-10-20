'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

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
import { fetchCharacteristicDefinitions } from '@/lib/backstage/characteristics'
import type { DiscountRuleFilterCriteria } from '@/lib/backstage/pricing'
import { fetchVariantAttributes, type VariantAttribute } from '@/lib/backstage/variant-attributes'
import type { CharacteristicDefinition } from '@/lib/backstage/characteristics'

type AttrGroupDraft = { clientId: string; attributeId: string; valueIds: string[] }
type CharGroupDraft = {
  clientId: string
  characteristicId: string
  optionIds: string[]
  numberMin: string
  numberMax: string
}

export function filtersFromCriteria(
  criteria: DiscountRuleFilterCriteria | null | undefined,
): { attributeGroups: AttrGroupDraft[]; characteristicGroups: CharGroupDraft[] } {
  return {
    attributeGroups: (criteria?.attributeGroups ?? []).map((g, i) => ({
      clientId: `attr-${i}-${g.attributeId}`,
      attributeId: g.attributeId,
      valueIds: g.valueIds ?? [],
    })),
    characteristicGroups: (criteria?.characteristicGroups ?? []).map((g, i) => ({
      clientId: `char-${i}-${g.characteristicId}`,
      characteristicId: g.characteristicId,
      optionIds: g.optionIds ?? [],
      numberMin: g.numberMin != null ? String(g.numberMin) : '',
      numberMax: g.numberMax != null ? String(g.numberMax) : '',
    })),
  }
}

export function filtersToPayload(
  attributeGroups: AttrGroupDraft[],
  characteristicGroups: CharGroupDraft[],
): DiscountRuleFilterCriteria | null {
  const attrs = attributeGroups
    .filter((g) => g.attributeId && g.valueIds.length)
    .map((g) => ({ attributeId: g.attributeId, valueIds: g.valueIds }))
  const chars = characteristicGroups
    .filter((g) => g.characteristicId)
    .map((g) => ({
      characteristicId: g.characteristicId,
      optionIds: g.optionIds.length ? g.optionIds : undefined,
      numberMin: g.numberMin.trim() ? Number(g.numberMin) : undefined,
      numberMax: g.numberMax.trim() ? Number(g.numberMax) : undefined,
    }))
  if (!attrs.length && !chars.length) return null
  return { attributeGroups: attrs, characteristicGroups: chars }
}

export function DiscountRuleFiltersEditor({
  attributeGroups,
  characteristicGroups,
  onAttributeGroupsChange,
  onCharacteristicGroupsChange,
}: {
  attributeGroups: AttrGroupDraft[]
  characteristicGroups: CharGroupDraft[]
  onAttributeGroupsChange: (rows: AttrGroupDraft[]) => void
  onCharacteristicGroupsChange: (rows: CharGroupDraft[]) => void
}) {
  const t = useTranslations('discountRules')
  const { locale } = useBackstageContentLocale()
  const [attributes, setAttributes] = useState<VariantAttribute[]>([])
  const [characteristics, setCharacteristics] = useState<CharacteristicDefinition[]>([])

  useEffect(() => {
    void Promise.all([
      fetchVariantAttributes({ locale, edit: false }),
      fetchCharacteristicDefinitions({ locale, edit: false }),
    ])
      .then(([attrs, chars]) => {
        setAttributes(attrs)
        setCharacteristics(chars)
      })
      .catch(() => {
        setAttributes([])
        setCharacteristics([])
      })
  }, [locale])

  const toggleId = (ids: string[], id: string) =>
    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t('filtersHint')}</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-medium">{t('attributeFilters')}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() =>
              onAttributeGroupsChange([
                ...attributeGroups,
                { clientId: `attr-${Date.now()}`, attributeId: '', valueIds: [] },
              ])
            }
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t('addAttrGroup')}
          </Button>
        </div>
        {attributeGroups.map((group) => {
          const attr = attributes.find((a) => a.id === group.attributeId)
          return (
            <div key={group.clientId} className="space-y-2 rounded-lg border border-border/60 p-2.5">
              <div className="flex gap-2">
                <Select
                  value={group.attributeId || undefined}
                  onValueChange={(attributeId) =>
                    onAttributeGroupsChange(
                      attributeGroups.map((g) =>
                        g.clientId === group.clientId
                          ? { ...g, attributeId, valueIds: [] }
                          : g,
                      ),
                    )
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder={t('selectAttribute')} />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[80]">
                    {attributes.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() =>
                    onAttributeGroupsChange(
                      attributeGroups.filter((g) => g.clientId !== group.clientId),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {attr ? (
                <div className="flex flex-wrap gap-1.5">
                  {attr.values.map((value) => (
                    <Button
                      key={value.id}
                      type="button"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      variant={group.valueIds.includes(value.id) ? 'default' : 'outline'}
                      onClick={() =>
                        onAttributeGroupsChange(
                          attributeGroups.map((g) =>
                            g.clientId === group.clientId
                              ? { ...g, valueIds: toggleId(g.valueIds, value.id) }
                              : g,
                          ),
                        )
                      }
                    >
                      {value.label}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-medium">{t('characteristicFilters')}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() =>
              onCharacteristicGroupsChange([
                ...characteristicGroups,
                {
                  clientId: `char-${Date.now()}`,
                  characteristicId: '',
                  optionIds: [],
                  numberMin: '',
                  numberMax: '',
                },
              ])
            }
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t('addCharGroup')}
          </Button>
        </div>
        {characteristicGroups.map((group) => {
          const char = characteristics.find((c) => c.id === group.characteristicId)
          const isNumber = char?.valueType === 'NUMBER'
          return (
            <div key={group.clientId} className="space-y-2 rounded-lg border border-border/60 p-2.5">
              <div className="flex gap-2">
                <Select
                  value={group.characteristicId || undefined}
                  onValueChange={(characteristicId) =>
                    onCharacteristicGroupsChange(
                      characteristicGroups.map((g) =>
                        g.clientId === group.clientId
                          ? {
                              ...g,
                              characteristicId,
                              optionIds: [],
                              numberMin: '',
                              numberMax: '',
                            }
                          : g,
                      ),
                    )
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder={t('selectCharacteristic')} />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[80]">
                    {characteristics.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() =>
                    onCharacteristicGroupsChange(
                      characteristicGroups.filter((g) => g.clientId !== group.clientId),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {char && isNumber ? (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    placeholder={t('numberMin')}
                    value={group.numberMin}
                    onChange={(e) =>
                      onCharacteristicGroupsChange(
                        characteristicGroups.map((g) =>
                          g.clientId === group.clientId
                            ? { ...g, numberMin: e.target.value }
                            : g,
                        ),
                      )
                    }
                  />
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    placeholder={t('numberMax')}
                    value={group.numberMax}
                    onChange={(e) =>
                      onCharacteristicGroupsChange(
                        characteristicGroups.map((g) =>
                          g.clientId === group.clientId
                            ? { ...g, numberMax: e.target.value }
                            : g,
                        ),
                      )
                    }
                  />
                </div>
              ) : null}
              {char && !isNumber && char.options.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {char.options.map((option) => (
                    <Button
                      key={option.id}
                      type="button"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      variant={group.optionIds.includes(option.id) ? 'default' : 'outline'}
                      onClick={() =>
                        onCharacteristicGroupsChange(
                          characteristicGroups.map((g) =>
                            g.clientId === group.clientId
                              ? { ...g, optionIds: toggleId(g.optionIds, option.id) }
                              : g,
                          ),
                        )
                      }
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export type { AttrGroupDraft, CharGroupDraft }
