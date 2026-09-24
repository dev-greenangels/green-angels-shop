import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildCartOwnedCheckoutPatch,
  buildGlsOwnedCheckoutPatch,
  buildPacketaOwnedCheckoutPatch,
  CART_OWNED_CHECKOUT_KEYS,
} from './cart-checkout-ownership'
import { DEFAULT_CART_CHECKOUT_SETTINGS } from '@/lib/settings/defaults'
import type { CartCheckoutSettings } from '@/lib/settings/types'

function deepMerge<T extends Record<string, unknown>>(base: T, patch: Partial<T>): T {
  const result = { ...base }
  for (const key of Object.keys(patch) as Array<keyof T>) {
    const value = patch[key]
    if (value === undefined) continue
    const current = base[key]
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      current &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      result[key] = deepMerge(
        current as Record<string, unknown>,
        value as Record<string, unknown>,
      ) as T[keyof T]
    } else {
      result[key] = value as T[keyof T]
    }
  }
  return result
}

const packetaA: NonNullable<CartCheckoutSettings['carrierConfigs']>['packeta'] = {
  tariffAmountsAreNet: true,
  cod: {
    carrierCost: {
      enabled: true,
      basis: 'COD_AMOUNT',
      amountsAreNet: true,
      tiers: [{ fromAmount: 0, toAmount: null, fee: 1.1 }],
    },
    cardOnCod: {
      enabled: false,
      percent: 0,
      basis: 'COD_AMOUNT_INCLUDING_VAT',
      chargedTo: 'SENDER',
      affectsCustomerTotal: false,
    },
    customerPrice: {
      mode: 'fixed',
      maxAmount: null,
      feeBase: 'products_subtotal',
      feeAmountsAreNet: true,
      fixedAmount: 2.2,
      tiers: [],
    },
  },
  serviceIdentity: {
    catalog: [
      {
        serviceKey: 'svc-a',
        label: 'Service A',
        customerMethod: 'packeta-courier',
        countryCode: 'SK',
        enabled: true,
      },
    ],
    courierDefaultServiceByCountry: { SK: 'svc-a' },
    boxDefaultServiceByCountry: {},
    boxKindDefaultServiceKey: {},
  },
  services: {
    'packeta-box': { maxLongestSideCm: 100, maxSideSumCm: 200 },
  },
}

const packetaB: NonNullable<CartCheckoutSettings['carrierConfigs']>['packeta'] = {
  ...packetaA,
  tariffAmountsAreNet: false,
  cod: {
    ...packetaA.cod!,
    customerPrice: {
      ...packetaA.cod!.customerPrice,
      fixedAmount: 9.99,
    },
  },
  serviceIdentity: {
    catalog: [
      {
        serviceKey: 'svc-b',
        label: 'Service B',
        customerMethod: 'packeta-courier',
        countryCode: 'CZ',
        enabled: true,
      },
    ],
    courierDefaultServiceByCountry: { CZ: 'svc-b' },
    boxDefaultServiceByCountry: {},
    boxKindDefaultServiceKey: {},
  },
  services: {
    'packeta-box': { maxLongestSideCm: 50, maxSideSumCm: 90 },
  },
}

