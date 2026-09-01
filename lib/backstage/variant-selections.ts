import type { VariantAttribute } from '@/lib/backstage/variant-attributes'

export type VariantAttributeSelections = Record<string, string | string[]>

export function getSelectedValueIds(
  selections: VariantAttributeSelections,
  attributeId: string,
): string[] {
  const raw = selections[attributeId]
  if (!raw) return []
  return Array.isArray(raw) ? raw.filter(Boolean) : [raw]
}

export function flattenAttributeValueIds(selections: VariantAttributeSelections): string[] {
  return Object.keys(selections).flatMap((attributeId) =>
    getSelectedValueIds(selections, attributeId),
  )
}

export function countVariantSelections(selections: VariantAttributeSelections): number {
  return flattenAttributeValueIds(selections).length
}

export function hasVariantSelections(selections: VariantAttributeSelections): boolean {
  return countVariantSelections(selections) > 0
}

export function addVariantSelectionValue(
  selections: VariantAttributeSelections,
  attribute: VariantAttribute,
  valueId: string,
): VariantAttributeSelections {
  if (attribute.valueType === 'COLOR') {
    const current = getSelectedValueIds(selections, attribute.id)
    if (current.includes(valueId)) return selections
    return { ...selections, [attribute.id]: [...current, valueId] }
  }
  return { ...selections, [attribute.id]: valueId }
}

export function removeVariantSelectionValue(
  selections: VariantAttributeSelections,
  attribute: VariantAttribute,
  valueId?: string,
): VariantAttributeSelections {
  const next = { ...selections }
  if (attribute.valueType === 'COLOR' && valueId) {
    const remaining = getSelectedValueIds(selections, attribute.id).filter((id) => id !== valueId)
    if (remaining.length) next[attribute.id] = remaining
    else delete next[attribute.id]
    return next
  }
  delete next[attribute.id]
  return next
}

export function variantSelectionsFromAttributeValueIds(
  attributeValueIds: string[],
  attributes: VariantAttribute[],
): VariantAttributeSelections {
  const selections: VariantAttributeSelections = {}

  for (const attribute of attributes) {
    const matching = attributeValueIds.filter((id) =>
      attribute.values.some((value) => value.id === id),
    )
    if (!matching.length) continue

    if (attribute.valueType === 'COLOR') {
      selections[attribute.id] = matching
    } else {
      selections[attribute.id] = matching[0]
    }
  }

  return selections
}

export function attributeHasAvailableValues(
  attribute: VariantAttribute,
  selections: VariantAttributeSelections,
): boolean {
  const selected = new Set(getSelectedValueIds(selections, attribute.id))
  return attribute.values.some((value) => !selected.has(value.id))
}
