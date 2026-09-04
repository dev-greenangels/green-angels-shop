'use client'

import { useEffect, useRef, useState } from 'react'

import { fetchPricingQuote, type CheckoutTotalsBreakdown } from '@/lib/pricing/quote'

export type DeliveryMethodPriceSnapshot = {
  deliveryAmount: number
  deliveryIncludedInTotal: boolean
  deliveryUnavailableReason: CheckoutTotalsBreakdown['deliveryUnavailableReason']
  taxAppliesToFees?: boolean
  taxRatePercent?: number
  taxRegime?: string | null
}

type UseDeliveryMethodPricesInput = {
  methods: string[]
  items: Array<{ productVariantId: string; quantity: number }>
  itemsKey: string
  audienceKey?: string | null
  promoCodes?: string[]
  paymentMethod?: string
  splitOrderParts?: number
  splitOrderPartIndex?: number
  countryCode?: 'sk' | 'hu' | 'at'
  deliveryCountryCode?: string
  buyerType?: 'individual' | 'company'
  vatCountryCode?: string
  viesValid?: boolean
  enabled?: boolean
  debounceMs?: number
}

function methodsKey(methods: string[]): string {
  return [...methods].sort().join('|')
}

/**
 * Parallel pricing quotes per delivery method — for short prices on method buttons.
 * Reuses the same `/api/pricing/quote` path as the order summary.
 */
export function useDeliveryMethodPrices({
  methods,
  items,
  itemsKey,
  audienceKey = null,
  promoCodes,
  paymentMethod,
  splitOrderParts,
  splitOrderPartIndex,
  countryCode,
  deliveryCountryCode,
  buyerType,
  vatCountryCode,
  viesValid,
  enabled = true,
  debounceMs = 350,
}: UseDeliveryMethodPricesInput) {
  const [pricesByMethod, setPricesByMethod] = useState<
    Record<string, DeliveryMethodPriceSnapshot | null>
  >({})
  const [loading, setLoading] = useState(false)
  const requestIdRef = useRef(0)

  const methodsJoined = methodsKey(methods)

  useEffect(() => {
    if (!enabled || !itemsKey || !items.length || !methods.length) {
      setPricesByMethod({})
      setLoading(false)
      return
    }

    const requestedPromoCodes = promoCodes?.length
      ? promoCodes.map((code) => code.trim().toUpperCase()).filter(Boolean)
      : []
    const requestId = ++requestIdRef.current
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true)
        try {
          const entries = await Promise.all(
            methods.map(async (method) => {
              try {
                const quote = await fetchPricingQuote({
                  items,
                  promoCodes: requestedPromoCodes.length ? requestedPromoCodes : undefined,
                  deliveryMethod: method,
                  paymentMethod: paymentMethod || undefined,
                  splitOrderParts,
                  splitOrderPartIndex,
                  countryCode,
                  deliveryCountryCode:
                    method === 'pickup' ? (countryCode ?? deliveryCountryCode) : deliveryCountryCode,
                  buyerType,
                  vatCountryCode,
                  viesValid,
                })
                const checkout = quote.checkout
                if (!checkout) {
                  return [method, null] as const
                }
                return [
                  method,
                  {
                    deliveryAmount: checkout.deliveryAmount ?? 0,
                    deliveryIncludedInTotal: checkout.deliveryIncludedInTotal !== false,
                    deliveryUnavailableReason: checkout.deliveryUnavailableReason ?? null,
                    taxAppliesToFees: checkout.taxAppliesToFees,
                    taxRatePercent: checkout.taxRatePercent,
                    taxRegime: checkout.taxRegime ?? quote.taxRegime ?? null,
                  } satisfies DeliveryMethodPriceSnapshot,
                ] as const
              } catch {
                return [method, null] as const
              }
            }),
          )
          if (requestIdRef.current !== requestId) return
          setPricesByMethod(Object.fromEntries(entries))
        } finally {
          if (requestIdRef.current === requestId) {
            setLoading(false)
          }
        }
      })()
    }, debounceMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [
    audienceKey,
    buyerType,
    countryCode,
    debounceMs,
    deliveryCountryCode,
    enabled,
    items,
    itemsKey,
    methodsJoined,
    methods,
    paymentMethod,
    promoCodes,
    splitOrderPartIndex,
    splitOrderParts,
    vatCountryCode,
    viesValid,
  ])

  return { pricesByMethod, loading }
}