describe('cart-checkout ownership patches', () => {
  it('Cart-owned patch omits all carrier transport subtrees', () => {
    const cart: CartCheckoutSettings = {
      ...DEFAULT_CART_CHECKOUT_SETTINGS,
      boxUnitPrice: 3.5,
      packagingMode: 'boxes',
      defaultMissingWeightKg: 1.5,
      carrierConfigs: { packeta: packetaA, gls: { tariffAmountsAreNet: true } },
      carrierRateTables: {
        'packeta-box:SK': [{ maxWeightKg: 5, amount: 3 }],
        'gls-courier:SK': [{ maxWeightKg: 10, amount: 4 }],
      },
      carrierSurcharges: {
        'packeta-box:SK': {
          fuelMode: 'separate',
          fuelPercent: 10,
          tollMode: 'none',
          tollPerStartedKgNet: 0,
          maxParcelWeightKg: 15,
        },
      },
      carrierTariffAmountsAreNet: true,
      standardParcelMaxWeightKg: 15,
      cartSize: { enabled: true, limits: [] },
      codFeeAmount: 99,
      codFeeMode: 'fixed',
    }

    const patch = buildCartOwnedCheckoutPatch(cart)

    for (const forbidden of [
      'carrierConfigs',
      'carrierRateTables',
      'carrierSurcharges',
      'cartSize',
      'carrierTariffAmountsAreNet',
      'standardParcelMaxWeightKg',
      'codFeeAmount',
      'codFeeMode',
      'codFeeAmountsAreNet',
    ] as const) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(patch, forbidden),
        false,
        `Cart patch must not include ${forbidden}`,
      )
    }

    assert.equal(patch.boxUnitPrice, 3.5)
    assert.equal(patch.defaultMissingWeightKg, 1.5)
    assert.ok(CART_OWNED_CHECKOUT_KEYS.includes('defaultMissingWeightKg'))
    assert.ok(CART_OWNED_CHECKOUT_KEYS.includes('packagingStrategy'))
  })

  it('stale Cart Save must not overwrite Packeta B after independent Packeta save', () => {
    const serverWithB: CartCheckoutSettings = {
      ...DEFAULT_CART_CHECKOUT_SETTINGS,
      packagingMode: 'boxes',
      boxUnitPrice: 1,
      carrierConfigs: {
        packeta: packetaB,
        gls: { tariffAmountsAreNet: true, services: { 'gls-courier': { maxGirthCm: 300 } } },
      },
      carrierRateTables: {
        'packeta-box:SK': [{ maxWeightKg: 5, amount: 99 }],
        'gls-courier:SK': [{ maxWeightKg: 10, amount: 4 }],
      },
      carrierSurcharges: {
        'packeta-box:SK': {
          fuelMode: 'separate',
          fuelPercent: 18.5,
          tollMode: 'none',
          tollPerStartedKgNet: 0,
          maxParcelWeightKg: 12,
        },
      },
    }

    // Stale Cart tab still holds Packeta A in memory but Cart-owned patch strips it.
    const staleCartTab: CartCheckoutSettings = {
      ...serverWithB,
      boxUnitPrice: 2,
      carrierConfigs: { packeta: packetaA, gls: { tariffAmountsAreNet: false } },
      carrierRateTables: {
        'packeta-box:SK': [{ maxWeightKg: 5, amount: 1 }],
        'gls-courier:SK': [{ maxWeightKg: 10, amount: 1 }],
      },
      carrierSurcharges: {
        'packeta-box:SK': {
          fuelMode: 'none',
          fuelPercent: 0,
          tollMode: 'none',
          tollPerStartedKgNet: 0,
          maxParcelWeightKg: 15,
        },
      },
    }

    const after = deepMerge(
      serverWithB as unknown as Record<string, unknown>,
      buildCartOwnedCheckoutPatch(staleCartTab) as Record<string, unknown>,
    ) as unknown as CartCheckoutSettings

    assert.equal(after.boxUnitPrice, 2)
    assert.deepEqual(after.carrierConfigs?.packeta, packetaB)
    assert.equal(after.carrierConfigs?.gls?.services?.['gls-courier']?.maxGirthCm, 300)
    assert.equal(after.carrierRateTables?.['packeta-box:SK']?.[0]?.amount, 99)
    assert.equal(after.carrierSurcharges?.['packeta-box:SK']?.fuelPercent, 18.5)
    assert.equal(after.carrierSurcharges?.['packeta-box:SK']?.maxParcelWeightKg, 12)
    assert.equal(
      after.carrierConfigs?.packeta?.serviceIdentity?.catalog?.[0]?.serviceKey,
      'svc-b',
    )
    assert.equal(after.carrierConfigs?.packeta?.cod?.customerPrice?.fixedAmount, 9.99)
  })

  it('stale Cart Save must not overwrite GLS-owned config', () => {
    const server: CartCheckoutSettings = {
      ...DEFAULT_CART_CHECKOUT_SETTINGS,
      carrierConfigs: {
        gls: {
          tariffAmountsAreNet: false,
          services: { 'gls-courier': { maxLongestSideCm: 111, maxGirthCm: 222 } },
        },
      },
    }
    const stale: CartCheckoutSettings = {
      ...server,
      minOrderAmount: 50,
      carrierConfigs: {
        gls: {
          tariffAmountsAreNet: true,
          services: { 'gls-courier': { maxLongestSideCm: 1, maxGirthCm: 2 } },
        },
      },
    }
    const after = deepMerge(
      server as unknown as Record<string, unknown>,
      buildCartOwnedCheckoutPatch(stale) as Record<string, unknown>,
    ) as unknown as CartCheckoutSettings
    assert.equal(after.minOrderAmount, 50)
    assert.equal(after.carrierConfigs?.gls?.tariffAmountsAreNet, false)
    assert.equal(after.carrierConfigs?.gls?.services?.['gls-courier']?.maxLongestSideCm, 111)
  })

  it('stale Packeta Save must not overwrite Cart packaging / weight', () => {
    const serverCartB: CartCheckoutSettings = {
      ...DEFAULT_CART_CHECKOUT_SETTINGS,
      packagingMode: 'pallet',
      boxUnitPrice: 7,
      boxMaxWeightKg: 20,
      defaultMissingWeightKg: 2.5,
      packagingStrategy: {
        mode: 'pallet',
        pallet: {
          enabled: true,
          unitPrice: 12,
          capacityByContainerSlug: { '20l': 2 },
          autoPricingEnabled: true,
        },
      },
      cartWeight: {
        enabled: true,
        useFactKg: true,
        useVolumetricKg: true,
        volumetricDivisor: 4000,
      },
      minOrderAmount: 100,
      carrierConfigs: { packeta: packetaA },
      carrierRateTables: { 'packeta-box:SK': [{ maxWeightKg: 5, amount: 3 }] },
      carrierSurcharges: {
        'packeta-box:SK': {
          fuelMode: 'separate',
          fuelPercent: 10,
          tollMode: 'none',
          tollPerStartedKgNet: 0,
          maxParcelWeightKg: 15,
        },
      },
    }

    const stalePacketaTab: CartCheckoutSettings = {
      ...serverCartB,
      packagingMode: 'flat',
      boxUnitPrice: 1,
      boxMaxWeightKg: 1,
      defaultMissingWeightKg: 1,
      packagingStrategy: DEFAULT_CART_CHECKOUT_SETTINGS.packagingStrategy,
      cartWeight: DEFAULT_CART_CHECKOUT_SETTINGS.cartWeight,
      minOrderAmount: 1,
      carrierConfigs: { packeta: packetaB },
      carrierRateTables: {
        'packeta-box:SK': [{ maxWeightKg: 5, amount: 8 }],
        'gls-courier:SK': [{ maxWeightKg: 10, amount: 999 }],
      },
      carrierSurcharges: {
        'packeta-box:SK': {
          fuelMode: 'separate',
          fuelPercent: 20,
          tollMode: 'none',
          tollPerStartedKgNet: 0,
          maxParcelWeightKg: 12,
        },
        'gls-courier:SK': {
          fuelMode: 'none',
          fuelPercent: 0,
          tollMode: 'none',
          tollPerStartedKgNet: 0,
          maxParcelWeightKg: 0,
        },
      },
    }

    const packetaPatch = buildPacketaOwnedCheckoutPatch(
      stalePacketaTab,
      stalePacketaTab.carrierRateTables ?? {},
      stalePacketaTab.carrierSurcharges ?? {},
    )

    assert.equal(Object.prototype.hasOwnProperty.call(packetaPatch, 'packagingMode'), false)
    assert.equal(Object.prototype.hasOwnProperty.call(packetaPatch, 'boxUnitPrice'), false)
    assert.equal(Object.prototype.hasOwnProperty.call(packetaPatch, 'defaultMissingWeightKg'), false)
    assert.equal(Object.prototype.hasOwnProperty.call(packetaPatch, 'cartWeight'), false)
    assert.equal(Object.prototype.hasOwnProperty.call(packetaPatch, 'packagingStrategy'), false)
    assert.equal(Object.prototype.hasOwnProperty.call(packetaPatch, 'minOrderAmount'), false)
    assert.equal(Object.prototype.hasOwnProperty.call(packetaPatch, 'cartSize'), false)
    assert.ok(packetaPatch.carrierRateTables)
    assert.equal(Object.prototype.hasOwnProperty.call(packetaPatch.carrierRateTables, 'gls-courier:SK'), false)
    assert.equal(
      Object.prototype.hasOwnProperty.call(packetaPatch.carrierSurcharges, 'gls-courier:SK'),
      false,
    )

    const after = deepMerge(
      serverCartB as unknown as Record<string, unknown>,
      packetaPatch as Record<string, unknown>,
    ) as unknown as CartCheckoutSettings

    assert.equal(after.packagingMode, 'pallet')
    assert.equal(after.boxUnitPrice, 7)
    assert.equal(after.boxMaxWeightKg, 20)
    assert.equal(after.defaultMissingWeightKg, 2.5)
    assert.equal(after.minOrderAmount, 100)
    assert.equal(after.cartWeight?.volumetricDivisor, 4000)
    assert.equal(after.packagingStrategy?.pallet?.unitPrice, 12)
    // Packeta-owned fields from the save are applied (deepMerge may retain orphan
    // nested map keys from prior server state — pre-existing Settings merge behavior).
    assert.equal(after.carrierConfigs?.packeta?.tariffAmountsAreNet, false)
    assert.equal(after.carrierConfigs?.packeta?.cod?.customerPrice?.fixedAmount, 9.99)
    assert.equal(
      after.carrierConfigs?.packeta?.serviceIdentity?.catalog?.[0]?.serviceKey,
      'svc-b',
    )
    assert.equal(
      after.carrierConfigs?.packeta?.serviceIdentity?.courierDefaultServiceByCountry?.CZ,
      'svc-b',
    )
    assert.equal(after.carrierConfigs?.packeta?.services?.['packeta-box']?.maxLongestSideCm, 50)
    assert.equal(after.carrierRateTables?.['packeta-box:SK']?.[0]?.amount, 8)
  })

  it('GLS-owned patch only touches carrierConfigs.gls', () => {
    const cart: CartCheckoutSettings = {
      ...DEFAULT_CART_CHECKOUT_SETTINGS,
      packagingMode: 'boxes',
      carrierConfigs: {
        packeta: packetaA,
        gls: {
          tariffAmountsAreNet: false,
          services: { 'gls-courier': { maxGirthCm: 333 } },
        },
      },
    }
    const patch = buildGlsOwnedCheckoutPatch(cart)
    assert.deepEqual(Object.keys(patch.carrierConfigs ?? {}), ['gls'])
    assert.equal(Object.prototype.hasOwnProperty.call(patch, 'cartSize'), false)
    assert.equal(Object.prototype.hasOwnProperty.call(patch, 'carrierTariffAmountsAreNet'), false)

    const server: CartCheckoutSettings = {
      ...DEFAULT_CART_CHECKOUT_SETTINGS,
      packagingMode: 'pallet',
      carrierConfigs: {
        packeta: packetaB,
        gls: { tariffAmountsAreNet: true },
      },
    }
    const after = deepMerge(
      server as unknown as Record<string, unknown>,
      patch as Record<string, unknown>,
    ) as unknown as CartCheckoutSettings
    assert.equal(after.packagingMode, 'pallet')
    assert.deepEqual(after.carrierConfigs?.packeta, packetaB)
    assert.equal(after.carrierConfigs?.gls?.services?.['gls-courier']?.maxGirthCm, 333)
    assert.equal(after.carrierConfigs?.gls?.tariffAmountsAreNet, false)
  })
})
