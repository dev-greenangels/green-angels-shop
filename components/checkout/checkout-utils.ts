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

export const CHECKOUT_STEP_META: { key: CheckoutStep; label: string }[] = [
  { key: 'contact', label: 'Замовник' },
  { key: 'shipping', label: 'Доставка' },
  { key: 'payment', label: 'Оплата' },
]

export const PICKUP_ADDRESS =
  'с. Оноківці, вул. Зелених Янголів, 1 (траса Ужгород - Перечин, 1й км)'

export const PICKUP_HOURS = 'Пн–Пт: 9:00–18:00, Сб: 10:00–16:00, Нд: вихідний'

/** Фон сторінки — як на auth (login/register) */
export const checkoutPageShellClassName =
  'relative min-h-screen overflow-x-hidden'

export const checkoutPageGradientClassName =
  'pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary via-background to-accent'

export const checkoutPageContentClassName = 'relative'

/** Прозорі панелі — як sticky navbar */
export const checkoutPanelClassName =
  'w-full min-w-0 rounded-xl border border-border/40 bg-background/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/20 sm:p-6'

export const checkoutInsetPanelClassName =
  'rounded-lg border border-border/40 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/40'

export const checkoutHeaderClassName =
  'border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'

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

export function getCheckoutRecipientSummary(values: CheckoutFormValues): string {
  if (values.isOtherRecipient && values.recipientFirstName.trim()) {
    return formatPersonName(
      values.recipientLastName,
      values.recipientFirstName,
      values.recipientPatronymic
    )
  }
  if (!values.firstName.trim() || !values.lastName.trim()) return ''
  return formatPersonName(values.lastName, values.firstName, values.patronymic)
}

export function getCheckoutPhoneSummary(values: CheckoutFormValues): string {
  if (values.isOtherRecipient && values.recipientPhone.trim()) {
    return formatPhoneDisplay(values.recipientPhone)
  }
  if (!isValidUkrPhone(values.phone) && values.deliveryPhone.trim()) {
    return formatPhoneDisplay(values.deliveryPhone)
  }
  return formatCheckoutPhone(values.phone)
}
