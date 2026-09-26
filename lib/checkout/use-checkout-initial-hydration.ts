'use client'

import { useEffect, useRef, useState } from 'react'

import { useSession } from '@/components/providers/session-provider'
import { fetchCheckoutDraft, startCheckoutDraft } from '@/lib/carts/api'
import { fetchCheckoutSession } from '@/lib/checkout/hydrate-checkout-session'
import {
  mergeCheckoutInitialHydration,
  type CheckoutInitialHydrationResult,
} from '@/lib/checkout/merge-checkout-hydration'
import type { CheckoutMarketRegion } from '@/lib/validation/checkout-form'

/**
 * One-shot coordinated hydration: profile/session then draft overlay.
 * Completes before draft persistence should start; never re-runs after settle.
 */
export function useCheckoutInitialHydration({
  enabled,
  allowedDeliveryMethods,
  allowedPaymentMethods,
  skipSessionIdentity,
  marketRegion,
  onHydrate,
}: {
  enabled: boolean
  allowedDeliveryMethods: string[]
  allowedPaymentMethods: string[]
  /** When true, still load draft but do not re-apply session identity. */
  skipSessionIdentity: boolean
  marketRegion?: CheckoutMarketRegion
  onHydrate: (result: CheckoutInitialHydrationResult) => void
}): { hydrationReady: boolean } {
  const { setUser } = useSession()
  const [hydrationReady, setHydrationReady] = useState(false)
  const startedRef = useRef(false)
  const onHydrateRef = useRef(onHydrate)
  onHydrateRef.current = onHydrate
  const methodsRef = useRef({
    delivery: allowedDeliveryMethods,
    payment: allowedPaymentMethods,
    marketRegion,
  })
  methodsRef.current = {
    delivery: allowedDeliveryMethods,
    payment: allowedPaymentMethods,
    marketRegion,
  }

  useEffect(() => {
    if (!enabled || startedRef.current) return
    startedRef.current = true
    let cancelled = false

    void (async () => {
      void startCheckoutDraft()

      const [session, draftResult] = await Promise.all([
        skipSessionIdentity ? Promise.resolve(null) : fetchCheckoutSession(),
        fetchCheckoutDraft(),
      ])

      if (cancelled) return

      if (session?.user) {
        setUser(session.user)
      }

      const merged = mergeCheckoutInitialHydration({
        session: skipSessionIdentity ? null : session,
        draft: draftResult.draft,
        allowedDeliveryMethods: methodsRef.current.delivery,
        allowedPaymentMethods: methodsRef.current.payment,
        marketRegion: methodsRef.current.marketRegion,
      })

      onHydrateRef.current(merged)
      setHydrationReady(true)
    })().catch(() => {
      if (!cancelled) setHydrationReady(true)
    })

    return () => {
      cancelled = true
    }
    // Once-only when checkout becomes enabled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return { hydrationReady }
}
