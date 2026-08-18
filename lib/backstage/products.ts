import {
  buildCharacteristicsPayload,
  characteristicsFormFromEntries,
  characteristicsFormFromLegacy,
  fetchCharacteristicDefinitions,
  type CharacteristicDefinition,
} from '@/lib/backstage/characteristics'
import {
  createQuantityPriceDraft,
  createVariantDraft,
  type ProductFormState,
} from '@/lib/backstage/product-form'
import { isoToDateInput } from '@/lib/backstage/variant-pricing'
import type { VariantAttribute } from '@/lib/backstage/variant-attributes'

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[]
    error?: string
  }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

export type BackstageProductListItem = {
  id: string
  slug: string
  name: string
  nameUk?: string
  nameEn?: string
  nameSk?: string
  latinName: string | null
  /** Intrastat Combined Nomenclature (e.g. 060290) */
  cnCode: string | null
  legacyId: string | null
  isPublished: boolean
  categoryId: string
  categorySlug: string
  categoryName: string
  variantCount: number
  sku: string | null
  price: number | null
  stock: number
  variantLabel: string | null
  imageUrl: string | null
  characteristics: {
    entries?: Array<{
      characteristicId: string
      optionId?: string
      textValue?: string
      numberValue?: number
    }>
    sunRequirement?: string
    soilType?: string
    hardinessZone?: string
    wateringNeeds?: string
    height?: string
  }
  createdAt: string
  maxDiscountPercent?: number | null
}

export type BackstageVariantQuantityPrice = {
  id: string
  minQuantity: number
  discountType: 'fixed_price' | 'percent'
  value: number
  validFrom: string | null
  validTo: string | null
}

export type BackstageProductVariant = {
  id: string
  sku: string | null
  ean: string | null
  stock: number
  price: number
  legacyId: string | null
  label: string | null
  attributeValueIds: string[]
  availableFrom: string | null
  quantityPrices: BackstageVariantQuantityPrice[]
  salesUnitId: string | null
  salesUnitSymbol: string | null
  weight: number | null
  lengthCm: number | null
  widthCm: number | null
  heightCm: number | null
  volumetricWeightKg: number | null
  displayAttributes?: Array<{
    id: string
    slug: string
    name: string
    icon: string | null
    unit: string | null
    valueType: string
    displayValue: string
    sortOrder: number
  }>
}

export type BackstageProductDetail = BackstageProductListItem & {
  description: string | null
  metaTitle: string | null
  metaDesc: string | null
  nameHint?: { locale: string; text: string } | null
  descriptionHint?: { locale: string; text: string } | null
  metaTitleHint?: { locale: string; text: string } | null
  metaDescHint?: { locale: string; text: string } | null
  additionalCategoryIds: string[]
  pricingMode: 'simple' | 'variants'
  variants: BackstageProductVariant[]
  images: string[]
}

export type ProductPayload = {
  name: string
  latinName?: string
  cnCode?: string
  slug: string
  legacyId?: string
  primaryCategoryId: string
  additionalCategoryIds: string[]
  description?: string
  metaTitle?: string
  metaDesc?: string
  isPublished: boolean
  locale: string
  characteristics?: {
    entries?: Array<{
      characteristicId: string
      optionId?: string
      textValue?: string
      numberValue?: number
    }>
    sunRequirement?: string
    soilType?: string
    hardinessZone?: string
    wateringNeeds?: string
    height?: string
  }
  pricingMode: 'simple' | 'variants'
  variant?: {
    id?: string
    sku?: string
    ean?: string
    stock: number
    price: number
    legacyId?: string
    label?: string
    attributeValueIds: string[]
    availableFrom?: string
    salesUnitId?: string
    weight?: number
    lengthCm?: number
    widthCm?: number
    heightCm?: number
    quantityPrices?: Array<{
      minQuantity: number
      discountType?: 'fixed_price' | 'percent'
      value: number
      validFrom?: string
      validTo?: string
    }>
  }
  variants?: Array<{
    id?: string
    sku?: string
    ean?: string
    stock: number
    price: number
    legacyId?: string
    label?: string
    attributeValueIds: string[]
    availableFrom?: string
    salesUnitId?: string
    weight?: number
    lengthCm?: number
    widthCm?: number
    heightCm?: number
    quantityPrices?: Array<{
      minQuantity: number
      discountType?: 'fixed_price' | 'percent'
      value: number
      validFrom?: string
      validTo?: string
    }>
  }>
  images?: Array<{ url: string; isMain?: boolean }>
}

function buildQuantityPricesPayload(variant: ProductFormState['variants'][number]) {
  return variant.quantityPrices
    .filter((row) => row.minQuantity.trim() && row.value.trim())
    .map((row) => ({
      minQuantity: Number(row.minQuantity),
      discountType: row.discountType,
      value: Number(row.value),
      validFrom: row.validFrom.trim() || undefined,
      validTo: row.validTo.trim() || undefined,
    }))
}

