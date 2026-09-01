import {
  DEFAULT_VARIANT_LABEL_TYPE_ORDER,
  normalizeVariantLabelTypeOrder,
} from '@/lib/backstage/variant-label-settings'
import {
  getSelectedValueIds,
  type VariantAttributeSelections,
} from '@/lib/backstage/variant-selections'

export type VariantAttributeType = 'UNIVERSAL' | 'CONTAINER' | 'RANGE' | 'COLOR' | 'NUMBER'

export type ColorDisplayMode = 'TEXT' | 'SWATCH' | 'BOTH'

export const VARIANT_ATTRIBUTE_TYPES: VariantAttributeType[] = [
  'UNIVERSAL',
  'CONTAINER',
  'RANGE',
  'COLOR',
  'NUMBER',
]

export type PackagingKind = 'POT' | 'ROOT_BALL' | 'BARE_ROOT' | 'POT_ROOT_BALL'

export type VariantAttributeValue = {
  id: string
  slug: string
  label: string
  labelHint?: { locale: string; text: string } | null
  legacyId: string | null
  sortOrder: number
  numericMin: number | null
  numericMax: number | null
  volumeLiters: number | null
  potDiameterCm: number | null
  potHeightCm: number | null
  tareWeightKg: number | null
  colorHex: string | null
  packagingKind: PackagingKind | null
}

export type VariantAttribute = {
  id: string
  slug: string
  name: string
  nameHint?: { locale: string; text: string } | null
  description: string | null
  descriptionHint?: { locale: string; text: string } | null
  legacyId: string | null
  sortOrder: number
  valueType: VariantAttributeType
  unit: string | null
  isFilterable: boolean
  participatesInLabel: boolean
  showOnProductPage: boolean
  icon: string | null
  colorDisplayMode: ColorDisplayMode | null
  values: VariantAttributeValue[]
}

export type VariantAttributeValueInput = {
  label: string
  slug?: string
  legacyId?: string
  sortOrder?: number
  numericMin?: number | null
  numericMax?: number | null
  volumeLiters?: number | null
  potDiameterCm?: number | null
  potHeightCm?: number | null
  tareWeightKg?: number | null
  colorHex?: string | null
  packagingKind?: PackagingKind | null
}

export type CreateVariantAttributePayload = {
  name: string
  valueType: VariantAttributeType
  description?: string
  unit?: string
  slug?: string
  legacyId?: string
  isFilterable?: boolean
  participatesInLabel?: boolean
  showOnProductPage?: boolean
  icon?: string | null
  colorDisplayMode?: ColorDisplayMode | null
  values: VariantAttributeValueInput[]
}

export type UpdateVariantAttributePayload = {
  name?: string
  slug?: string
  description?: string | null
  unit?: string | null
  legacyId?: string | null
  valueType?: VariantAttributeType
  sortOrder?: number
  isFilterable?: boolean
  participatesInLabel?: boolean
  showOnProductPage?: boolean
  icon?: string | null
  colorDisplayMode?: ColorDisplayMode | null
  values?: Array<VariantAttributeValueInput & { id?: string }>
}

export type ValueDraft = {
  key: string
  id?: string
  label: string
  labelHint?: { locale: string; text: string } | null
  legacyId: string
  numericMin: string
  numericMax: string
  volumeLiters: string
  potDiameterCm: string
  potHeightCm: string
  tareWeightKg: string
  colorHex: string
  packagingKind: PackagingKind | ''
}

function numToDraft(value: number | null | undefined): string {
  return value != null ? String(value) : ''
}

export function attributeToValueDrafts(attribute: VariantAttribute): ValueDraft[] {
  return attribute.values.map((v) => ({
    key: v.id,
    id: v.id,
    label: v.label,
    labelHint: v.labelHint ?? null,
    legacyId: v.legacyId ?? '',
    numericMin: numToDraft(v.numericMin),
    numericMax: numToDraft(v.numericMax),
    volumeLiters: numToDraft(v.volumeLiters),
    potDiameterCm: numToDraft(v.potDiameterCm),
    potHeightCm: numToDraft(v.potHeightCm),
    tareWeightKg: numToDraft(v.tareWeightKg),
    colorHex: v.colorHex ?? '',
    packagingKind: v.packagingKind ?? '',
  }))
}

export type VariantAttributeEditorSnapshot = {
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
  values: Array<{
    id?: string
    label: string
    legacyId: string | null
    numericMin: number | null
    numericMax: number | null
    volumeLiters: number | null
    potDiameterCm: number | null
    potHeightCm: number | null
    tareWeightKg: number | null
    colorHex: string | null
    packagingKind: PackagingKind | null
  }>
}

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

