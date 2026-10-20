import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { CustomerGroupItem, DiscountRuleItem, PromoCodeItem } from './pricing'
import {
  filterCustomerGroups,
  filterDiscountRules,
  filterPromoCodes,
  isFormDirty,
  promoBenefitParts,
  ruleValueLabel,
  stableStringify,
} from './promotions-list'

const groups: CustomerGroupItem[] = [
  {
    id: 'g1',
    name: 'Wholesale SK',
    slug: 'wholesale-sk',
    description: 'B2B',
    isActive: true,
    usersCount: 2,
    discountRulesCount: 1,
    promoCodesCount: 0,
  },
  {
    id: 'g2',
    name: 'VIP',
    slug: 'vip',
    description: null,
    isActive: false,
    usersCount: 0,
    discountRulesCount: 0,
    promoCodesCount: 1,
  },
]

const rules: DiscountRuleItem[] = [
  {
    id: 'r1',
    name: 'Spring retail',
    target: 'CATEGORY',
    targetId: null,
    targetIds: ['c1'],
    excludeProductIds: [],
    excludeVariantIds: [],
    excludeCategoryIds: [],
    eligibleAudiences: ['RETAIL'],
    buyerRegistrationScope: 'ANY',
    filterCriteria: null,
    quantityTiers: [{ minQuantity: 1, type: 'PERCENT', value: 10 }],
    combinesWithOtherDiscounts: 'BEST_PRICE',
    onlyForRoles: [],
    groupIds: [],
    groups: [],
    userIds: [],
    users: [],
    minCartSubtotal: null,
    startDate: null,
    endDate: null,
    isActive: true,
  },
  {
    id: 'r2',
    name: 'Wholesale all',
    target: 'ALL_PRODUCTS',
    targetId: null,
    targetIds: [],
    excludeProductIds: ['p1'],
    excludeVariantIds: [],
    excludeCategoryIds: [],
    eligibleAudiences: ['WHOLESALER'],
    buyerRegistrationScope: 'REGISTERED_ONLY',
    filterCriteria: null,
    quantityTiers: [{ minQuantity: 5, type: 'PERCENT', value: 5 }],
    combinesWithOtherDiscounts: 'BEST_PRICE',
    onlyForRoles: [],
    groupIds: [],
    groups: [],
    userIds: [],
    users: [],
    minCartSubtotal: 100,
    startDate: '2026-01-01',
    endDate: null,
    isActive: false,
  },
]

const promos: PromoCodeItem[] = [
  {
    id: 'p1',
    code: 'SAVE10',
    name: 'Save ten',
    description: null,
    discountType: 'PERCENT',
    value: 10,
    discountApplicationScope: 'CART_TOTAL',
    combinesWithOtherDiscounts: 'BEST_PRICE',
    stackingMode: 'NONE',
    compatiblePromoCodeIds: [],
    target: 'ALL_PRODUCTS',
    targetId: null,
    targetIds: [],
    excludeProductIds: [],
    excludeVariantIds: [],
    excludeCategoryIds: [],
    eligibleAudiences: ['RETAIL'],
    buyerRegistrationScope: 'ANY',
    eligiblePriceSources: ['ALL'],
    groupIds: [],
    groups: [],
    userIds: [],
    users: [],
    minCartSubtotal: null,
    giftVariantId: null,
    giftQuantity: 1,
    usageLimitTotal: null,
    usageLimitPerUser: null,
    validFrom: null,
    validTo: null,
    isActive: true,
    usagesCount: 3,
  },
  {
    id: 'p2',
    code: 'GIFT',
    name: 'Gift only',
    description: 'free plant',
    discountType: null,
    value: null,
    discountApplicationScope: 'LINE_ITEMS',
    combinesWithOtherDiscounts: 'STACK',
    stackingMode: 'ALL',
    compatiblePromoCodeIds: [],
    target: 'PRODUCT',
    targetId: null,
    targetIds: ['prod1'],
    excludeProductIds: [],
    excludeVariantIds: [],
    excludeCategoryIds: [],
    eligibleAudiences: ['WHOLESALER'],
    buyerRegistrationScope: 'REGISTERED_ONLY',
    eligiblePriceSources: ['GROUP'],
    groupIds: [],
    groups: [],
    userIds: [],
    users: [],
    minCartSubtotal: null,
    giftVariantId: 'var1',
    giftQuantity: 1,
    usageLimitTotal: 10,
    usageLimitPerUser: 1,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    isActive: false,
    usagesCount: 0,
  },
]

describe('filterCustomerGroups', () => {
  it('filters by query + status', () => {
    assert.equal(filterCustomerGroups(groups, { query: 'vip', status: 'all' }).length, 1)
    assert.equal(filterCustomerGroups(groups, { query: '', status: 'active' }).length, 1)
    assert.equal(filterCustomerGroups(groups, { query: 'wholesale', status: 'inactive' }).length, 0)
  })
})

describe('filterDiscountRules', () => {
  it('filters by audience / target / status / query', () => {
    assert.equal(
      filterDiscountRules(rules, {
        query: 'spring',
        status: 'all',
        audience: 'all',
        target: 'all',
      }).length,
      1,
    )
    assert.equal(
      filterDiscountRules(rules, {
        query: '',
        status: 'active',
        audience: 'RETAIL',
        target: 'CATEGORY',
      }).length,
      1,
    )
    assert.equal(
      filterDiscountRules(rules, {
        query: '',
        status: 'all',
        audience: 'WHOLESALER',
        target: 'all',
      }).length,
      1,
    )
  })
})

describe('filterPromoCodes', () => {
  it('filters by code/name and gift/audience', () => {
    assert.equal(
      filterPromoCodes(promos, {
        query: 'save',
        status: 'all',
        audience: 'all',
        target: 'all',
      })[0]?.code,
      'SAVE10',
    )
    assert.equal(
      filterPromoCodes(promos, {
        query: '',
        status: 'inactive',
        audience: 'WHOLESALER',
        target: 'PRODUCT',
      }).length,
      1,
    )
  })
})

describe('labels + dirty', () => {
  it('ruleValueLabel / promoBenefitParts', () => {
    assert.equal(ruleValueLabel(rules[0]), '10%')
    assert.equal(ruleValueLabel(rules[1]), '5→5%')
    assert.deepEqual(promoBenefitParts(promos[1]), {
      percent: undefined,
      fixed: undefined,
      gift: true,
    })
  })

  it('isFormDirty compares stable snapshots', () => {
    const base = stableStringify({ a: 1, b: 2 })
    assert.equal(isFormDirty(base, { b: 2, a: 1 }), false)
    assert.equal(isFormDirty(base, { a: 1, b: 3 }), true)
    assert.equal(isFormDirty(null, { a: 1 }), false)
  })
})
