'use client'

import { useEffect, useRef } from 'react'

import { patchCheckoutDraft } from '@/lib/carts/api'
import {
  CART_CROSS_TAB_STORAGE_KEY,
  parseCartCrossTabEvent,
} from '@/lib/carts/cart-cross-tab'
import {
  bumpCheckoutDraftPersistEpoch,
  cancelPendingCheckoutDraftPersist,
  scheduleCheckoutDraftPersist,
} from '@/lib/carts/checkout-draft-persist-control'
import {
  buildCheckoutDraftPayload,
  CHECKOUT_DRAFT_DEBOUNCE_MS,
  type CheckoutDraftPersistInput,
} from '@/lib/checkout/checkout-draft'
import type { CheckoutFormValues } from '@/lib/validation/checkout-form'

type UseCheckoutDraftPersistenceArgs = {
  /** Persist only after initial hydration finished — never races hydrate. */
  enabled: boolean
  formData: CheckoutFormValues
  locale: string
  countryCode?: 'sk' | 'hu' | 'at'
  buyerType?: 'individual' | 'company'
  vatCountryCode?: string
  companyVatId?: string
  shipmentSplitMode?: 'together' | 'split'
  promoCodes?: string[]
}

/**
 * Best-effort checkout draft PATCH only (no hydrate).
 * Failures never surface to the customer.
 * Cross-tab order-completed / cart-merge cancels pending PII PATCH.
 */
export function useCheckoutDraftPersistence({
  enabled,
  formData,
  locale,
  countryCode,
  buyerType,
  vatCountryCode,
  companyVatId,
  shipmentSplitMode,
  promoCodes,
}: UseCheckoutDraftPersistenceArgs) {
  const lastMethodsRef = useRef({ delivery: '', payment: '' })
  const skipFirstRef = useRef(true)
  /** After order-completed, suppress until enabled cycles off (consumed checkout). */
  const suppressAfterOrderRef = useRef(false)

  const persistInput: CheckoutDraftPersistInput = {
    form: formData,
    locale,
    countryCode,
    buyerType,
    vatCountryCode,
    companyVatId,
    shipmentSplitMode,
    promoCodes,
  }

  const payload = buildCheckoutDraftPayload(persistInput)
  const payloadKey = JSON.stringify(payload)

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea && event.storageArea !== window.localStorage) return
      if (event.key !== CART_CROSS_TAB_STORAGE_KEY) return
      if (event.newValue == null) return
      const parsed = parseCartCrossTabEvent(event.newValue)
      if (!parsed) return
      bumpCheckoutDraftPersistEpoch()
      cancelPendingCheckoutDraftPersist()
      if (parsed.reason === 'order-completed') {
        suppressAfterOrderRef.current = true
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (!enabled) {
      cancelPendingCheckoutDraftPersist()
      // Consumed checkout left the page / lost checkoutable items — allow future checkouts.
      suppressAfterOrderRef.current = false
      skipFirstRef.current = true
      return
    }

    if (suppressAfterOrderRef.current) {
      cancelPendingCheckoutDraftPersist()
      return
    }

    // Skip the first enabled tick so we do not immediately re-PATCH the just-hydrated draft.
    if (skipFirstRef.current) {
      skipFirstRef.current = false
      lastMethodsRef.current = {
        delivery: payload.deliveryMethod ?? '',
        payment: payload.paymentMethod ?? '',
      }
      return
    }

    const methodsChanged =
      (payload.deliveryMethod ?? '') !== lastMethodsRef.current.delivery ||
      (payload.paymentMethod ?? '') !== lastMethodsRef.current.payment

    const delay = methodsChanged ? 150 : CHECKOUT_DRAFT_DEBOUNCE_MS
    scheduleCheckoutDraftPersist(delay, () => {
      if (suppressAfterOrderRef.current) return
      lastMethodsRef.current = {
        delivery: payload.deliveryMethod ?? '',
        payment: payload.paymentMethod ?? '',
      }
      return patchCheckoutDraft(payload)
    })

    return () => cancelPendingCheckoutDraftPersist()
  }, [enabled, payloadKey, payload])
}
