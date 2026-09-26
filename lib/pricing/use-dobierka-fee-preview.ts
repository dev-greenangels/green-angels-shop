'use client'

import { useEffect, useRef, useState } from 'react'

import { fetchPricingQuote } from '@/lib/pricing/quote'

type UseDobierkaFeePreviewInput = {
  items: Array<{ productVariantId: string; quantity: number }>
  itemsKey: string
  audienceKey?: string | null
  promoCodes?: string[]
  deliveryMethod?: string
  splitOrderParts?: number
  splitOrderPartIndex?: number
  countryCode?: 'sk' | 'hu' | 'at'
  deliveryCountryCode?: string
  buyerType?: 'individual' | 'company'
  vatCountryCode?: string
  viesValid?: boolean
  pickupPointId?: string
  pickupPointKind?: 'branch' | 'box' | 'carrier'
  packetaCarrierId?: number
  /** When false (e.g. dobierka not visible, or already selected → use main quote). */
  enabled?: boolean
  debounceMs?: number
}

/**
 * COD fee for the dobierka payment button while another payment method is selected.
 * Mirrors `/api/pricing/quote` with paymentMethod=dobierka; does not affect order totals.
 */
export function useDobierkaFeePreview({
  items,
  itemsKey,
  audienceKey = null,
  promoCodes,
  deliveryMethod,
  splitOrderParts,
  splitOrderPartIndex,
  countryCode,
  deliveryCountryCode,
  buyerType,
  vatCountryCode,
  viesValid,
  pickupPointId,
  pickupPointKind,
  packetaCarrierId,
  enabled = true,
  debounceMs = 350,
}: UseDobierkaFeePreviewInput) {
  const [feeAmount, setFeeAmount] = useState(0)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!enabled || !itemsKey || !items.length) {
      setFeeAmount(0)
      return
    }

    const requestedPromoCodes = promoCodes?.length
      ? promoCodes.map((code) => code.trim().toUpperCase()).filter(Boolean)
      : []
    const requestId = ++requestIdRef.current
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const quote = await fetchPricingQuote({
            items,
            promoCodes: requestedPromoCodes.length ? requestedPromoCodes : undefined,
            deliveryMethod: deliveryMethod || undefined,
            paymentMethod: 'dobierka',
            splitOrderParts,
            splitOrderPartIndex,
            countryCode,
            deliveryCountryCode:
              deliveryMethod === 'pickup'
                ? (countryCode ?? deliveryCountryCode)
                : deliveryCountryCode,
            buyerType,
            vatCountryCode,
            viesValid,
            pickupPointId,
            pickupPointKind,
            packetaCarrierId,
          })
          if (requestIdRef.current !== requestId) return
          setFeeAmount(Math.max(0, quote.checkout?.codFeeAmount ?? 0))
        } catch {
          if (requestIdRef.current !== requestId) return
          setFeeAmount(0)
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
    deliveryMethod,
    enabled,
    items,
    itemsKey,
    packetaCarrierId,
    pickupPointId,
    pickupPointKind,
    promoCodes,
    splitOrderPartIndex,
    splitOrderParts,
    vatCountryCode,
    viesValid,
  ])

  return { feeAmount }
}
