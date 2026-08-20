import type { AccountType } from '@/lib/auth/types'
import type { BelowMinOrderBehavior, CartCheckoutSettings } from '@/lib/settings/types'

export type ResolvedMinOrderPolicy = {
  minOrderAmount: number | null
  belowMinOrderBehavior: BelowMinOrderBehavior
  belowMinPackagingFee: number
  isWholesaler: boolean
}

/** Роздріб (гість / USER) vs гурт (WHOLESALER) — поля cart.checkout. */
export function resolveMinOrderPolicy(
  settings: CartCheckoutSettings,
  accountType: AccountType | null | undefined = 'retail',
): ResolvedMinOrderPolicy {
  const isWholesaler = accountType === 'wholesale'
  if (isWholesaler) {
    const amount = settings.wholesalerMinOrderAmount
    return {
      isWholesaler: true,
      minOrderAmount: amount != null && amount > 0 ? amount : null,
      belowMinOrderBehavior: settings.wholesalerBelowMinOrderBehavior,
      belowMinPackagingFee: Math.max(0, settings.wholesalerBelowMinPackagingFee || 0),
    }
  }
  const amount = settings.minOrderAmount
  return {
    isWholesaler: false,
    minOrderAmount: amount != null && amount > 0 ? amount : null,
    belowMinOrderBehavior: settings.belowMinOrderBehavior,
    belowMinPackagingFee: Math.max(0, settings.belowMinPackagingFee || 0),
  }
}
