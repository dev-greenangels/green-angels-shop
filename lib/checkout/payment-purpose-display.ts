import { formatPaymentPurpose } from '../settings/cart-checkout.normalize'

/** Code default in `DEFAULT_CART_CHECKOUT_SETTINGS` — UA-only wording. */
export const UA_PAYMENT_PURPOSE_DEFAULT = 'Оплата за замовлення {orderNumber}'

const SK_PAYMENT_PURPOSE_FALLBACK = 'VS {orderNumber}'
const EU_PAYMENT_PURPOSE_FALLBACK = 'Order {orderNumber}'

function looksUkrainianTemplate(template: string): boolean {
  return /[а-яіїєґА-ЯІЇЄҐ]/.test(template) || template.trim() === UA_PAYMENT_PURPOSE_DEFAULT
}

/**
 * Prefer CMS/backoffice template. On non-UA markets, never leak the UA code default
 * or other Cyrillic purpose text when settings were not configured.
 */
export function resolvePaymentPurposeForMarket(
  template: string,
  orderNumbers: string[],
  marketRegion: string,
): string {
  let resolved = template.trim()
  if (marketRegion !== 'ua') {
    if (!resolved || looksUkrainianTemplate(resolved)) {
      resolved =
        marketRegion === 'sk' ? SK_PAYMENT_PURPOSE_FALLBACK : EU_PAYMENT_PURPOSE_FALLBACK
    }
  } else if (!resolved) {
    resolved = UA_PAYMENT_PURPOSE_DEFAULT
  }
  return formatPaymentPurpose(resolved, orderNumbers)
}