function buildVariantPayload(
  variant: ProductFormState['variants'][number],
  _attributes: VariantAttribute[],
) {
  const quantityPrices = buildQuantityPricesPayload(variant)

  return {
    id: variant.id,
    sku: variant.sku.trim() || undefined,
    ean: variant.ean.trim() || undefined,
    stock: Number(variant.stock),
    price: Number(variant.price),
    legacyId: variant.legacyId.trim() || undefined,
    attributeValueIds: Object.values(variant.selections).filter(Boolean),
    availableFrom: variant.availableFrom.trim() || undefined,
    salesUnitId: variant.salesUnitId.trim() || undefined,
    weight: variant.weight.trim() ? Number(variant.weight) : undefined,
    lengthCm: variant.lengthCm.trim() ? Number(variant.lengthCm) : undefined,
    widthCm: variant.widthCm.trim() ? Number(variant.widthCm) : undefined,
    heightCm: variant.heightCm.trim() ? Number(variant.heightCm) : undefined,
    quantityPrices: quantityPrices.length ? quantityPrices : undefined,
  }
}

function mapVariantToDraft(
  variant: BackstageProductVariant,
  partial?: Partial<ReturnType<typeof createVariantDraft>>,
) {
  return createVariantDraft({
    id: variant.id,
    sku: variant.sku ?? '',
    ean: variant.ean ?? '',
    stock: String(variant.stock),
    price: String(variant.price),
    legacyId: variant.legacyId ?? '',
    availableFrom: isoToDateInput(variant.availableFrom),
    salesUnitId: variant.salesUnitId ?? '',
    weight: variant.weight != null ? String(variant.weight) : '',
    lengthCm: variant.lengthCm != null ? String(variant.lengthCm) : '',
    widthCm: variant.widthCm != null ? String(variant.widthCm) : '',
    heightCm: variant.heightCm != null ? String(variant.heightCm) : '',
    quantityPrices: (variant.quantityPrices ?? []).map((row) =>
      createQuantityPriceDraft({
        minQuantity: String(row.minQuantity),
        discountType: row.discountType ?? 'fixed_price',
        value: String(row.value),
        validFrom: isoToDateInput(row.validFrom),
        validTo: isoToDateInput(row.validTo),
      }),
    ),
    ...partial,
  })
}

export function buildProductPayload(
  form: ProductFormState,
  attributes: VariantAttribute[],
  characteristicDefinitions: CharacteristicDefinition[] = [],
  locale: string,
): ProductPayload {
  const base: ProductPayload = {
    name: form.name.trim(),
    slug: form.slug.trim().toLowerCase(),
    primaryCategoryId: form.primaryCategoryId,
    additionalCategoryIds: form.additionalCategoryIds,
    description: form.description.trim() || undefined,
    metaTitle: form.metaTitle.trim() || undefined,
    metaDesc: form.metaDesc.trim() || undefined,
    isPublished: form.isPublished,
    locale,
    pricingMode: form.pricingMode,
  }

  const latinName = form.latinName.trim()
  if (latinName) base.latinName = latinName

  // Always send so empty clears DB (Flexi may refill on next sync).
  base.cnCode = form.cnCode.replace(/\s/g, '').trim()

  const legacyId = form.legacyId.trim()
  if (legacyId) base.legacyId = legacyId

  const characteristics = buildCharacteristicsPayload(
    form.characteristics,
    characteristicDefinitions,
  )
  if (characteristics) base.characteristics = characteristics

  if (form.images.length) {
    base.images = form.images.map((image) => ({
      url: image.url,
      isMain: image.isMain,
    }))
  } else {
    base.images = []
  }

  if (form.pricingMode === 'simple') {
    const variant = form.variants[0]
    const quantityPrices = variant ? buildQuantityPricesPayload(variant) : []
    base.variant = {
      id: variant?.id,
      sku: form.simpleSku.trim() || undefined,
      ean: form.simpleEan.trim() || undefined,
      stock: Number(form.simpleStock),
      price: Number(form.simplePrice),
      attributeValueIds: [],
      availableFrom: variant?.availableFrom.trim() || undefined,
      salesUnitId: variant?.salesUnitId.trim() || undefined,
      weight: variant?.weight.trim() ? Number(variant.weight) : undefined,
      lengthCm: variant?.lengthCm.trim() ? Number(variant.lengthCm) : undefined,
      widthCm: variant?.widthCm.trim() ? Number(variant.widthCm) : undefined,
      heightCm: variant?.heightCm.trim() ? Number(variant.heightCm) : undefined,
      quantityPrices: quantityPrices.length ? quantityPrices : undefined,
    }
    return base
  }

  base.variants = form.variants.map((variant) => buildVariantPayload(variant, attributes))
  return base
}

