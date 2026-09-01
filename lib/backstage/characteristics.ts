export type ColorDisplayMode = 'TEXT' | 'SWATCH' | 'BOTH'

export type CharacteristicOption = {
  id: string
  slug: string
  label: string
  labelHint?: { locale: string; text: string } | null
  colorHex?: string | null
  sortOrder: number
}

export type CharacteristicDefinition = {
  id: string
  slug: string
  name: string
  nameHint?: { locale: string; text: string } | null
  valueType: 'SELECT' | 'MULTI_SELECT' | 'NUMBER' | 'TEXT' | 'COLOR'
  unit: string | null
  isFilterable: boolean
  showOnProductPage: boolean
  icon: string | null
  colorDisplayMode: ColorDisplayMode | null
  sortOrder: number
  options: CharacteristicOption[]
}

export type VariantAttributeFilterDefinition = {
  id: string
  slug: string
  name: string
  valueType?: 'UNIVERSAL' | 'CONTAINER' | 'RANGE' | 'COLOR' | 'NUMBER'
  isFilterable: boolean
  participatesInLabel: boolean
  icon?: string | null
  colorDisplayMode?: ColorDisplayMode | null
  values: Array<{
    id: string
    slug: string
    label: string
    colorHex?: string | null
    packagingKind?: 'POT' | 'ROOT_BALL' | 'BARE_ROOT' | 'POT_ROOT_BALL' | null
  }>
}

export type CatalogFilterDefinitions = {
  characteristics: CharacteristicDefinition[]
  variantAttributes: VariantAttributeFilterDefinition[]
  price: { min: number; max: number }
}

export type ProductCharacteristicEntry = {
  characteristicId: string
  optionId?: string
  textValue?: string
  numberValue?: number
}

export type ProductCharacteristicFieldValue = string | string[]

export type ProductCharacteristicsFormState = Record<string, ProductCharacteristicFieldValue>

export function isMultiOptionCharacteristic(
  definition: Pick<CharacteristicDefinition, 'valueType'>,
): boolean {
  return definition.valueType === 'MULTI_SELECT' || definition.valueType === 'COLOR'
}

function defaultFieldValue(definition: CharacteristicDefinition): ProductCharacteristicFieldValue {
  return isMultiOptionCharacteristic(definition) ? [] : ''
}

function hasFieldValue(value: ProductCharacteristicFieldValue | undefined): boolean {
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value?.trim())
}

export function emptyCharacteristicsForm(
  definitions: CharacteristicDefinition[],
): ProductCharacteristicsFormState {
  return Object.fromEntries(definitions.map((item) => [item.id, defaultFieldValue(item)]))
}

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { message?: string | string[]; error?: string }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

