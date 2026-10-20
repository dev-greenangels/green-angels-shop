import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { PromoEligibleAudience, PromoEligiblePriceSource } from './pricing'
import {
  buildPromoScopeSnapshot,
  hasFieldErrors,
  mapWithConcurrency,
  validateCustomerGroupDraft,
  validateDiscountRuleDraft,
  validatePromoCodeDraft,
} from './promotions-form'
import { flattenCategoryTreeForPicker } from './promo-scope-selection'

describe('validateCustomerGroupDraft', () => {
  it('requires name + slug', () => {
    assert.ok(hasFieldErrors(validateCustomerGroupDraft({ name: '', slug: '' })))
    assert.ok(!hasFieldErrors(validateCustomerGroupDraft({ name: 'VIP', slug: 'vip' })))
    assert.equal(validateCustomerGroupDraft({ name: 'VIP', slug: 'Bad Slug' }).slug, 'errSlug')
  })
})

describe('validateDiscountRuleDraft', () => {
  it('requires tiers and rejects duplicates / below-threshold qty', () => {
    const base = {
      name: 'Rule',
      quantityTiers: [{ minQuantity: 5, type: 'PERCENT' as const, value: 5 }],
      target: 'ALL_PRODUCTS' as const,
      categoryIds: [] as string[],
      productItems: [] as Array<{ id: string; label: string }>,
      variantItems: [] as Array<{ id: string; label: string }>,
      eligibleAudiences: ['RETAIL'] as PromoEligibleAudience[],
      buyerRegistrationScope: 'ANY' as const,
      userIds: [] as string[],
    }
    assert.ok(!hasFieldErrors(validateDiscountRuleDraft(base)))
    assert.equal(validateDiscountRuleDraft({ ...base, quantityTiers: [] }).value, 'errTiersRequired')
    assert.equal(
      validateDiscountRuleDraft({
        ...base,
        quantityTiers: [
          { minQuantity: 5, value: 5 },
          { minQuantity: 5, value: 10 },
        ],
      }).value,
      'errTierDuplicate',
    )
    assert.equal(
      validateDiscountRuleDraft({
        ...base,
        quantityTiers: [{ minQuantity: 0, value: 5 }],
      }).value,
      'errTierMinQuantity',
    )
    assert.equal(
      validateDiscountRuleDraft({ ...base, eligibleAudiences: [] }).audience,
      'needOneAudience',
    )
    assert.equal(
      validateDiscountRuleDraft({
        ...base,
        eligibleAudiences: ['WHOLESALER'],
        buyerRegistrationScope: 'GUEST_ONLY',
      }).registration,
      'errGuestOnlyNeedsRetail',
    )
    assert.equal(
      validateDiscountRuleDraft({
        ...base,
        target: 'PRODUCT',
        productItems: [],
      }).target,
      'errProduct',
    )
  })
})

describe('validatePromoCodeDraft', () => {
  it('gift / stacking / cart FIXED semantics stay client-validated', () => {
    const base = {
      code: 'ABC',
      name: 'Promo',
      discountEnabled: true,
      giftEnabled: false,
      value: '10',
      giftVariantCount: 0,
      stackingMode: 'NONE' as const,
      compatiblePromoCodeIds: [] as string[],
      target: 'ALL_PRODUCTS' as const,
      categoryIds: [] as string[],
      productItems: [] as Array<{ id: string; label: string }>,
      variantItems: [] as Array<{ id: string; label: string }>,
      eligibleAudiences: ['RETAIL'] as PromoEligibleAudience[],
      eligiblePriceSources: ['ALL'] as PromoEligiblePriceSource[],
      buyerRegistrationScope: 'ANY' as const,
      userIds: [] as string[],
    }
    assert.ok(!hasFieldErrors(validatePromoCodeDraft(base)))
    assert.equal(
      validatePromoCodeDraft({
        ...base,
        discountEnabled: false,
        giftEnabled: false,
      }).benefit,
      'errBenefitRequired',
    )
    assert.equal(
      validatePromoCodeDraft({
        ...base,
        stackingMode: 'ALLOWLIST',
        compatiblePromoCodeIds: [],
      }).stacking,
      'errStackingAllow',
    )
    assert.equal(
      validatePromoCodeDraft({
        ...base,
        discountEnabled: false,
        giftEnabled: true,
        giftVariantCount: 0,
      }).gift,
      'errGift',
    )
  })
})

describe('buildPromoScopeSnapshot / mapWithConcurrency', () => {
  it('keeps product exclude separate from variants (payload regression)', () => {
    const options = flattenCategoryTreeForPicker([
      { id: 'root', name: 'Root', children: [{ id: 'leaf', name: 'Leaf', children: [] }] },
    ])
    const payload = buildPromoScopeSnapshot({
      target: 'CATEGORY',
      categoryIds: ['root', 'leaf'],
      categoryOptions: options,
      productItems: [],
      variantItems: [],
      excludeCategoryIds: [],
      excludeProducts: [{ id: 'prod-1', label: 'P' }],
      excludeVariants: [{ id: 'var-1', label: 'V' }],
    })
    assert.deepEqual(payload.targetIds, ['root'])
    assert.deepEqual(payload.excludeProductIds, ['prod-1'])
    assert.deepEqual(payload.excludeVariantIds, ['var-1'])
  })

  it('limits concurrency', async () => {
    let active = 0
    let maxActive = 0
    const ids = [1, 2, 3, 4, 5]
    const out = await mapWithConcurrency(ids, 2, async (n) => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise((r) => setTimeout(r, 5))
      active -= 1
      return n * 2
    })
    assert.deepEqual(out, [2, 4, 6, 8, 10])
    assert.ok(maxActive <= 2)
  })
})
