import type { CheckoutDraftV1 } from '@/lib/carts/types'
import {
  checkoutFormPatchFromDraft,
} from '@/lib/checkout/checkout-draft'
import type { GoogleCheckoutProfile, PublicSession } from '@/lib/auth/types'
import { buildCheckoutHydrationFromSession } from '@/lib/checkout/hydrate-checkout-session'
import {
  acceptCheckoutPersonName,
  type CheckoutFormValues,
  type CheckoutIdentificationState,
  type CheckoutMarketRegion,
} from '@/lib/validation/checkout-form'

export type CheckoutInitialHydrationResult = {
  formPatch: Partial<CheckoutFormValues>
  identification: CheckoutIdentificationState | null
  personalDiscountPercent: number | null
  buyerType?: 'individual' | 'company'
  vatCountryCode?: string
  companyVatId?: string
  shipmentSplitMode?: 'together' | 'split'
  settledKey: string
}

function filterHydratedNamesForMarket(
  patch: Partial<CheckoutFormValues>,
  marketRegion: CheckoutMarketRegion | undefined,
): Partial<CheckoutFormValues> {
  if (marketRegion == null) return patch
  const next = { ...patch }
  if (next.firstName != null) {
    next.firstName = acceptCheckoutPersonName(next.firstName, marketRegion)
  }
  if (next.lastName != null) {
    next.lastName = acceptCheckoutPersonName(next.lastName, marketRegion)
  }
  if (next.recipientFirstName != null) {
    next.recipientFirstName = acceptCheckoutPersonName(
      next.recipientFirstName,
      marketRegion,
    )
  }
  if (next.recipientLastName != null) {
    next.recipientLastName = acceptCheckoutPersonName(
      next.recipientLastName,
      marketRegion,
    )
  }
  return next
}

/**
 * Deterministic merge:
 * 1) profile/session defaults
 * 2) present draft fields overlay (saved checkout intent wins)
 * 3) drop wrong-script names when marketRegion is set
 * Live validation/clamping remains the caller's responsibility.
 */
export function mergeCheckoutInitialHydration(input: {
  session: { user: PublicSession; profile: GoogleCheckoutProfile | null } | null
  draft: CheckoutDraftV1 | null
  allowedDeliveryMethods: string[]
  allowedPaymentMethods: string[]
  marketRegion?: CheckoutMarketRegion
}): CheckoutInitialHydrationResult {
  let formPatch: Partial<CheckoutFormValues> = {}
  let identification: CheckoutIdentificationState | null = null
  let personalDiscountPercent: number | null = null

  if (input.session) {
    const fromSession = buildCheckoutHydrationFromSession(
      input.session,
      input.marketRegion,
    )
    formPatch = { ...fromSession.formPatch }
    identification = fromSession.identification
    personalDiscountPercent = fromSession.personalDiscountPercent
  }

  if (input.draft) {
    const fromDraft = checkoutFormPatchFromDraft(input.draft, {
      deliveryMethods: input.allowedDeliveryMethods,
      paymentMethods: input.allowedPaymentMethods,
    })
    formPatch = { ...formPatch, ...fromDraft }
  }

  formPatch = filterHydratedNamesForMarket(formPatch, input.marketRegion)

  return {
    formPatch,
    identification,
    personalDiscountPercent,
    buyerType: input.draft?.buyerType,
    vatCountryCode: input.draft?.vatCountryCode,
    companyVatId: input.draft?.companyVatId,
    shipmentSplitMode: input.draft?.shipmentSplitMode,
    settledKey: input.session?.user.id ?? input.session?.user.email ?? '__guest__',
  }
}
