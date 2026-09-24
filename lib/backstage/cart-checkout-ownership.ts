/**
 * Backoffice cart.checkout PATCH ownership.
 *
 * CART owns global checkout + packaging + weight engine.
 * Each carrier tab owns its transport subtree only.
 *
 * deepMerge on the server preserves keys omitted from the patch — so Cart Save
 * must NOT re-send Packeta/GLS/NP-owned fields (stale-tab overwrite).
 */

import type { CartCheckoutSettings, CarrierConfigs } from '@/lib/settings/types'

const PACKETA_METHOD_PREFIXES = ['packeta-box', 'packeta-courier'] as const
const GLS_METHOD_PREFIXES = ['gls-courier'] as const
const NOVA_POSHTA_METHOD_PREFIXES = [
  'nova-poshta-branch',
  'nova-poshta-locker',
  'nova-poshta-courier',
] as const

function isKeyForMethods(key: string, methods: readonly string[]): boolean {
  const trimmed = key.trim()
  return methods.some(
    (method) => trimmed === method || trimmed.startsWith(`${method}:`),
  )
}

function filterRecordByMethods<T>(
  record: Record<string, T> | undefined,
  methods: readonly string[],
): Record<string, T> {
  const out: Record<string, T> = {}
  if (!record) return out
  for (const [key, value] of Object.entries(record)) {
    if (isKeyForMethods(key, methods)) out[key] = value
  }
  return out
}

/** Keys Cart Save is allowed to PATCH. Everything else stays server-owned. */
export const CART_OWNED_CHECKOUT_KEYS = [
  'showDelivery',
  'showPackaging',
  'showTax',
  'showPromoCode',
  'deliveryMode',
  'deliveryAmount',
  'packagingAmount',
  'packagingMode',
  'boxMaxWeightKg',
  'boxMaxVolumeL',
  'boxUnitPrice',
  'boxesPerPallet',
  'palletSurcharge',
  'taxRatePercent',
  'taxIncluded',
  'taxAppliesToFees',
  'deliveryFreeForPickup',
  'minOrderAmount',
  'belowMinOrderBehavior',
  'belowMinPackagingFee',
  'wholesalerMinOrderAmount',
  'wholesalerBelowMinOrderBehavior',
  'wholesalerBelowMinPackagingFee',
  'enabledDeliveryMethods',
  'enabledPaymentMethods',
  'deliveryWeightRules',
  'packagingAmountsAreNet',
  'cartWeight',
  'packagingStrategy',
  /** Global shipping-weight fallback when a variant has no weight (before carrier). */
  'defaultMissingWeightKg',
  // codFee* intentionally omitted — carrier tabs own customer COD pricing;
  // legacy cart.checkout.codFee* remain server-side compatibility only.
  'onlineCardProvider',
  'onlineCardErpExportMode',
  'bankDetailsSource',
  'bankDetails',
  'paymentPurposeTemplate',
  'nextSteps',
  'gdprConsentText',
  'allowShipmentSplit',
  'orderPdfDownloadEnabled',
  'orderPdfEmailEnabled',
  'orderPdfTitle',
  'allowPayOnPickup',
  'newOrderNotifyEmailEnabled',
  'newOrderNotifyEmail',
] as const satisfies ReadonlyArray<keyof CartCheckoutSettings>

export type CartOwnedCheckoutKey = (typeof CART_OWNED_CHECKOUT_KEYS)[number]

/**
 * Build Cart-owned PATCH only.
 * Intentionally omits: carrierConfigs, carrierRateTables, carrierSurcharges,
 * cartSize, carrierTariffAmountsAreNet, standardParcelMaxWeightKg.
 */
export function buildCartOwnedCheckoutPatch(
  cart: CartCheckoutSettings,
): Partial<CartCheckoutSettings> {
  const patch: Partial<CartCheckoutSettings> = {}
  for (const key of CART_OWNED_CHECKOUT_KEYS) {
    const value = cart[key]
    if (value !== undefined) {
      ;(patch as Record<string, unknown>)[key] = value
    }
  }
  return patch
}