function draftToValueSnapshot(value: ValueDraft) {
  return {
    id: value.id,
    label: value.label.trim(),
    legacyId: value.legacyId.trim() || null,
    numericMin: parseOptionalNumber(value.numericMin),
    numericMax: parseOptionalNumber(value.numericMax),
    volumeLiters: parseOptionalNumber(value.volumeLiters),
    potDiameterCm: parseOptionalNumber(value.potDiameterCm),
    potHeightCm: parseOptionalNumber(value.potHeightCm),
    tareWeightKg: parseOptionalNumber(value.tareWeightKg),
    colorHex: value.colorHex.trim().toUpperCase() || null,
    packagingKind: value.packagingKind || null,
  }
}

export function snapshotFromAttribute(attribute: VariantAttribute): VariantAttributeEditorSnapshot {
  return {
    name: attribute.name.trim(),
    slug: attribute.slug,
    valueType: normalizeVariantAttributeType(attribute.valueType),
    description: attribute.description,
    unit: attribute.unit,
    legacyId: attribute.legacyId,
    isFilterable: attribute.isFilterable,
    participatesInLabel: attribute.participatesInLabel,
    showOnProductPage: attribute.showOnProductPage ?? false,
    icon: attribute.icon ?? null,
    colorDisplayMode: attribute.colorDisplayMode ?? null,
    values: attribute.values.map((value) => draftToValueSnapshot({
      key: value.id,
      id: value.id,
      label: value.label,
      legacyId: value.legacyId ?? '',
      numericMin: numToDraft(value.numericMin),
      numericMax: numToDraft(value.numericMax),
      volumeLiters: numToDraft(value.volumeLiters),
      potDiameterCm: numToDraft(value.potDiameterCm),
      potHeightCm: numToDraft(value.potHeightCm),
    tareWeightKg: numToDraft(value.tareWeightKg),
    colorHex: value.colorHex ?? '',
    packagingKind: value.packagingKind ?? '',
  })),
  }
}

export function snapshotFromDrafts(
  name: string,
  slug: string,
  valueType: VariantAttributeType,
  description: string,
  unit: string,
  legacyId: string,
  isFilterable: boolean,
  participatesInLabel: boolean,
  showOnProductPage: boolean,
  icon: string | null,
  colorDisplayMode: ColorDisplayMode | null,
  values: ValueDraft[],
): VariantAttributeEditorSnapshot {
  return {
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    valueType,
    description: description.trim() || null,
    unit: unit.trim() || null,
    legacyId: legacyId.trim() || null,
    isFilterable,
    participatesInLabel,
    showOnProductPage,
    icon: showOnProductPage ? icon?.trim() || null : null,
    colorDisplayMode: valueType === 'COLOR' ? colorDisplayMode : null,
    values: values.filter((value) => value.label.trim()).map(draftToValueSnapshot),
  }
}

export function isVariantAttributeDirty(
  current: VariantAttributeEditorSnapshot,
  baseline: VariantAttributeEditorSnapshot,
): boolean {
  return JSON.stringify(current) !== JSON.stringify(baseline)
}

export function createValueDraft(partial?: Partial<ValueDraft>): ValueDraft {
  return {
    key: crypto.randomUUID(),
    label: '',
    legacyId: '',
    numericMin: '',
    numericMax: '',
    volumeLiters: '',
    potDiameterCm: '',
    potHeightCm: '',
    tareWeightKg: '',
    colorHex: '',
    packagingKind: '',
    ...partial,
  }
}

export function parseBulkValuesText(text: string): Array<{ label: string; legacyId?: string }> {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, legacyId] = line.split('|').map((part) => part.trim())
      return { label, legacyId: legacyId || undefined }
    })
}

export function valueDraftsToPayload(
  values: ValueDraft[],
): Array<VariantAttributeValueInput & { id?: string }> {
  return values
    .filter((v) => v.id || v.label.trim())
    .map((v) => {
      const snap = draftToValueSnapshot(v)
      return {
        ...(v.id ? { id: v.id } : {}),
        label: snap.label,
        legacyId: snap.legacyId ?? undefined,
        numericMin: snap.numericMin,
        numericMax: snap.numericMax,
        volumeLiters: snap.volumeLiters,
        potDiameterCm: snap.potDiameterCm,
        potHeightCm: snap.potHeightCm,
    tareWeightKg: snap.tareWeightKg,
    colorHex: snap.colorHex,
    packagingKind: snap.packagingKind,
      }
    })
}

export function normalizeVariantAttributeType(
  valueType: VariantAttributeType | string | null | undefined,
): VariantAttributeType {
  if (
    valueType === 'UNIVERSAL' ||
    valueType === 'CONTAINER' ||
    valueType === 'RANGE' ||
    valueType === 'COLOR' ||
    valueType === 'NUMBER'
  ) {
    return valueType
  }
  return 'UNIVERSAL'
}