export async function checkProductSlugAvailable(
  slug: string,
  excludeId?: string,
): Promise<{ available: boolean; slug: string }> {
  const params = new URLSearchParams({ slug })
  if (excludeId) params.set('excludeId', excludeId)
  const res = await fetch(`/api/backstage/products/check-slug?${params}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export type BackstageProductsFilters = {
  search?: string
  categoryId?: string
  published?: 'all' | 'true' | 'false'
  stock?: 'all' | 'in_stock' | 'out_of_stock'
  page?: number
  pageSize?: number
  locale?: string
}

export type PaginatedBackstageProducts = {
  items: BackstageProductListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type BulkProductAction = 'delete' | 'publish' | 'unpublish' | 'set_stock'

function buildProductsQuery(params?: BackstageProductsFilters) {
  const query = new URLSearchParams()
  if (params?.locale) query.set('locale', params.locale)
  if (params?.search) query.set('search', params.search)
  if (params?.categoryId) query.set('categoryId', params.categoryId)
  if (params?.published && params.published !== 'all') {
    query.set('published', params.published)
  }
  if (params?.stock && params.stock !== 'all') {
    query.set('stock', params.stock)
  }
  if (params?.page != null) query.set('page', String(params.page))
  if (params?.pageSize != null) query.set('pageSize', String(params.pageSize))
  return query
}

export async function fetchBackstageProducts(
  params?: BackstageProductsFilters,
): Promise<BackstageProductListItem[]> {
  const query = buildProductsQuery(params)
  const suffix = query.toString() ? `?${query}` : ''
  const res = await fetch(`/api/backstage/products${suffix}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : data.items
}

export async function fetchBackstageProductsPage(
  params: BackstageProductsFilters & { page: number; pageSize: number },
): Promise<PaginatedBackstageProducts> {
  const query = buildProductsQuery(params)
  const res = await fetch(`/api/backstage/products?${query}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = await res.json()
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      pageSize: data.length,
      totalPages: 1,
    }
  }
  return data as PaginatedBackstageProducts
}

export async function bulkBackstageProducts(input: {
  ids: string[]
  action: BulkProductAction
  stock?: number
}) {
  const res = await fetch('/api/backstage/products/bulk', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<{
    action: BulkProductAction
    affected: number
    variantsUpdated?: number
    stock?: number
  }>
}

export async function setProductPublished(
  id: string,
  isPublished: boolean,
): Promise<{ id: string; isPublished: boolean }> {
  const res = await fetch(`/api/backstage/products/${id}/published`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isPublished }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchBackstageProduct(
  id: string,
  locale: string,
  options?: { edit?: boolean },
): Promise<BackstageProductDetail> {
  const query = new URLSearchParams({ locale })
  if (options?.edit === false) query.set('edit', '0')
  const res = await fetch(`/api/backstage/products/${id}?${query}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function createProduct(payload: ProductPayload): Promise<BackstageProductDetail> {
  const res = await fetch('/api/backstage/products', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export function productDetailToFormState(
  detail: BackstageProductDetail,
  variantAttributes: VariantAttribute[],
  characteristicDefinitions: CharacteristicDefinition[] = [],
): ProductFormState {
  const form: ProductFormState = {
    id: detail.id,
    name: detail.name,
    latinName: detail.latinName ?? '',
    cnCode: detail.cnCode ?? '',
    legacyId: detail.legacyId ?? '',
    slug: detail.slug,
    primaryCategoryId: detail.categoryId,
    additionalCategoryIds: detail.additionalCategoryIds,
    description: detail.description ?? '',
    metaTitle: detail.metaTitle ?? '',
    metaDesc: detail.metaDesc ?? '',
    pricingMode: detail.pricingMode,
    simpleSku: '',
    simpleEan: '',
    simpleStock: '',
    simplePrice: '',
    variants: [createVariantDraft()],
    characteristics: detail.characteristics.entries?.length
      ? characteristicsFormFromEntries(characteristicDefinitions, detail.characteristics.entries)
      : characteristicsFormFromLegacy(characteristicDefinitions, detail.characteristics),
    images: detail.images.map((url, index) => ({
      clientId: crypto.randomUUID(),
      url,
      isMain: index === 0,
    })),
    isPublished: detail.isPublished,
  }

  if (detail.pricingMode === 'simple') {
    const variant = detail.variants[0]
    if (variant) {
      form.simpleSku = variant.sku ?? ''
      form.simpleEan = variant.ean ?? ''
      form.simpleStock = String(variant.stock)
      form.simplePrice = String(variant.price)
      form.variants = [mapVariantToDraft(variant)]
    }
    return form
  }

  form.variants =
    detail.variants.length > 0
      ? detail.variants.map((variant) => {
          const selections: Record<string, string> = {}
          for (const attribute of variantAttributes) {
            const valueId = variant.attributeValueIds.find((id) =>
              attribute.values.some((value) => value.id === id),
            )
            if (valueId) selections[attribute.id] = valueId
          }
          return mapVariantToDraft(variant, { selections })
        })
      : [createVariantDraft()]

  return form
}

export async function updateProduct(
  id: string,
  payload: ProductPayload,
): Promise<BackstageProductDetail> {
  const res = await fetch(`/api/backstage/products/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export type SavedProductImage = {
  url: string
  isMain: boolean
}

export async function updateProductImages(
  id: string,
  images: Array<{ url: string; isMain?: boolean }>,
): Promise<SavedProductImage[]> {
  const res = await fetch(`/api/backstage/products/${id}/images`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      images: images.map((image) => ({
        url: image.url,
        isMain: image.isMain,
      })),
    }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
