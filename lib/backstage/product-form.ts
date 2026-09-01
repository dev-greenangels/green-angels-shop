import {
  emptyCharacteristicsForm,
  type ProductCharacteristicsFormState,
} from '@/lib/backstage/characteristics'
import {
  createQuantityPriceDraft,
  type VariantQuantityPriceDraft,
} from '@/lib/backstage/variant-pricing'

export type PricingMode = 'simple' | 'variants'

export type ProductImageDraft = {
  clientId: string
  url: string
  isMain: boolean
}

import type { VariantAttributeSelections } from '@/lib/backstage/variant-selections'

export type ProductVariantDraft = {
  clientId: string
  id?: string
  selections: VariantAttributeSelections
  sku: string
  ean: string
  stock: string
  price: string
  legacyId: string
  availableFrom: string
  salesUnitId: string
  weight: string
  lengthCm: string
  widthCm: string
  heightCm: string
  quantityPrices: VariantQuantityPriceDraft[]
}

export type ProductFormState = {
  id?: string
  name: string
  latinName: string
  cnCode: string
  legacyId: string
  slug: string
  primaryCategoryId: string
  additionalCategoryIds: string[]
  description: string
  metaTitle: string
  metaDesc: string
  pricingMode: PricingMode
  simpleSku: string
  simpleEan: string
  simpleStock: string
  simplePrice: string
  variants: ProductVariantDraft[]
  images: ProductImageDraft[]
  characteristics: ProductCharacteristicsFormState
  isPublished: boolean
}

export function createVariantDraft(partial?: Partial<ProductVariantDraft>): ProductVariantDraft {
  return {
    clientId: crypto.randomUUID(),
    selections: {},
    sku: '',
    ean: '',
    stock: '',
    price: '',
    legacyId: '',
    availableFrom: '',
    salesUnitId: '',
    weight: '',
    lengthCm: '',
    widthCm: '',
    heightCm: '',
    quantityPrices: [],
    ...partial,
  }
}

export { createQuantityPriceDraft }

export const emptyProductForm = (): ProductFormState => ({
  name: '',
  latinName: '',
  cnCode: '',
  legacyId: '',
  slug: '',
  primaryCategoryId: '',
  additionalCategoryIds: [],
  description: '',
  metaTitle: '',
  metaDesc: '',
  pricingMode: 'simple',
  simpleSku: '',
  simpleEan: '',
  simpleStock: '',
  simplePrice: '',
  variants: [createVariantDraft()],
  images: [],
  characteristics: {},
  isPublished: false,
})

function normalizeProductFormForCompare(form: ProductFormState) {
  return {
    id: form.id,
    name: form.name,
    latinName: form.latinName,
    cnCode: form.cnCode.replace(/\s/g, '').trim(),
    legacyId: form.legacyId,
    slug: form.slug,
    primaryCategoryId: form.primaryCategoryId,
    additionalCategoryIds: [...form.additionalCategoryIds].sort(),
    description: form.description,
    metaTitle: form.metaTitle,
    metaDesc: form.metaDesc,
    pricingMode: form.pricingMode,
    simpleSku: form.simpleSku,
    simpleEan: form.simpleEan,
    simpleStock: form.simpleStock,
    simplePrice: form.simplePrice,
    variants: form.variants.map(({ clientId: _clientId, ...variant }) => variant),
    images: form.images.map(({ clientId: _clientId, url, isMain }) => ({ url, isMain })),
    characteristics: form.characteristics,
    isPublished: form.isPublished,
  }
}

export function isProductFormDirty(
  current: ProductFormState,
  baseline: ProductFormState,
): boolean {
  return (
    JSON.stringify(normalizeProductFormForCompare(current)) !==
    JSON.stringify(normalizeProductFormForCompare(baseline))
  )
}

export { slugifyCategoryName as slugifyProductName } from '@/lib/backstage/categories'
