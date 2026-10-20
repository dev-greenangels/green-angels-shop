export type CustomerGroupItem = {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  usersCount: number
  discountRulesCount: number
  promoCodesCount: number
}

export type DiscountValueType = 'PERCENT' | 'FIXED' | 'FIXED_PRICE'
export type PromoEligibleAudience = 'RETAIL' | 'WHOLESALER'
export type BuyerRegistrationScope = 'ANY' | 'GUEST_ONLY' | 'REGISTERED_ONLY'

export type DiscountRuleQuantityTier = {
  id?: string
  minQuantity: number
  type: DiscountValueType
  value: number
  sortOrder?: number
}

export type DiscountRuleFilterCriteria = {
  attributeGroups?: Array<{ attributeId: string; valueIds: string[] }>
  characteristicGroups?: Array<{
    characteristicId: string
    optionIds?: string[]
    numberMin?: number | null
    numberMax?: number | null
  }>
}

export type DiscountRuleItem = {
  id: string
  name: string
  target: 'ALL_PRODUCTS' | 'CATEGORY' | 'PRODUCT' | 'VARIANT'
  targetId: string | null
  targetIds: string[]
  excludeProductIds: string[]
  excludeVariantIds: string[]
  excludeCategoryIds: string[]
  eligibleAudiences: PromoEligibleAudience[]
  buyerRegistrationScope: BuyerRegistrationScope
  filterCriteria: DiscountRuleFilterCriteria | null
  quantityTiers: DiscountRuleQuantityTier[]
  targetLabels?: Record<string, string>
  excludeLabels?: Record<string, string>
  combinesWithOtherDiscounts: 'BEST_PRICE' | 'STACK' | 'MAX_OF'
  onlyForRoles: string[]
  groupIds: string[]
  groups: Array<{ id: string; name: string; slug: string }>
  userIds: string[]
  users: Array<{
    id: string
    firstName: string | null
    lastName: string | null
    phone: string | null
    email: string | null
  }>
  minCartSubtotal: number | null
  startDate: string | null
  endDate: string | null
  isActive: boolean
}

export type DiscountRulePreviewResult = {
  productVariantId: string
  quantity: number
  audience: PromoEligibleAudience
  /** True only when a concrete WHOLESALER with flexiFirmaKod was previewed. */
  companyPriceExact?: boolean
  previewUserId?: string | null
  productCardUnitPrice: number | null
  salesPrice: {
    unitPrice: number
    scope: string
    appliedMinQuantity: number
  } | null
  retailOffer: {
    unitPrice: number
    baseUnitPrice: number
    basePriceSource: string
    appliedSource: string
    appliedLabel: string | null
  } | null
  wholesaleOffer: {
    unitPrice: number
    baseUnitPrice: number
    basePriceSource: string
    appliedSource: string
    appliedLabel: string | null
  } | null
  finalUnitPrice: number
  winner: 'retail' | 'wholesale'
  candidateRules: Array<{
    id: string
    name: string
    side: 'retail' | 'wholesale'
    unitPrice: number
  }>
}

export type VariantDiscountRulesResponse = {
  variantId: string
  directRules: DiscountRuleItem[]
  massRules: DiscountRuleItem[]
}

export type PromoEligiblePriceSource = 'ALL' | 'GROUP' | 'COMPANY'
export type PromoApplicationScope = 'PRODUCTS' | 'PRODUCTS_AND_SHIPPING' | 'SHIPPING_ONLY'

export type PromoCodeItem = {
  id: string
  code: string
  name: string
  description: string | null
  discountType: 'PERCENT' | 'FIXED' | null
  value: number | null
  discountApplicationScope: 'LINE_ITEMS' | 'CART_TOTAL'
  applicationScope?: PromoApplicationScope
  combinesWithOtherDiscounts: 'STACK' | 'BEST_PRICE'
  stackingMode: 'NONE' | 'ALL' | 'ALLOWLIST' | 'DENYLIST'
  compatiblePromoCodeIds: string[]
  target: 'ALL_PRODUCTS' | 'CATEGORY' | 'PRODUCT' | 'VARIANT'
  targetId: string | null
  targetIds: string[]
  excludeProductIds: string[]
  excludeVariantIds: string[]
  excludeCategoryIds: string[]
  eligibleAudiences?: PromoEligibleAudience[]
  buyerRegistrationScope?: BuyerRegistrationScope
  eligiblePriceSources?: PromoEligiblePriceSource[]
  groupIds: string[]
  groups: Array<{ id: string; name: string; slug: string }>
  userIds: string[]
  users: Array<{
    id: string
    firstName: string | null
    lastName: string | null
    phone: string | null
    email: string | null
  }>
  minCartSubtotal: number | null
  giftVariantId: string | null
  giftVariantLabel?: string | null
  giftQuantity: number
  usageLimitTotal: number | null
  usageLimitPerUser: number | null
  validFrom: string | null
  validTo: string | null
  isActive: boolean
  usagesCount: number
  targetLabels?: Record<string, string>
  excludeLabels?: Record<string, string>
}

async function parseError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}))
  return typeof data.error === 'string'
    ? data.error
    : typeof data.message === 'string'
      ? data.message
      : 'Помилка запиту.'
}

