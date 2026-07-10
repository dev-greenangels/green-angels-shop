import type { PricingQuote } from '@/lib/pricing/quote'

export type PromoSkipReason = 'no_additional_discount'

export type PromoApplyInfoReason = PromoSkipReason

export function findPromoSkipped(
  quote: Pick<PricingQuote, 'promoSkipped'> | null | undefined,
  code: string,
) {
  const upper = code.toUpperCase()
  return quote?.promoSkipped?.find((item) => item.code.toUpperCase() === upper)
}

export function findPromoInfoMessageForCode(
  messages: string[] | null | undefined,
  code: string,
): string | undefined {
  const upper = code.toUpperCase()
  return messages?.find((item) => item.toUpperCase().includes(upper))
}

export function isPromoBlockingMessage(message: string): boolean {
  return !message.includes('знижка не застосована')
}

export function resolvePromoQuoteError(
  quotes: Array<{ promoMessage?: string | null } | null | undefined>,
): string | null {
  for (const quote of quotes) {
    const message = quote?.promoMessage
    if (message && isPromoBlockingMessage(message)) {
      return message
    }
  }
  return null
}

export function findPromoErrorMessageForCode(
  quote: Pick<PricingQuote, 'promoMessages' | 'promoMessage'>,
  code: string,
): string | undefined {
  const upper = code.toUpperCase()
  const fromList = (quote.promoMessages ?? []).find((item) => item.toUpperCase().includes(upper))
  if (fromList) return fromList
  if (quote.promoMessage?.toUpperCase().includes(upper)) {
    return quote.promoMessage
  }
  return undefined
}

export function resolvePromoApplyFailure(
  quote: PricingQuote,
  code: string,
): { kind: 'info'; reason: PromoApplyInfoReason } | { kind: 'error'; message: string } {
  const skipped = findPromoSkipped(quote, code)
  if (skipped?.reason === 'no_additional_discount') {
    return { kind: 'info', reason: 'no_additional_discount' }
  }

  const errorMessage = findPromoErrorMessageForCode(quote, code)
  if (errorMessage) return { kind: 'error', message: errorMessage }
  return { kind: 'error', message: `Промокод ${code} не застосовано.` }
}

export function resolveRemovedPromoInfo(
  quote: Pick<PricingQuote, 'promoInfoMessages' | 'promoSkipped'>,
  removedCodes: string[],
): { reason: PromoApplyInfoReason; code: string } | null {
  for (const code of removedCodes) {
    const skipped = findPromoSkipped(quote, code)
    if (skipped?.reason === 'no_additional_discount') {
      return { reason: 'no_additional_discount', code }
    }
    if (findPromoInfoMessageForCode(quote.promoInfoMessages, code)) {
      return { reason: 'no_additional_discount', code }
    }
  }
  return null
}
