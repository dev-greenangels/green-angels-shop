import { cartLineKey } from '@/lib/cart-store'
import type { CartItem } from '@/lib/types'

export type CheckoutStep = 'contact' | 'shipping' | 'payment'

export function checkoutItemKey(item: CartItem) {
  return cartLineKey(item.plant.slug, item.variantId)
}

export const CHECKOUT_STEP_META: { key: CheckoutStep; label: string }[] = [
  { key: 'contact', label: 'Контакти' },
  { key: 'shipping', label: 'Доставка' },
  { key: 'payment', label: 'Оплата' },
]

export const PICKUP_ADDRESS =
  'с. Оноківці, вул. Зелених Янголів, 1 (траса Ужгород - Перечин, 1й км)'