export async function fetchCatalogFilterDefinitions(params?: {
  locale?: string
  categorySlug?: string
  search?: string
  characteristics?: string
  variantAttributes?: string
  priceMin?: string
  priceMax?: string
}): Promise<CatalogFilterDefinitions> {
  const query = new URLSearchParams()
  if (params?.locale) query.set('locale', params.locale)
  if (params?.categorySlug) query.set('categorySlug', params.categorySlug)
  if (params?.search) query.set('search', params.search)
  if (params?.characteristics) query.set('characteristics', params.characteristics)
  if (params?.variantAttributes) query.set('variantAttributes', params.variantAttributes)
  if (params?.priceMin) query.set('priceMin', params.priceMin)
  if (params?.priceMax) query.set('priceMax', params.priceMax)
  const suffix = query.toString() ? `?${query}` : ''

  if (typeof window === 'undefined') {
    const { getBackendApiUrl } = await import('@/lib/api/backend-url')
    const res = await fetch(`${getBackendApiUrl()}/catalog/filters${suffix}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(await parseError(res))
    const data = (await res.json()) as CatalogFilterDefinitions
    return {
      characteristics: data.characteristics ?? [],
      variantAttributes: data.variantAttributes ?? [],
      price: data.price ?? { min: 0, max: 0 },
    }
  }

  const res = await fetch(`/api/catalog/filters${suffix}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as CatalogFilterDefinitions
  return {
    characteristics: data.characteristics ?? [],
    variantAttributes: data.variantAttributes ?? [],
    price: data.price ?? { min: 0, max: 0 },
  }
}

export async function fetchCharacteristicDefinitions(options?: {
  locale?: string
  edit?: boolean
}): Promise<CharacteristicDefinition[]> {
  const query = new URLSearchParams()
  if (options?.locale) query.set('locale', options.locale)
  if (options?.edit === false) query.set('edit', '0')
  const suffix = query.toString() ? `?${query}` : ''
  const res = await fetch(`/api/backstage/characteristics${suffix}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as Array<Partial<CharacteristicDefinition> & Pick<CharacteristicDefinition, 'id' | 'slug' | 'name' | 'valueType' | 'sortOrder' | 'options'>>
  return data.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    valueType: item.valueType!,
    unit: item.unit ?? null,
    isFilterable: item.isFilterable ?? true,
    showOnProductPage: item.showOnProductPage ?? false,
    icon: item.icon ?? null,
    colorDisplayMode: item.colorDisplayMode ?? null,
    sortOrder: item.sortOrder ?? 0,
    options: item.options ?? [],
  }))
}

export async function createCharacteristic(
  payload: {
    name: string
    slug?: string
    valueType: CharacteristicDefinition['valueType']
    unit?: string
    isFilterable?: boolean
    showOnProductPage?: boolean
    icon?: string
    colorDisplayMode?: ColorDisplayMode
    options?: Array<{ label: string; slug?: string; colorHex?: string | null }>
  },
  locale: string,
): Promise<CharacteristicDefinition> {
  const res = await fetch('/api/backstage/characteristics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ...payload, locale }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateCharacteristic(
  id: string,
  payload: Partial<{
    name: string
    valueType: CharacteristicDefinition['valueType']
    unit: string | null
    isFilterable: boolean
    showOnProductPage: boolean
    icon: string | null
    colorDisplayMode?: ColorDisplayMode | null
    sortOrder: number
    options: Array<{ id?: string; label: string; slug?: string; colorHex?: string | null; sortOrder?: number }>
  }>,
  locale: string,
): Promise<CharacteristicDefinition> {
  const res = await fetch(`/api/backstage/characteristics/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ...payload, locale }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteCharacteristic(id: string): Promise<void> {
  const res = await fetch(`/api/backstage/characteristics/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
}

export type CharacteristicCellValue = {
  optionId?: string
  optionIds?: string[]
  textValue?: string
  numberValue?: number
} | null

export type BulkMatrixProductRow = {
  productId: string
  productName: string
  stock: number
  values: Record<string, CharacteristicCellValue>
}

export type BulkCharacteristicsMatrix = {
  characteristics: CharacteristicDefinition[]
  items: BulkMatrixProductRow[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export async function fetchBulkCharacteristicsMatrix(params?: {
  page?: number
  pageSize?: number
  search?: string
  stock?: 'all' | 'in_stock' | 'out_of_stock'
  locale?: string
}): Promise<BulkCharacteristicsMatrix> {
  const query = new URLSearchParams()
  if (params?.locale) query.set('locale', params.locale)
  if (params?.page != null) query.set('page', String(params.page))
  if (params?.pageSize != null) query.set('pageSize', String(params.pageSize))
  if (params?.search?.trim()) query.set('search', params.search.trim())
  if (params?.stock && params.stock !== 'all') query.set('stock', params.stock)

  const res = await fetch(`/api/backstage/characteristics/bulk-matrix?${query}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function bulkUpdateCharacteristicsMatrix(
  updates: Array<{
    productId: string
    characteristicId: string
    optionId?: string
    optionIds?: string[]
    textValue?: string
    numberValue?: number
    clear?: boolean
  }>,
  locale: string,
): Promise<{ updated: number }> {
  const res = await fetch('/api/backstage/characteristics/bulk-matrix', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates, locale }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export function buildCharacteristicsPayload(
  form: ProductCharacteristicsFormState,
  definitions: CharacteristicDefinition[] = [],
): { entries: ProductCharacteristicEntry[] } | undefined {
  const entries: ProductCharacteristicEntry[] = []
  const definitionById = new Map(definitions.map((item) => [item.id, item]))

  for (const [characteristicId, raw] of Object.entries(form)) {
    const definition = definitionById.get(characteristicId)

    if (definition?.valueType === 'MULTI_SELECT' || definition?.valueType === 'COLOR') {
      const optionIds = Array.isArray(raw) ? raw : raw ? [raw] : []
      for (const rawOptionId of optionIds) {
        const value = rawOptionId.trim()
        if (!value) continue

        if (/^[0-9a-f-]{36}$/i.test(value)) {
          entries.push({ characteristicId, optionId: value })
          continue
        }

        const option = definition.options.find((item) => item.slug === value)
        if (option) entries.push({ characteristicId, optionId: option.id })
      }
      continue
    }

    const value = Array.isArray(raw) ? (raw[0] ?? '') : raw
    if (!value.trim()) continue

    if (definition?.valueType === 'TEXT') {
      entries.push({ characteristicId, textValue: value.trim() })
      continue
    }

    if (definition?.valueType === 'NUMBER') {
      const numberValue = Number(value)
      if (!Number.isNaN(numberValue)) {
        entries.push({ characteristicId, numberValue })
      }
      continue
    }

    if (/^[0-9a-f-]{36}$/i.test(value)) {
      entries.push({ characteristicId, optionId: value })
      continue
    }

    const option = definition?.options.find((item) => item.slug === value)
    if (option) {
      entries.push({ characteristicId, optionId: option.id })
    }
  }

  return entries.length ? { entries } : undefined
}

export function characteristicsFormFromLegacy(
  definitions: CharacteristicDefinition[],
  legacy: {
    sunRequirement?: string
    soilType?: string
    hardinessZone?: string
    wateringNeeds?: string
    height?: string
  },
): ProductCharacteristicsFormState {
  const slugMap: Record<string, string | undefined> = {
    'sun-requirement': legacy.sunRequirement,
    'soil-type': legacy.soilType,
    'hardiness-zone': legacy.hardinessZone,
    'watering-needs': legacy.wateringNeeds,
    height: legacy.height,
  }

  const form = emptyCharacteristicsForm(definitions)
  for (const definition of definitions) {
    const raw = slugMap[definition.slug]
    if (!raw?.trim()) continue

    if (definition.valueType === 'TEXT' || definition.valueType === 'NUMBER') {
      form[definition.id] = raw.trim()
      continue
    }

    const option = definition.options.find((item) => item.slug === raw.trim())
    if (option) form[definition.id] = option.id
  }

  return form
}

export function characteristicsFormFromEntries(
  definitions: CharacteristicDefinition[],
  entries: Array<{
    characteristicId: string
    optionId?: string
    textValue?: string
    numberValue?: number
  }>,
): ProductCharacteristicsFormState {
  const form = emptyCharacteristicsForm(definitions)
  const multiIds = new Set(
    definitions
      .filter((item) => isMultiOptionCharacteristic(item))
      .map((item) => item.id),
  )
  const multiValues = new Map<string, string[]>()

  for (const entry of entries) {
    if (multiIds.has(entry.characteristicId)) {
      if (entry.optionId) {
        const values = multiValues.get(entry.characteristicId) ?? []
        values.push(entry.optionId)
        multiValues.set(entry.characteristicId, values)
      }
      continue
    }

    if (entry.textValue) {
      form[entry.characteristicId] = entry.textValue
    } else if (entry.numberValue != null) {
      form[entry.characteristicId] = String(entry.numberValue)
    } else if (entry.optionId) {
      form[entry.characteristicId] = entry.optionId
    }
  }

  for (const [characteristicId, optionIds] of multiValues) {
    form[characteristicId] = optionIds
  }

  return form
}

export function hasCharacteristicsFormValue(form: ProductCharacteristicsFormState): boolean {
  return Object.values(form).some((value) => hasFieldValue(value))
}

export function serializeCatalogFilters(
  filters: {
    characteristics: Record<string, string[]>
    variantAttributes: Record<string, string[]>
    price: { min: number | null; max: number | null }
  },
  options?: { inStockOnly?: boolean },
) {
  const characteristicPairs = Object.entries(filters.characteristics).flatMap(([slug, values]) =>
    values.map((value) => [slug, value] as const),
  )
  const variantPairs = Object.entries(filters.variantAttributes).flatMap(([slug, values]) =>
    values.map((value) => [slug, value] as const),
  )

  const result: {
    characteristics: string
    variantAttributes: string
    stock?: 'in_stock'
    priceMin?: string
    priceMax?: string
  } = {
    characteristics: characteristicPairs.map(([key, value]) => `${key}=${value}`).join(','),
    variantAttributes: variantPairs.map(([key, value]) => `${key}=${value}`).join(','),
  }

  if (options?.inStockOnly) {
    result.stock = 'in_stock'
  }

  if (filters.price.min != null) result.priceMin = String(filters.price.min)
  if (filters.price.max != null) result.priceMax = String(filters.price.max)

  return result
}
