import { formatPaymentPurpose } from '../settings/cart-checkout.normalize'

/** Code default in `DEFAULT_CART_CHECKOUT_SETTINGS` — UA-only wording. */
export const UA_PAYMENT_PURPOSE_DEFAULT = 'Оплата за замовлення {orderNumber}'

const PAYMENT_PURPOSE_BY_LOCALE: Record<string, string> = {
  uk: 'Оплата за замовлення {orderNumber}',
  sk: 'Platba za objednávku {orderNumber}',
  cs: 'Platba za objednávku {orderNumber}',
  de: 'Zahlung für Bestellung {orderNumber}',
  hu: 'Fizetés a(z) {orderNumber} rendeléshez',
  en: 'Payment for order {orderNumber}',
}

function looksUkrainianTemplate(template: string): boolean {
  return /[а-яіїєґА-ЯІЇЄҐ]/.test(template) || template.trim() === UA_PAYMENT_PURPOSE_DEFAULT
}

export function resolvePaymentPurposeTemplateForLocale(
  template: string,
  locale: string,
): string {
  const code = locale.trim().toLowerCase().slice(0, 2)
  const localeFallback = PAYMENT_PURPOSE_BY_LOCALE[code] ?? PAYMENT_PURPOSE_BY_LOCALE.en
  const resolved = template.trim()
  if (code === 'uk') {
    return resolved || localeFallback
  }
  if (!resolved || looksUkrainianTemplate(resolved)) {
    return localeFallback
  }
  return resolved
}

/**
 * Prefer CMS/backoffice template. On non-UK locales, never leak the UA code default
 * or other Cyrillic purpose text when settings were not localized.
 */
export function resolvePaymentPurposeForMarket(
  template: string,
  orderNumbers: string[],
  marketRegion: string,
  locale?: string,
): string {
  const effectiveLocale =
    locale?.trim() ||
    (marketRegion === 'ua' ? 'uk' : marketRegion === 'sk' ? 'sk' : 'en')
  const resolved = resolvePaymentPurposeTemplateForLocale(template, effectiveLocale)
  return formatPaymentPurpose(resolved, orderNumbers)
}
