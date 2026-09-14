import type { CountrySiteCode } from '@/lib/country-sites/types'
import type { CheckoutDeliveryMethodSlug } from '@/lib/checkout/methods'
import { isSelfPickupDeliveryMethod } from '@/lib/checkout/methods'
import { resolveShippingPagePaymentMethods } from '@/lib/checkout/payment-availability'
import {
  allowedDeliveryCountriesForHost,
  type DeliveryCountryCode,
  type MarketSettings,
} from '@/lib/settings/market'
import type { CartCheckoutSettings } from '@/lib/settings/types'

export type ShippingDeliveryGroup = 'nova-poshta' | 'packeta' | 'gls' | 'pickup'

const PACKETA_METHODS = new Set<CheckoutDeliveryMethodSlug>([
  'packeta-box',
  'packeta-courier',
])

/** Group enabled checkout delivery slugs for Shipping page cards. */
export function shippingDeliveryGroups(
  enabled: CheckoutDeliveryMethodSlug[],
): ShippingDeliveryGroup[] {
  const set = new Set(enabled)
  const groups: ShippingDeliveryGroup[] = []
  if (set.has('nova-poshta-branch') || set.has('nova-poshta-address')) {
    groups.push('nova-poshta')
  }
  if (set.has('packeta-box') || set.has('packeta-courier')) {
    groups.push('packeta')
  }
  if (set.has('gls-courier')) {
    groups.push('gls')
  }
  if (set.has('pickup')) {
    groups.push('pickup')
  }
  return groups
}

export function resolveShippingPageCurrency(
  market: MarketSettings,
  hostCountry: CountrySiteCode | null | undefined,
): string {
  if (market.region === 'sk' && hostCountry) {
    const site = market.countrySites.find((row) => row.code === hostCountry && row.enabled)
    if (site?.currency) return site.currency
  }
  return (market.defaultCurrency || 'EUR').trim().toUpperCase() || 'EUR'
}

export function resolveShippingPageCountries(
  market: MarketSettings,
  hostCountry: CountrySiteCode | null | undefined,
): DeliveryCountryCode[] {
  return allowedDeliveryCountriesForHost(market, hostCountry)
}

export function hasPacketaDeliveryEnabled(
  enabledDeliveryMethods: CheckoutDeliveryMethodSlug[],
): boolean {
  return enabledDeliveryMethods.some((m) => PACKETA_METHODS.has(m))
}

/**
 * Page-level COD visibility follows checkout payment filters.
 * Note: checkout currently allows dobierka for any non-pickup carrier (incl. GLS),
 * not Packeta-only — see final report conflict.
 */
export function buildShippingPageMethodContext(input: {
  market: MarketSettings
  cart: CartCheckoutSettings
  hostCountry: CountrySiteCode | null | undefined
  dispatchCalendarEnabled?: boolean
}) {
  const enabledDeliveryMethods = input.cart.enabledDeliveryMethods
  const groups = shippingDeliveryGroups(enabledDeliveryMethods)
  const pickupAvailable = groups.includes('pickup')
  const payments = resolveShippingPagePaymentMethods({
    enabledPaymentMethods: input.cart.enabledPaymentMethods,
    hideLegalBankTransfer: input.market.region === 'sk',
    allowPayOnPickup: input.cart.allowPayOnPickup,
    enabledDeliveryMethods,
  })
  const currency = resolveShippingPageCurrency(input.market, input.hostCountry)
  const countries = resolveShippingPageCountries(input.market, input.hostCountry)
  const packetaEnabled = hasPacketaDeliveryEnabled(enabledDeliveryMethods)

  const showCodFee =
    payments.includes('dobierka') &&
    input.cart.codFeeMode === 'fixed' &&
    Number.isFinite(input.cart.codFeeAmount) &&
    input.cart.codFeeAmount > 0

  return {
    enabledDeliveryMethods,
    groups,
    /** Carrier method cards only (pickup rendered in dedicated Slovakia section). */
    carrierGroups: groups.filter((g) => g !== 'pickup'),
    pickupAvailable,
    payments,
    currency,
    countries,
    deliveryFreeForPickup: input.cart.deliveryFreeForPickup === true,
    onlineCardProvider: input.cart.onlineCardProvider,
    showCodFee,
    codFeeAmount: showCodFee ? input.cart.codFeeAmount : null,
    hasCarrierMethods: enabledDeliveryMethods.some((m) => !isSelfPickupDeliveryMethod(m)),
    packetaEnabled,
    /** True when dobierka is checkout-visible in page payment union. */
    showCod: payments.includes('dobierka'),
    showCard: payments.includes('card-online'),
    showBankTransfer: payments.includes('bank-transfer'),
    showPayOnPickup: payments.includes('pay-on-pickup'),
    dispatchCalendarEnabled: input.dispatchCalendarEnabled === true,
  }
}
