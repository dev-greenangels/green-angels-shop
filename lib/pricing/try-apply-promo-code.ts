import { fetchPricingQuote } from '@/lib/pricing/quote'
import {
  findPromoErrorMessageForCode,
  resolvePromoApplyFailure,
  type PromoApplyInfoReason,
} from '@/lib/pricing/promo-messages'

export type PromoApplyResult =
  | { ok: true; codes: string[] }
  | { ok: false; kind: 'info'; reason: PromoApplyInfoReason; code: string }
  | { ok: false; kind: 'error'; message: string }

function promoCodesInclude(codes: string[] | undefined, code: string): boolean {
  const upper = code.toUpperCase()
  return (codes ?? []).some((item) => item.trim().toUpperCase() === upper)
}

export async function tryApplyPromoCode(input: {
  draftCode: string
  currentCodes: string[]
  items: Array<{ productVariantId: string; quantity: number }>
  customerPhone?: string
  userId?: string
  deliveryMethod?: string
  splitOrderParts?: number
}): Promise<PromoApplyResult> {
  const code = input.draftCode.trim().toUpperCase()
  if (!code) {
    return { ok: false, kind: 'error', message: 'Введіть промокод.' }
  }
  if (input.currentCodes.includes(code)) {
    return { ok: false, kind: 'error', message: 'Цей промокод уже застосовано.' }
  }

  const quoteInput = {
    items: input.items,
    customerPhone: input.customerPhone,
    userId: input.userId,
    deliveryMethod: input.deliveryMethod,
    splitOrderParts: input.splitOrderParts,
  }

  try {
    const soloQuote = await fetchPricingQuote({
      ...quoteInput,
      promoCodes: [code],
    })

    if (!promoCodesInclude(soloQuote.promoCodes, code)) {
      const failure = resolvePromoApplyFailure(soloQuote, code)
      if (failure.kind === 'info') {
        return { ok: false, kind: 'info', reason: failure.reason, code }
      }
      return { ok: false, kind: 'error', message: failure.message }
    }

    const nextCodes = [...input.currentCodes, code]
    if (!input.currentCodes.length) {
      return { ok: true, codes: soloQuote.promoCodes ?? [code] }
    }

    const combinedQuote = await fetchPricingQuote({
      ...quoteInput,
      promoCodes: nextCodes,
    })

    if (promoCodesInclude(combinedQuote.promoCodes, code)) {
      return { ok: true, codes: combinedQuote.promoCodes ?? nextCodes }
    }

    const stackMessage = findPromoErrorMessageForCode(combinedQuote, code)
    if (stackMessage) {
      return { ok: false, kind: 'error', message: stackMessage }
    }

    const failure = resolvePromoApplyFailure(combinedQuote, code)
    if (failure.kind === 'info') {
      return { ok: false, kind: 'info', reason: failure.reason, code }
    }
    return { ok: false, kind: 'error', message: failure.message }
  } catch (error) {
    return {
      ok: false,
      kind: 'error',
      message: error instanceof Error ? error.message : 'Не вдалося перевірити промокод.',
    }
  }
}
