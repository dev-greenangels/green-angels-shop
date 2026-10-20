import type {
  BuyerRegistrationScope,
  DiscountValueType,
  PromoEligibleAudience,
  PromoEligiblePriceSource,
} from '@/lib/backstage/pricing'
import { buildScopePayload, type ScopeCategoryOption, type ScopeSelectedItem } from '@/lib/backstage/promo-scope-selection'

export type PromoFormFieldErrors = Partial<
  Record<
    | 'name'
    | 'code'
    | 'value'
    | 'target'
    | 'audience'
    | 'priceSources'
    | 'registration'
    | 'stacking'
    | 'gift'
    | 'benefit'
    | 'slug',
    string
  >
>

export type DiscountFormFieldErrors = Partial<
  Record<'name' | 'value' | 'target' | 'audience' | 'registration', string>
>

export type GroupFormFieldErrors = Partial<Record<'name' | 'slug', string>>

export function validateCustomerGroupDraft(input: {
  name: string
  slug: string
}): GroupFormFieldErrors {
  const errors: GroupFormFieldErrors = {}
  if (!input.name.trim() || input.name.trim().length < 2) errors.name = 'errName'
  if (!input.slug.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(input.slug.trim())) {
    errors.slug = 'errSlug'
  }
  return errors
}

export function validateDiscountRuleDraft(input: {
  name: string
  quantityTiers: Array<{ minQuantity: number; type?: DiscountValueType; value: number }>
  target: 'ALL_PRODUCTS' | 'CATEGORY' | 'PRODUCT' | 'VARIANT'
  categoryIds: string[]
  productItems: ScopeSelectedItem[]
  variantItems: ScopeSelectedItem[]
  eligibleAudiences: PromoEligibleAudience[]
  buyerRegistrationScope: BuyerRegistrationScope
  userIds: string[]
}): DiscountFormFieldErrors {
  const errors: DiscountFormFieldErrors = {}
  if (!input.name.trim() || input.name.trim().length < 2) errors.name = 'errName'

  const tiers = input.quantityTiers ?? []
  if (tiers.length === 0) {
    errors.value = 'errTiersRequired'
  } else {
    const mins = tiers.map((tier) => tier.minQuantity)
    if (mins.some((min) => !Number.isFinite(min) || min < 1)) {
      errors.value = 'errTierMinQuantity'
    } else if (new Set(mins).size !== mins.length) {
      errors.value = 'errTierDuplicate'
    } else if (
      tiers.some(
        (tier) =>
          !Number.isFinite(tier.value) ||
          tier.value <= 0 ||
          (tier.type === 'PERCENT' && tier.value > 100),
      )
    ) {
      errors.value = 'errTierValue'
    }
  }

  if (input.eligibleAudiences.length === 0) errors.audience = 'needOneAudience'
  if (
    input.buyerRegistrationScope === 'GUEST_ONLY' &&
    !input.eligibleAudiences.includes('RETAIL')
  ) {
    errors.registration = 'errGuestOnlyNeedsRetail'
  }
  if (input.buyerRegistrationScope === 'GUEST_ONLY' && input.userIds.length > 0) {
    errors.registration = 'errGuestOnlyNoAllowlist'
  }
  if (input.target === 'CATEGORY' && input.categoryIds.length === 0) {
    errors.target = 'errCategory'
  }
  if (input.target === 'PRODUCT' && input.productItems.length === 0) {
    errors.target = 'errProduct'
  }
  if (input.target === 'VARIANT' && input.variantItems.length === 0) {
    errors.target = 'errVariant'
  }
  return errors
}

export function validatePromoCodeDraft(input: {
  code: string
  name: string
  discountEnabled: boolean
  giftEnabled: boolean
  value: string
  giftVariantCount: number
  stackingMode: 'NONE' | 'ALL' | 'ALLOWLIST' | 'DENYLIST'
  compatiblePromoCodeIds: string[]
  target: 'ALL_PRODUCTS' | 'CATEGORY' | 'PRODUCT' | 'VARIANT'
  categoryIds: string[]
  productItems: ScopeSelectedItem[]
  variantItems: ScopeSelectedItem[]
  eligibleAudiences: PromoEligibleAudience[]
  eligiblePriceSources: PromoEligiblePriceSource[]
  buyerRegistrationScope: BuyerRegistrationScope
  userIds: string[]
}): PromoFormFieldErrors {
  const errors: PromoFormFieldErrors = {}
  if (!input.code.trim()) errors.code = 'errCode'
  if (!input.name.trim()) errors.name = 'errName'
  if (!input.discountEnabled && !input.giftEnabled) errors.benefit = 'errBenefitRequired'
  if (input.discountEnabled && (!input.value.trim() || Number(input.value) <= 0)) {
    errors.value = 'errValue'
  }
  if (input.giftEnabled && input.giftVariantCount === 0) errors.gift = 'errGift'
  if (
    (input.stackingMode === 'ALLOWLIST' || input.stackingMode === 'DENYLIST') &&
    input.compatiblePromoCodeIds.length === 0
  ) {
    errors.stacking =
      input.stackingMode === 'DENYLIST' ? 'errStackingDeny' : 'errStackingAllow'
  }
  if (input.eligibleAudiences.length === 0) errors.audience = 'needOneAudience'
  if (input.eligiblePriceSources.length === 0) errors.priceSources = 'needOneSource'
  if (
    input.buyerRegistrationScope === 'GUEST_ONLY' &&
    !input.eligibleAudiences.includes('RETAIL')
  ) {
    errors.registration = 'errGuestOnlyNeedsRetail'
  }
  if (input.buyerRegistrationScope === 'GUEST_ONLY' && input.userIds.length > 0) {
    errors.registration = 'errGuestOnlyNoAllowlist'
  }
  if (input.target === 'CATEGORY' && input.categoryIds.length === 0) {
    errors.target = 'errCategory'
  }
  if (input.target === 'PRODUCT' && input.productItems.length === 0) {
    errors.target = 'errProduct'
  }
  if (input.target === 'VARIANT' && input.variantItems.length === 0) {
    errors.target = 'errVariant'
  }
  return errors
}

export function buildPromoScopeSnapshot(input: {
  target: 'ALL_PRODUCTS' | 'CATEGORY' | 'PRODUCT' | 'VARIANT'
  categoryIds: string[]
  categoryOptions: ScopeCategoryOption[]
  productItems: ScopeSelectedItem[]
  variantItems: ScopeSelectedItem[]
  excludeCategoryIds: string[]
  excludeProducts: ScopeSelectedItem[]
  excludeVariants: ScopeSelectedItem[]
}) {
  return buildScopePayload(input)
}

/** Run async mappers with a concurrency cap (frontend-only). */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const limit = Math.max(1, Math.floor(concurrency))
  const results: R[] = new Array(items.length)
  let next = 0

  async function worker() {
    while (next < items.length) {
      const index = next
      next += 1
      results[index] = await mapper(items[index], index)
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

export function hasFieldErrors(errors: Record<string, string | undefined>): boolean {
  return Object.keys(errors).length > 0
}