function normalizeDiscountRule(raw: Record<string, unknown>): DiscountRuleItem {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    target: (raw.target as DiscountRuleItem['target']) ?? 'ALL_PRODUCTS',
    targetId: (raw.targetId as string | null) ?? null,
    targetIds: Array.isArray(raw.targetIds) ? (raw.targetIds as string[]) : [],
    excludeProductIds: Array.isArray(raw.excludeProductIds)
      ? (raw.excludeProductIds as string[])
      : [],
    excludeVariantIds: Array.isArray(raw.excludeVariantIds)
      ? (raw.excludeVariantIds as string[])
      : [],
    excludeCategoryIds: Array.isArray(raw.excludeCategoryIds)
      ? (raw.excludeCategoryIds as string[])
      : [],
    eligibleAudiences: Array.isArray(raw.eligibleAudiences)
      ? (raw.eligibleAudiences as PromoEligibleAudience[])
      : [],
    buyerRegistrationScope:
      raw.buyerRegistrationScope === 'GUEST_ONLY' ||
      raw.buyerRegistrationScope === 'REGISTERED_ONLY'
        ? raw.buyerRegistrationScope
        : 'ANY',
    filterCriteria: (raw.filterCriteria as DiscountRuleFilterCriteria | null) ?? null,
    quantityTiers: Array.isArray(raw.quantityTiers)
      ? (raw.quantityTiers as DiscountRuleQuantityTier[])
      : [],
    targetLabels: (raw.targetLabels as Record<string, string>) ?? {},
    excludeLabels: (raw.excludeLabels as Record<string, string>) ?? {},
    combinesWithOtherDiscounts:
      (raw.combinesWithOtherDiscounts as DiscountRuleItem['combinesWithOtherDiscounts']) ??
      'BEST_PRICE',
    onlyForRoles: Array.isArray(raw.onlyForRoles) ? (raw.onlyForRoles as string[]) : [],
    groupIds: Array.isArray(raw.groupIds) ? (raw.groupIds as string[]) : [],
    groups: Array.isArray(raw.groups)
      ? (raw.groups as DiscountRuleItem['groups'])
      : [],
    userIds: Array.isArray(raw.userIds) ? (raw.userIds as string[]) : [],
    users: Array.isArray(raw.users) ? (raw.users as DiscountRuleItem['users']) : [],
    minCartSubtotal: raw.minCartSubtotal != null ? Number(raw.minCartSubtotal) : null,
    startDate: (raw.startDate as string | null) ?? null,
    endDate: (raw.endDate as string | null) ?? null,
    isActive: Boolean(raw.isActive),
  }
}

export async function fetchCustomerGroups(): Promise<CustomerGroupItem[]> {
  const res = await fetch('/api/backstage/customer-groups', { cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function saveCustomerGroup(
  payload: Partial<CustomerGroupItem> & { name: string; slug: string },
  id?: string,
) {
  const res = await fetch(id ? `/api/backstage/customer-groups/${id}` : '/api/backstage/customer-groups', {
    method: id ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteCustomerGroup(id: string) {
  const res = await fetch(`/api/backstage/customer-groups/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseError(res))
}

export async function fetchDiscountRules(): Promise<DiscountRuleItem[]> {
  const res = await fetch('/api/backstage/discount-rules', { cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  const data = await res.json()
  return Array.isArray(data) ? data.map((row) => normalizeDiscountRule(row)) : []
}

export async function fetchDiscountRulesForVariant(
  variantId: string,
): Promise<VariantDiscountRulesResponse> {
  const res = await fetch(`/api/backstage/discount-rules/for-variant/${variantId}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = await res.json()
  return {
    variantId: String(data.variantId ?? variantId),
    directRules: Array.isArray(data.directRules)
      ? data.directRules.map((row: Record<string, unknown>) => normalizeDiscountRule(row))
      : [],
    massRules: Array.isArray(data.massRules)
      ? data.massRules.map((row: Record<string, unknown>) => normalizeDiscountRule(row))
      : [],
  }
}

export async function previewDiscountRule(payload: {
  productVariantId: string
  quantity: number
  audience: PromoEligibleAudience
  registrationPreview?: 'GUEST' | 'REGISTERED'
  previewUserId?: string
  draftRule?: Record<string, unknown>
}): Promise<DiscountRulePreviewResult> {
  const res = await fetch('/api/backstage/discount-rules/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function saveDiscountRule(payload: Record<string, unknown>, id?: string) {
  const res = await fetch(id ? `/api/backstage/discount-rules/${id}` : '/api/backstage/discount-rules', {
    method: id ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return normalizeDiscountRule(await res.json())
}

export async function deleteDiscountRule(id: string) {
  const res = await fetch(`/api/backstage/discount-rules/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseError(res))
}

export async function fetchPromoCodes(): Promise<PromoCodeItem[]> {
  const res = await fetch('/api/backstage/promo-codes', { cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function savePromoCode(payload: Record<string, unknown>, id?: string) {
  const res = await fetch(id ? `/api/backstage/promo-codes/${id}` : '/api/backstage/promo-codes', {
    method: id ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deletePromoCode(id: string) {
  const res = await fetch(`/api/backstage/promo-codes/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseError(res))
}
