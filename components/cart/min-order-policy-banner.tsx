'use client'

import { useEffect, useState } from 'react'

import { MinOrderInfoBanner } from '@/components/cart/min-order-info-banner'
import { useSession } from '@/components/providers/session-provider'
import { resolveMinOrderPolicy } from '@/lib/checkout/min-order-policy'
import {
  fetchPublicSiteSettingsFromApiRoute,
  getCartCheckoutSettings,
} from '@/lib/settings/fetch'

/** Жовтий інфоблок мін. суми з public settings (роздріб / гурт за сесією). */
export function MinOrderPolicyBanner({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { user } = useSession()
  const [policy, setPolicy] = useState<ReturnType<typeof resolveMinOrderPolicy> | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchPublicSiteSettingsFromApiRoute()
      .then((result) => {
        if (cancelled) return
        const cart = getCartCheckoutSettings(result)
        setPolicy(resolveMinOrderPolicy(cart, user?.accountType ?? 'retail'))
      })
      .catch(() => {
        if (!cancelled) setPolicy(null)
      })
    return () => {
      cancelled = true
    }
  }, [user?.accountType])

  if (!policy) return null

  return (
    <MinOrderInfoBanner
      minOrderAmount={policy.minOrderAmount}
      belowMinOrderBehavior={policy.belowMinOrderBehavior}
      belowMinPackagingFee={policy.belowMinPackagingFee}
      className={className}
      compact={compact}
    />
  )
}
