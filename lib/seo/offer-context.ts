import type { PublicCommerceSettings } from '@/lib/commerce/types'
import type { CountrySiteOverlay } from '@/lib/country-sites/apply-overlay'
import { convertEurToHuf } from '@/lib/country-sites/currency'
import { buildVatDisplayPolicy, toShelfUnitPrice } from '@/lib/pricing/vat-price'
import type { MarketSettings } from '@/lib/settings/market'

export type SeoOfferContext = {
  currency: string
  country: string
  price: number
}

/**
 * Shelf price + currency for JSON-LD Offer.
 * SK without a resolved overlay: omit Offer (do not emit default UAH).
 */
export function resolveSeoOffer(
  storedPrice: number,
  input: {
    market: MarketSettings
    overlay: CountrySiteOverlay | null
    commerce: PublicCommerceSettings
    cartTaxRatePercent: number
  },
): SeoOfferContext | null {
  if (!Number.isFinite(storedPrice) || storedPrice <= 0) return null

  if (input.overlay) {
    const vat = buildVatDisplayPolicy(
      input.market,
      input.overlay.countryCode,
      input.overlay.taxRatePercent || input.cartTaxRatePercent,
    )
    const shelf = toShelfUnitPrice(storedPrice, {
      priceBasis: vat.priceBasis,
      primary: vat.storefrontPrimaryPrice,
      ratePercent: vat.taxRatePercent,
    })
    const price =
      input.overlay.currency === 'HUF'
        ? convertEurToHuf(shelf, input.overlay.eurToHufRate)
        : shelf
    return {
      currency: input.overlay.currency,
      country: input.overlay.countryCode.toUpperCase(),
      price,
    }
  }

  if (input.market.region === 'ua') {
    const vat = buildVatDisplayPolicy(input.market, null, input.cartTaxRatePercent)
    const shelf = toShelfUnitPrice(storedPrice, {
      priceBasis: vat.priceBasis,
      primary: vat.storefrontPrimaryPrice,
      ratePercent: vat.taxRatePercent,
    })
    const code = input.commerce.defaultCurrency.code?.trim()
    if (!code) return null
    return { currency: code, country: 'UA', price: shelf }
  }

  return null
}