export function normalizeVariantAttribute(attribute: VariantAttribute): VariantAttribute {
  return {
    ...attribute,
    valueType: normalizeVariantAttributeType(attribute.valueType),
    description: attribute.description ?? null,
    unit: attribute.unit ?? null,
    isFilterable: attribute.isFilterable ?? true,
    participatesInLabel: attribute.participatesInLabel ?? true,
    showOnProductPage: attribute.showOnProductPage ?? false,
    icon: attribute.icon ?? null,
    colorDisplayMode: attribute.colorDisplayMode ?? null,
    values: (attribute.values ?? []).map((value) => ({
      ...value,
      numericMin: value.numericMin ?? null,
      numericMax: value.numericMax ?? null,
      volumeLiters: value.volumeLiters ?? null,
      potDiameterCm: value.potDiameterCm ?? null,
      potHeightCm: value.potHeightCm ?? null,
      tareWeightKg: value.tareWeightKg ?? null,
      colorHex: value.colorHex ?? null,
    })),
  }
}

export function validateValueDraftsForType(
  valueType: VariantAttributeType,
  values: ValueDraft[],
): string | null {
  const kept = values.filter((v) => v.id || v.label.trim())
  if (kept.length === 0) return 'attributeValuesRequired'

  for (const row of kept) {
    const label = row.label.trim()
    if (!label) continue
    if (valueType === 'RANGE') {
      const min = parseOptionalNumber(row.numericMin)
      const max = parseOptionalNumber(row.numericMax)
      if (min != null && max != null && max < min) return `rangeMaxInvalid:${label}`
    }
    if (valueType === 'COLOR') {
      const hex = row.colorHex.trim()
      if (hex && !/^#[0-9A-Fa-f]{6}$/.test(hex)) return `colorHexInvalid:${label}`
    }
  }

  return null
}

export function attributeTypeNeedsUnit(valueType: VariantAttributeType): boolean {
  return valueType === 'RANGE' || valueType === 'NUMBER'
}

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { message?: string | string[]; error?: string }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

export async function fetchVariantAttributes(options?: {
  locale?: string
  edit?: boolean
}): Promise<VariantAttribute[]> {
  const query = new URLSearchParams()
  if (options?.locale) query.set('locale', options.locale)
  if (options?.edit === false) query.set('edit', '0')
  const suffix = query.toString() ? `?${query}` : ''
  const res = await fetch(`/api/backstage/variant-attributes${suffix}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as VariantAttribute[]
  return data.map(normalizeVariantAttribute)
}

export async function createVariantAttribute(
  payload: CreateVariantAttributePayload,
  locale: string,
): Promise<VariantAttribute> {
  const res = await fetch('/api/backstage/variant-attributes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ...payload, locale }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return normalizeVariantAttribute(await res.json())
}

export async function addVariantAttributeValues(
  attributeId: string,
  values: VariantAttributeValueInput[],
  locale: string,
): Promise<VariantAttribute> {
  const res = await fetch(`/api/backstage/variant-attributes/${attributeId}/values`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ values, locale }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return normalizeVariantAttribute(await res.json())
}

export async function updateVariantAttribute(
  attributeId: string,
  payload: UpdateVariantAttributePayload,
  locale: string,
): Promise<VariantAttribute> {
  const res = await fetch(`/api/backstage/variant-attributes/${attributeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ...payload, locale }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return normalizeVariantAttribute(await res.json())
}

export async function deleteVariantAttribute(attributeId: string): Promise<void> {
  const res = await fetch(`/api/backstage/variant-attributes/${attributeId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
}

export function sortAttributesForVariantLabel(
  attributes: VariantAttribute[],
  typeOrder: VariantAttributeType[] = DEFAULT_VARIANT_LABEL_TYPE_ORDER,
): VariantAttribute[] {
  const orderIndex = new Map(typeOrder.map((type, index) => [type, index]))
  return [...attributes].sort((a, b) => {
    const typeA = orderIndex.get(a.valueType) ?? 99
    const typeB = orderIndex.get(b.valueType) ?? 99
    if (typeA !== typeB) return typeA - typeB
    return a.sortOrder - b.sortOrder
  })
}

export function buildVariantLabel(
  attributes: VariantAttribute[],
  selections: VariantAttributeSelections,
  typeOrder?: VariantAttributeType[],
): string {
  const parts: string[] = []
  for (const attr of sortAttributesForVariantLabel(
    attributes,
    normalizeVariantLabelTypeOrder(typeOrder),
  )) {
    if (!attr.participatesInLabel) continue
    const valueIds = getSelectedValueIds(selections, attr.id)
    if (!valueIds.length) continue
    const labels = valueIds
      .map((valueId) => attr.values.find((v) => v.id === valueId)?.label)
      .filter((label): label is string => Boolean(label?.trim()))
    if (labels.length) {
      parts.push(attr.valueType === 'COLOR' ? labels.join(' / ') : labels.join(' · '))
    }
  }
  return parts.join(' · ')
}
