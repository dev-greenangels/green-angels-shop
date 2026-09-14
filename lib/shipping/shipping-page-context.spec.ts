import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { DEFAULT_CART_CHECKOUT_SETTINGS } from '@/lib/settings/defaults'
import { DEFAULT_MARKET_SETTINGS, normalizeMarketSettings } from '@/lib/settings/market'
import {
  buildShippingPageMethodContext,
  resolveShippingPageCurrency,
  shippingDeliveryGroups,
} from './shipping-page-context'

const skMarket = normalizeMarketSettings({
  ...DEFAULT_MARKET_SETTINGS,
  region: 'sk',
  defaultCurrency: 'EUR',
})

function cartPatch(patch: Partial<typeof DEFAULT_CART_CHECKOUT_SETTINGS>) {
  return { ...DEFAULT_CART_CHECKOUT_SETTINGS, ...patch }
}

describe('shipping page context (approved parity)', () => {
  it('1. .sk → SK/CZ', () => {
    const ctx = buildShippingPageMethodContext({
      market: skMarket,
      cart: cartPatch({
        enabledDeliveryMethods: ['packeta-box', 'pickup'],
        enabledPaymentMethods: ['card-online', 'bank-transfer'],
      }),
      hostCountry: 'sk',
    })
    assert.deepEqual(ctx.countries, ['sk', 'cz'])
    assert.equal(ctx.currency, 'EUR')
  })

  it('2. .hu → HU + HUF', () => {
    const ctx = buildShippingPageMethodContext({
      market: skMarket,
      cart: cartPatch({
        enabledDeliveryMethods: ['packeta-courier', 'gls-courier', 'pickup'],
        enabledPaymentMethods: ['card-online', 'bank-transfer', 'dobierka'],
      }),
      hostCountry: 'hu',
    })
    assert.deepEqual(ctx.countries, ['hu'])
    assert.equal(ctx.currency, 'HUF')
  })

  it('3. .at → AT/DE + EUR', () => {
    const ctx = buildShippingPageMethodContext({
      market: skMarket,
      cart: cartPatch({
        enabledDeliveryMethods: ['gls-courier', 'pickup'],
        enabledPaymentMethods: ['card-online'],
      }),
      hostCountry: 'at',
    })
    assert.deepEqual(ctx.countries, ['at', 'de'])
    assert.equal(ctx.currency, 'EUR')
  })

  it('4. EN host currency/countries differ dynamically', () => {
    assert.notDeepEqual(
      buildShippingPageMethodContext({
        market: skMarket,
        cart: DEFAULT_CART_CHECKOUT_SETTINGS,
        hostCountry: 'sk',
      }).countries,
      buildShippingPageMethodContext({
        market: skMarket,
        cart: DEFAULT_CART_CHECKOUT_SETTINGS,
        hostCountry: 'hu',
      }).countries,
    )
    assert.equal(resolveShippingPageCurrency(skMarket, 'sk'), 'EUR')
    assert.equal(resolveShippingPageCurrency(skMarket, 'hu'), 'HUF')
    assert.equal(resolveShippingPageCurrency(skMarket, 'at'), 'EUR')
  })

  it('5. pickup stays available on foreign hosts', () => {
    for (const host of ['sk', 'hu', 'at'] as const) {
      const ctx = buildShippingPageMethodContext({
        market: skMarket,
        cart: cartPatch({
          enabledDeliveryMethods: ['packeta-box', 'pickup'],
          enabledPaymentMethods: ['card-online'],
        }),
        hostCountry: host,
      })
      assert.equal(ctx.pickupAvailable, true)
    }
  })

  it('6. COD visibility follows checkout payment filters', () => {
    const withCod = buildShippingPageMethodContext({
      market: skMarket,
      cart: cartPatch({
        enabledDeliveryMethods: ['packeta-courier', 'gls-courier'],
        enabledPaymentMethods: ['card-online', 'dobierka'],
      }),
      hostCountry: 'sk',
    })
    assert.equal(withCod.showCod, true)

    const noCod = buildShippingPageMethodContext({
      market: skMarket,
      cart: cartPatch({
        enabledDeliveryMethods: ['packeta-courier'],
        enabledPaymentMethods: ['card-online'],
      }),
      hostCountry: 'sk',
    })
    assert.equal(noCod.showCod, false)
  })

  it('7. disabled payment disappears from page', () => {
    const ctx = buildShippingPageMethodContext({
      market: skMarket,
      cart: cartPatch({
        enabledDeliveryMethods: ['packeta-courier', 'pickup'],
        enabledPaymentMethods: ['card-online'],
        allowPayOnPickup: false,
      }),
      hostCountry: 'sk',
    })
    assert.equal(ctx.showCard, true)
    assert.equal(ctx.showBankTransfer, false)
    assert.equal(ctx.showCod, false)
    assert.equal(ctx.showPayOnPickup, false)
    assert.equal(ctx.payments.includes('bank-transfer-legal'), false)
  })

  it('8. dispatch-date OFF → section flag false', () => {
    const ctx = buildShippingPageMethodContext({
      market: skMarket,
      cart: DEFAULT_CART_CHECKOUT_SETTINGS,
      hostCountry: 'sk',
      dispatchCalendarEnabled: false,
    })
    assert.equal(ctx.dispatchCalendarEnabled, false)
  })

  it('9. dispatch-date ON → section flag true', () => {
    const ctx = buildShippingPageMethodContext({
      market: skMarket,
      cart: DEFAULT_CART_CHECKOUT_SETTINGS,
      hostCountry: 'sk',
      dispatchCalendarEnabled: true,
    })
    assert.equal(ctx.dispatchCalendarEnabled, true)
  })

  it('10. carrier groups exclude pickup; SK hides legal bank transfer', () => {
    const ctx = buildShippingPageMethodContext({
      market: skMarket,
      cart: cartPatch({
        enabledDeliveryMethods: ['packeta-box', 'gls-courier', 'pickup'],
        enabledPaymentMethods: [
          'card-online',
          'bank-transfer',
          'bank-transfer-legal',
          'dobierka',
        ],
        allowPayOnPickup: true,
      }),
      hostCountry: 'hu',
    })
    assert.deepEqual(ctx.carrierGroups, ['packeta', 'gls'])
    assert.equal(ctx.pickupAvailable, true)
    assert.equal(ctx.payments.includes('bank-transfer-legal'), false)
    assert.equal(ctx.showPayOnPickup, true)
    assert.deepEqual(shippingDeliveryGroups(['nova-poshta-branch']), ['nova-poshta'])
  })
})
