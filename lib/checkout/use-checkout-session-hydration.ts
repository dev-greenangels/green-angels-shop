'use client'

import { useEffect, useRef } from 'react'

import { useSession } from '@/components/providers/session-provider'
import type { CheckoutFormValues, CheckoutIdentificationState } from '@/lib/validation/checkout-form'

import {
  buildCheckoutHydrationFromSession,
  fetchCheckoutSession,
} from './hydrate-checkout-session'

export function useCheckoutSessionHydration({
  mounted,
  returningVerified,
  onHydrate,
  onSettled,
}: {
  mounted: boolean
  returningVerified: boolean
  onHydrate: (payload: {
    formPatch: Partial<CheckoutFormValues>
    identification: CheckoutIdentificationState
    personalDiscountPercent: number
  }) => void
  onSettled?: (key: string) => void
}) {
  const { user, setUser } = useSession()
  const hydrateKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!mounted || returningVerified) return

    const key = user?.id ?? user?.email ?? '__guest__'
    if (hydrateKeyRef.current === key) return
    hydrateKeyRef.current = key

    let cancelled = false

    void fetchCheckoutSession()
      .then((data) => {
        if (cancelled || !data) return
        setUser(data.user)
        onHydrate(buildCheckoutHydrationFromSession(data))
      })
      .catch(() => {
        hydrateKeyRef.current = null
      })
      .finally(() => {
        if (!cancelled) onSettled?.(key)
      })

    return () => {
      cancelled = true
    }
  }, [mounted, onHydrate, onSettled, returningVerified, setUser, user?.email, user?.id])
}
