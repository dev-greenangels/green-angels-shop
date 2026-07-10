'use client'

import { useEffect, useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { CatalogFilterDefinitions } from '@/lib/backstage/characteristics'
import type { CatalogFiltersVisibilitySettings } from '@/lib/catalog/filter-visibility'
import { defaultLocale } from '@/i18n/routing'

type CatalogFiltersVisibilityFieldsProps = {
  idPrefix: string
  title: string
  description: string
  value: CatalogFiltersVisibilitySettings
  onChange: (next: CatalogFiltersVisibilitySettings) => void
}

export function CatalogFiltersVisibilityFields({
  idPrefix,
  title,
  description,
  value,
  onChange,
}: CatalogFiltersVisibilityFieldsProps) {
  const [definitions, setDefinitions] = useState<CatalogFilterDefinitions | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/catalog/filters?locale=${defaultLocale}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CatalogFilterDefinitions | null) => {
        if (!cancelled) setDefinitions(data)
      })
      .catch(() => {
        if (!cancelled) setDefinitions(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toggleVariantSlug = (slug: string, checked: boolean) => {
    const next = new Set(value.variantAttributeSlugs)
    if (checked) next.add(slug)
    else next.delete(slug)
    onChange({
      ...value,
      showAllVariantAttributes: false,
      variantAttributeSlugs: [...next],
    })
  }

  const toggleCharacteristicSlug = (slug: string, checked: boolean) => {
    const next = new Set(value.characteristicSlugs)
    if (checked) next.add(slug)
    else next.delete(slug)
    onChange({
      ...value,
      showAllCharacteristics: false,
      characteristicSlugs: [...next],
    })
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Switch checked={value.price} onCheckedChange={(price) => onChange({ ...value, price })} />
        Ціна
      </label>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={value.showAllVariantAttributes}
            onCheckedChange={(showAllVariantAttributes) =>
              onChange({ ...value, showAllVariantAttributes })
            }
          />
          Усі атрибути варіантів
        </label>
        {!value.showAllVariantAttributes && definitions ? (
          <div className="ml-6 space-y-2">
            {definitions.variantAttributes.map((attribute) => (
              <label key={attribute.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={value.variantAttributeSlugs.includes(attribute.slug)}
                  onCheckedChange={(checked) => toggleVariantSlug(attribute.slug, checked === true)}
                />
                {attribute.name}
              </label>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={value.showAllCharacteristics}
            onCheckedChange={(showAllCharacteristics) =>
              onChange({ ...value, showAllCharacteristics })
            }
          />
          Усі характеристики
        </label>
        {!value.showAllCharacteristics && definitions ? (
          <div className="ml-6 space-y-2">
            {definitions.characteristics.map((characteristic) => (
              <label key={characteristic.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={value.characteristicSlugs.includes(characteristic.slug)}
                  onCheckedChange={(checked) =>
                    toggleCharacteristicSlug(characteristic.slug, checked === true)
                  }
                />
                {characteristic.name}
              </label>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
