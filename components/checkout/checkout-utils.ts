import { cartLineKey } from '@/lib/cart-store'
import type { CartItem } from '@/lib/types'
import type { CheckoutFormValues } from '@/lib/validation/checkout-form'
import {
  formatCheckoutPhoneDisplay,
  formatPhoneDisplay,
  isValidUkrPhone,
} from '@/lib/validation/checkout-form'

export type CheckoutStep = 'contact' | 'shipping' | 'payment'

export function checkoutItemKey(item: CartItem) {
  return cartLineKey(item.plant.slug, item.variantId ?? '')
}

export const CHECKOUT_STEP_META: { key: CheckoutStep }[] = [
  { key: 'contact' },
  { key: 'shipping' },
  { key: 'payment' },
]

export function checkoutStepDomId(step: CheckoutStep) {
  return `checkout-step-${step}`
}

/** Індекс активного кроку за заповненням форми (0 — замовник, 1 — доставка, 2 — оплата). */
export function getCheckoutProgressIndex(
  contactComplete: boolean,
  shippingComplete: boolean,
  paymentComplete = false,
): number {
  if (!contactComplete) return 0
  if (!shippingComplete) return 1
  if (!paymentComplete) return 2
  return 2
}

export function isCheckoutStepComplete(
  step: CheckoutStep,
  contactComplete: boolean,
  shippingComplete: boolean,
  paymentComplete = false,
): boolean {
  if (step === 'contact') return contactComplete
  if (step === 'shipping') return shippingComplete
  return paymentComplete
}

/** Фон сторінки — як на auth (login/register) */
export const checkoutPageShellClassName =
  'relative min-h-screen overflow-x-clip'

export const checkoutPageGradientClassName =
  'pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary via-background to-accent'

export const checkoutPageContentClassName = 'relative'

/** Прозорі панелі кроків чекауту */
export const checkoutPanelClassName =
  'w-full min-w-0 rounded-xl border border-border/80 bg-background p-4 shadow-lg shadow-black/[0.08] sm:p-6'

export const checkoutInsetPanelClassName =
  'rounded-lg border border-border/80 bg-background shadow-sm shadow-black/[0.04]'

/** Поля вводу в чекауті — чіткіші межі та тінь */
export const checkoutInputClassName =
  'border-border/95 bg-card/80 shadow-sm ring-1 ring-border/45 transition-colors focus-visible:ring-primary/35 data-[has-value=true]:border-primary/45 data-[has-value=true]:bg-primary/5 data-[has-value=true]:ring-primary/20'

export const checkoutHeaderClassName =
  'border-b border-border/50 bg-background/95 shadow-md shadow-black/5 backdrop-blur-md supports-[backdrop-filter]:bg-background/70'

export function formatPersonName(
  lastName: string,
  firstName: string,
  patronymic?: string
): string {
  return [lastName, firstName, patronymic?.trim()].filter(Boolean).join(' ')
}

export function formatCheckoutPhone(phone: string): string {
  if (!phone.trim()) return ''
  return isValidUkrPhone(phone) ? formatPhoneDisplay(phone) : formatCheckoutPhoneDisplay(phone)
}

export type CheckoutPartySummary = {
  name: string
  phone: string
}

function ordererPhoneDisplay(values: CheckoutFormValues): string {
  if (!values.phone.trim()) {
    if (!values.isOtherRecipient && values.deliveryPhone.trim()) {
      return formatPhoneDisplay(values.deliveryPhone)
    }
    return ''
  }
  if (isValidUkrPhone(values.phone)) {
    return formatPhoneDisplay(values.phone)
  }
  if (values.deliveryPhone.trim() && !values.isOtherRecipient) {
    return formatPhoneDisplay(values.deliveryPhone)
  }
  return formatCheckoutPhoneDisplay(values.phone)
}

/** Дані замовника (крок 1 + по батькові на доставці, якщо це він же отримувач). */
export function getCheckoutOrdererSummary(values: CheckoutFormValues): CheckoutPartySummary {
  const patronymic = !values.isOtherRecipient ? values.patronymic : undefined
  const name =
    values.firstName.trim() && values.lastName.trim()
      ? formatPersonName(values.lastName, values.firstName, patronymic)
      : ''
  return { name, phone: ordererPhoneDisplay(values) }
}

/** Хто фактично отримує посилку (замовник або інший отримувач). */
export function getCheckoutDeliveryRecipientSummary(
  values: CheckoutFormValues
): CheckoutPartySummary {
  if (values.isOtherRecipient) {
    const name =
      values.recipientFirstName.trim() && values.recipientLastName.trim()
        ? formatPersonName(
            values.recipientLastName,
            values.recipientFirstName,
            values.recipientPatronymic
          )
        : ''
    const phone = values.recipientPhone.trim()
      ? formatPhoneDisplay(values.recipientPhone)
      : ''
    return { name, phone }
  }

  return getCheckoutOrdererSummary(values)
}

/** Телефон отримувача для API (E.164-готовий рядок до normalizePhoneForApi). */
export function getCheckoutRecipientPhoneRaw(values: CheckoutFormValues): string {
  if (values.isOtherRecipient) {
    return values.recipientPhone.trim()
  }
  if (isValidUkrPhone(values.phone)) {
    return values.phone.trim()
  }
  return values.deliveryPhone.trim()
}
