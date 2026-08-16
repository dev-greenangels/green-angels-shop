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

export type DiscountRuleItem = {
  id: string
  name: string
  type: 'PERCENT' | 'FIXED'
  value: number
  target: 'ALL_PRODUCTS' | 'CATEGORY' | 'PRODUCT' | 'VARIANT'
  targetId: string | null
  targetIds: string[]
  excludeProductIds: string[]
  excludeVariantIds: string[]
  excludeCategoryIds: string[]
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

export type PromoCodeItem = {
  id: string
  code: string
  name: string
  description: string | null
  discountType: 'PERCENT' | 'FIXED' | null
  value: number | null
  discountApplicationScope: 'LINE_ITEMS' | 'CART_TOTAL'
  combinesWithOtherDiscounts: 'STACK' | 'BEST_PRICE'
  stackingMode: 'NONE' | 'ALL' | 'ALLOWLIST' | 'DENYLIST'
  compatiblePromoCodeIds: string[]
  target: 'ALL_PRODUCTS' | 'CATEGORY' | 'PRODUCT' | 'VARIANT'
  targetId: string | null
  targetIds: string[]
  excludeProductIds: string[]
  excludeVariantIds: string[]
  excludeCategoryIds: string[]
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
  return Array.isArray(data) ? data : []
}

export async function saveDiscountRule(payload: Record<string, unknown>, id?: string) {
  const res = await fetch(id ? `/api/backstage/discount-rules/${id}` : '/api/backstage/discount-rules', {
    method: id ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
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