/**
 * Packeta-owned cart.checkout PATCH.
 * Does not touch packaging, cartWeight, min-order, GLS/NP configs, or non-Packeta rates.
 * Omits cartSize — server normalize re-projects limits from carrierConfigs.*.services.
 * Omits defaultMissingWeightKg — Cart weight section owns that global field.
 */
export function buildPacketaOwnedCheckoutPatch(
  cart: CartCheckoutSettings,
  rateTablesPatch: NonNullable<CartCheckoutSettings['carrierRateTables']>,
  surchargesPatch: NonNullable<CartCheckoutSettings['carrierSurcharges']>,
): Partial<CartCheckoutSettings> {
  const packetaConfig = cart.carrierConfigs?.packeta
  const carrierConfigs: CarrierConfigs = {
    ...(packetaConfig ? { packeta: packetaConfig } : { packeta: {} }),
  }

  return {
    // Do not patch root carrierTariffAmountsAreNet — Packeta NET lives under
    // carrierConfigs.packeta.tariffAmountsAreNet (root flag = legacy fallback only).
    carrierConfigs,
    /**
     * COMPATIBILITY: Packeta UI still mirrors parcel max into this legacy field
     * for installs without per-service maxParcelWeightKg. Prefer surcharge value at runtime.
     */
    standardParcelMaxWeightKg: cart.standardParcelMaxWeightKg,
    carrierRateTables: filterRecordByMethods(rateTablesPatch, PACKETA_METHOD_PREFIXES),
    carrierSurcharges: filterRecordByMethods(surchargesPatch, PACKETA_METHOD_PREFIXES),
  }
}

/**
 * Ensure Packeta country grid placeholders (empty []) are included for Packeta keys only.
 */
export function buildPacketaCarrierRateTablesOwnedPatch(
  tables: CartCheckoutSettings['carrierRateTables'] | undefined,
  buildFullPacketaPatch: (
    tables: CartCheckoutSettings['carrierRateTables'] | undefined,
  ) => NonNullable<CartCheckoutSettings['carrierRateTables']>,
): NonNullable<CartCheckoutSettings['carrierRateTables']> {
  return filterRecordByMethods(buildFullPacketaPatch(tables), PACKETA_METHOD_PREFIXES)
}

export function buildPacketaCarrierSurchargesOwnedPatch(
  surcharges: CartCheckoutSettings['carrierSurcharges'] | undefined,
): NonNullable<CartCheckoutSettings['carrierSurcharges']> {
  return filterRecordByMethods(surcharges ?? {}, PACKETA_METHOD_PREFIXES)
}

/**
 * GLS-owned PATCH — only carrierConfigs.gls (+ optional NET mirror for GLS).
 * Does not send full carrierConfigs (would risk stale Packeta overwrite if nested wrong;
 * deepMerge keeps packeta when only `gls` key is patched).
 */
export function buildGlsOwnedCheckoutPatch(
  cart: CartCheckoutSettings,
): Partial<CartCheckoutSettings> {
  const glsConfig = cart.carrierConfigs?.gls ?? {}
  return {
    // Root carrierTariffAmountsAreNet is legacy fallback only — GLS NET is under gls.
    carrierConfigs: {
      gls: glsConfig,
    },
  }
}

export function isPacketaRateTableKey(key: string): boolean {
  return isKeyForMethods(key, PACKETA_METHOD_PREFIXES)
}

export function isGlsRateTableKey(key: string): boolean {
  return isKeyForMethods(key, GLS_METHOD_PREFIXES)
}

export function isNovaPoshtaRateTableKey(key: string): boolean {
  return isKeyForMethods(key, NOVA_POSHTA_METHOD_PREFIXES)
}
