/**
 * Client-side list helpers for Backoffice Promotions tabs.
 * Lists are fetched in full from existing APIs (no server pagination).
 */

import type {
  CustomerGroupItem,
  DiscountRuleItem,
  PromoCodeItem,
  PromoEligibleAudience,
} from '@/lib/backstage/pricing'

export type StatusFilter = 'all' | 'active' | 'inactive'
export type AudienceFilter = 'all' | 'RETAIL' | 'WHOLESALER' | 'LEGACY'
export type TargetFilter = 'all' | DiscountRuleItem['target']

function includesQuery(haystack: string, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return haystack.toLowerCase().includes(q)
}

export function filterCustomerGroups(
  items: CustomerGroupItem[],
  opts: { query: string; status: StatusFilter },
): CustomerGroupItem[] {
  return items.filter((group) => {
    if (opts.status === 'active' && !group.isActive) return false
    if (opts.status === 'inactive' && group.isActive) return false
    const blob = [group.name, group.slug, group.description ?? ''].join(' ')
    return includesQuery(blob, opts.query)
  })
}

export function filterDiscountRules(
  items: DiscountRuleItem[],
  opts: {
    query: string
    status: StatusFilter
    audience: AudienceFilter
    target: TargetFilter
  },
): DiscountRuleItem[] {
  return items.filter((rule) => {
    if (opts.status === 'active' && !rule.isActive) return false
    if (opts.status === 'inactive' && rule.isActive) return false
    if (opts.target !== 'all' && rule.target !== opts.target) return false
    if (opts.audience !== 'all') {
      const audiences = rule.eligibleAudiences ?? []
      if (opts.audience === 'LEGACY') {
        if (audiences.length > 0) return false
      } else if (!audiences.includes(opts.audience)) {
        return false
      }
    }
    const blob = [
      rule.name,
      rule.target,
      ruleValueLabel(rule),
      ...(rule.groups?.map((g) => g.name) ?? []),
    ].join(' ')
    return includesQuery(blob, opts.query)
  })
}

export function filterPromoCodes(
  items: PromoCodeItem[],
  opts: {
    query: string
    status: StatusFilter
    audience: AudienceFilter
    target: TargetFilter
  },
): PromoCodeItem[] {
  return items.filter((promo) => {
    if (opts.status === 'active' && !promo.isActive) return false
    if (opts.status === 'inactive' && promo.isActive) return false
    if (opts.target !== 'all' && promo.target !== opts.target) return false
    if (opts.audience !== 'all') {
      const audiences = promo.eligibleAudiences ?? []
      if (opts.audience === 'LEGACY') {
        if (audiences.length > 0) return false
      } else if (!audiences.includes(opts.audience as PromoEligibleAudience)) {
        return false
      }
    }
    const blob = [
      promo.code,
      promo.name,
      promo.description ?? '',
      promo.discountType ?? '',
      promo.target,
      ...(promo.groups?.map((g) => g.name) ?? []),
    ].join(' ')
    return includesQuery(blob, opts.query)
  })
}

export function ruleExclusionsCount(rule: DiscountRuleItem): number {
  return (
    (rule.excludeProductIds?.length ?? 0) +
    (rule.excludeVariantIds?.length ?? 0) +
    (rule.excludeCategoryIds?.length ?? 0)
  )
}

export function promoExclusionsCount(promo: PromoCodeItem): number {
  return (
    (promo.excludeProductIds?.length ?? 0) +
    (promo.excludeVariantIds?.length ?? 0) +
    (promo.excludeCategoryIds?.length ?? 0)
  )
}

export function formatDateRange(
  from: string | null | undefined,
  to: string | null | undefined,
): string {
  const a = from?.slice(0, 10) ?? ''
  const b = to?.slice(0, 10) ?? ''
  if (!a && !b) return ''
  return `${a || '…'} — ${b || '…'}`
}

function formatRuleStepValue(
  type: DiscountRuleItem['quantityTiers'][number]['type'],
  value: number,
): string {
  if (type === 'PERCENT') return `${value}%`
  if (type === 'FIXED_PRICE') return `${value} €/u`
  return `−${value} €`
}

/** Quantity tiers only, e.g. `5→5% · 10→10%` or single `5%` when one tier @1. */
export function ruleValueLabel(rule: DiscountRuleItem): string {
  const steps = [...(rule.quantityTiers ?? [])]
    .filter((tier) => tier.minQuantity >= 1 && tier.value > 0)
    .sort((a, b) => a.minQuantity - b.minQuantity)
    .map((tier) => ({
      minQuantity: tier.minQuantity,
      label: formatRuleStepValue(tier.type, tier.value),
    }))
  if (!steps.length) return '—'
  if (steps.length === 1 && steps[0]!.minQuantity === 1) return steps[0]!.label
  return steps.map((step) => `${step.minQuantity}→${step.label}`).join(' · ')
}

export function promoBenefitParts(promo: PromoCodeItem): {
  percent?: number
  fixed?: number
  gift: boolean
} {
  return {
    percent:
      promo.discountType === 'PERCENT' && promo.value != null ? promo.value : undefined,
    fixed: promo.discountType === 'FIXED' && promo.value != null ? promo.value : undefined,
    gift: Boolean(promo.giftVariantId),
  }
}

/** Stable JSON for dirty-form comparison. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.keys(v as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = (v as Record<string, unknown>)[key]
          return acc
        }, {})
    }
    return v
  })
}

export function isFormDirty(baseline: string | null, current: unknown): boolean {
  if (baseline == null) return false
  return baseline !== stableStringify(current)
}
