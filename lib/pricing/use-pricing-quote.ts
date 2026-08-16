'use client'

import { useEffect, useRef, useState } from 'react'

import { fetchPricingQuote, type PricingQuote } from '@/lib/pricing/quote'

export function promoCodesKey(codes: string[]): string {
  return codes
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
    .join('|')
}

export function resolveDisplayedAppliedPromos(
  appliedPromoCodes: string[],
  quote: Pick<PricingQuote, 'promoCodes' | 'appliedPromos'> | null | undefined,
  quoteLoading: boolean,
  quoteForPromoCodes: string[],
): Array<{
  code: string
  name: string
  appliedDiscountAmount?: number | null
  unusedDiscountAmount?: number | null
  infoMessage?: string | null
}> {
  if (quoteLoading) {
    return appliedPromoCodes.map((code) => ({ code, name: '' }))
  }
  if (!quote) {
    return appliedPromoCodes.map((code) => ({ code, name: '' }))
  }
  if (promoCodesKey(quoteForPromoCodes) === promoCodesKey(appliedPromoCodes)) {
    if (quote.appliedPromos?.length) {
      return quote.appliedPromos
    }
    return (quote.promoCodes ?? []).map((code) => ({ code, name: '' }))
  }
  return appliedPromoCodes.map((code) => ({ code, name: '' }))
}

export function resolveDisplayedPromoCodes(
  appliedPromoCodes: string[],
  quote: Pick<PricingQuote, 'promoCodes' | 'appliedPromos'> | null | undefined,
  quoteLoading: boolean,
  quoteForPromoCodes: string[],
): string[] {
  return resolveDisplayedAppliedPromos(
    appliedPromoCodes,
    quote,
    quoteLoading,
    quoteForPromoCodes,
  ).map((promo) => promo.code)
}

type UsePricingQuoteInput = {
  items: Array<{ productVariantId: string; quantity: number }>
  itemsKey: string
  /** Змінюється після логіну/логауту — тригерить re-quote (аудиторія з cookie на BFF). */
  audienceKey?: string | null
  promoCode?: string
  promoCodes?: string[]
  deliveryMethod?: string
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

export function usePricingQuote({
  items,
  itemsKey,
  audienceKey = null,
  promoCode,
  promoCodes,
  deliveryMethod,
  paymentMethod,
  splitOrderParts,
  splitOrderPartIndex,
  countryCode,
  deliveryCountryCode,
  buyerType,
  vatCountryCode,
  viesValid,
  enabled = true,
  debounceMs = 300,
}: UsePricingQuoteInput) {
  const [quote, setQuote] = useState<PricingQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [quoteForPromoCodes, setQuoteForPromoCodes] = useState<string[]>([])
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!enabled || !itemsKey || !items.length) {
      setQuote(null)
      setQuoteForPromoCodes([])
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
          const result = await fetchPricingQuote({
            items,
            promoCode: promoCode || undefined,
            promoCodes: requestedPromoCodes.length ? requestedPromoCodes : undefined,
            deliveryMethod: deliveryMethod || undefined,
            paymentMethod: paymentMethod || undefined,
            splitOrderParts,
            splitOrderPartIndex,
            countryCode,
            deliveryCountryCode,
            buyerType,
            vatCountryCode,
            viesValid,
          })
          if (requestIdRef.current !== requestId) return
          setQuoteForPromoCodes(requestedPromoCodes)
          setQuote(result)
        } catch {
          if (requestIdRef.current !== requestId) return
          setQuote(null)
          setQuoteForPromoCodes([])
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
    deliveryCountryCode,
    debounceMs,
    deliveryMethod,
    paymentMethod,
    enabled,
    items,
    itemsKey,
    promoCode,
    promoCodes,
    splitOrderPartIndex,
    splitOrderParts,
    vatCountryCode,
    viesValid,
  ])

  return { quote, loading, quoteForPromoCodes }
}
