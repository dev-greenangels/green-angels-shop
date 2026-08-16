import type {
  CartCheckoutSettings,
  CheckoutBankDetails,
  CheckoutNextStepItem,
} from '@/lib/settings/types'
import {
  DEFAULT_CART_CHECKOUT_SETTINGS,
  DEFAULT_CHECKOUT_BANK_DETAILS,
  DEFAULT_CHECKOUT_NEXT_STEPS,
} from '@/lib/settings/defaults'
import {
  CHECKOUT_DELIVERY_METHODS,
  CHECKOUT_PAYMENT_METHODS,
  type CheckoutDeliveryMethodSlug,
  type CheckoutPaymentMethodSlug,
} from '@/lib/checkout/methods'

function normalizeMethodList<T extends string>(
  raw: unknown,
  allowed: readonly T[],
  fallback: T[],
): T[] {
  if (!Array.isArray(raw)) return [...fallback]
  const allowedSet = new Set(allowed)
  const filtered = raw.filter(
    (value): value is T => typeof value === 'string' && allowedSet.has(value as T),
  )
  return filtered.length ? filtered : [...fallback]
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isOnlineCardProvider(value: unknown): value is CartCheckoutSettings['onlineCardProvider'] {
  return value === 'monopay' || value === 'stripe'
}

function isOnlineCardErpExportMode(
  value: unknown,
): value is CartCheckoutSettings['onlineCardErpExportMode'] {
  return value === 'immediate' || value === 'on_paid'
}

function isPackagingMode(value: unknown): value is CartCheckoutSettings['packagingMode'] {
  return value === 'flat' || value === 'boxes'
}

function isCodFeeMode(value: unknown): value is CartCheckoutSettings['codFeeMode'] {
  return value === 'fixed' || value === 'percent'
}

function normalizeDeliveryWeightRules(
  raw: unknown,
): CartCheckoutSettings['deliveryWeightRules'] {
  if (!Array.isArray(raw)) return []
  const allowedSet = new Set(CHECKOUT_DELIVERY_METHODS)
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as { maxWeightKg?: unknown; allowedMethods?: unknown }
      const maxWeightKg = Number(row.maxWeightKg)
      if (!Number.isFinite(maxWeightKg) || maxWeightKg <= 0) return null
      const methods = Array.isArray(row.allowedMethods)
        ? row.allowedMethods.filter(
            (m): m is CheckoutDeliveryMethodSlug =>
              typeof m === 'string' && allowedSet.has(m as CheckoutDeliveryMethodSlug),
          )
        : []
      if (!methods.length) return null
      return { maxWeightKg, allowedMethods: methods }
    })
    .filter(
      (item): item is CartCheckoutSettings['deliveryWeightRules'][number] => Boolean(item),
    )
}

function normalizeBankDetails(raw: unknown): CheckoutBankDetails {
  const source =
    raw && typeof raw === 'object' ? (raw as Partial<CheckoutBankDetails>) : {}
  return {
    organizationName:
      asTrimmedString(source.organizationName) ||
      DEFAULT_CHECKOUT_BANK_DETAILS.organizationName,
    edrpou: asTrimmedString(source.edrpou) || DEFAULT_CHECKOUT_BANK_DETAILS.edrpou,
    iban: asTrimmedString(source.iban) || DEFAULT_CHECKOUT_BANK_DETAILS.iban,
    bankName: asTrimmedString(source.bankName) || DEFAULT_CHECKOUT_BANK_DETAILS.bankName,
    mfo: asTrimmedString(source.mfo) || DEFAULT_CHECKOUT_BANK_DETAILS.mfo,
    legalAddress:
      asTrimmedString(source.legalAddress) || DEFAULT_CHECKOUT_BANK_DETAILS.legalAddress,
    taxStatus: asTrimmedString(source.taxStatus) || DEFAULT_CHECKOUT_BANK_DETAILS.taxStatus,
    bic: asTrimmedString(source.bic) || DEFAULT_CHECKOUT_BANK_DETAILS.bic,
    dic: asTrimmedString(source.dic) || DEFAULT_CHECKOUT_BANK_DETAILS.dic,
    icDph: asTrimmedString(source.icDph) || DEFAULT_CHECKOUT_BANK_DETAILS.icDph,
  }
}

export function normalizeCheckoutBankDetails(raw: unknown): CheckoutBankDetails {
  return normalizeBankDetails(raw)
}

function normalizeNextSteps(raw: unknown): CheckoutNextStepItem[] {
  if (!Array.isArray(raw)) {
    return DEFAULT_CHECKOUT_NEXT_STEPS.map((step) => ({ ...step }))
  }
  const steps = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Partial<CheckoutNextStepItem>
      const title = asTrimmedString(row.title)
      const description = asTrimmedString(row.description)
      if (!title && !description) return null
      return { title, description }
    })
    .filter((item): item is CheckoutNextStepItem => Boolean(item))

  return steps.length
    ? steps
    : DEFAULT_CHECKOUT_NEXT_STEPS.map((step) => ({ ...step }))
}

export function normalizeCartCheckoutSettings(
  raw: Partial<CartCheckoutSettings> | null | undefined,
): CartCheckoutSettings {
  const base = { ...DEFAULT_CART_CHECKOUT_SETTINGS, ...raw }

  let deliveryMode = base.deliveryMode
  if (deliveryMode !== 'free' && deliveryMode !== 'carrier_rates' && deliveryMode !== 'fixed') {
    deliveryMode =
      base.deliveryAmount > 0 ? 'fixed' : DEFAULT_CART_CHECKOUT_SETTINGS.deliveryMode
  }

  return {
    ...base,
    deliveryMode,
    deliveryAmount: Math.max(0, Number(base.deliveryAmount) || 0),
    packagingAmount: Math.max(0, Number(base.packagingAmount) || 0),
    packagingMode: isPackagingMode(base.packagingMode)
      ? base.packagingMode
      : DEFAULT_CART_CHECKOUT_SETTINGS.packagingMode,
    boxMaxWeightKg: Math.max(0, Number(base.boxMaxWeightKg) || 0),
    boxMaxVolumeL: Math.max(0, Number(base.boxMaxVolumeL) || 0),
    boxUnitPrice: Math.max(0, Number(base.boxUnitPrice) || 0),
    boxesPerPallet: Math.max(0, Math.floor(Number(base.boxesPerPallet) || 0)),
    palletSurcharge: Math.max(0, Number(base.palletSurcharge) || 0),
    taxRatePercent: Math.max(0, Number(base.taxRatePercent) || 0),
    taxAppliesToFees: Boolean(base.taxAppliesToFees),
    belowMinPackagingFee: Math.max(0, Number(base.belowMinPackagingFee) || 0),
    minOrderAmount:
      base.minOrderAmount != null && base.minOrderAmount > 0 ? base.minOrderAmount : null,
    enabledDeliveryMethods: normalizeMethodList<CheckoutDeliveryMethodSlug>(
      Array.isArray(base.enabledDeliveryMethods)
        ? base.enabledDeliveryMethods.map((m) =>
            m === ('dpd-courier' as string) ? 'gls-courier' : m,
          )
        : base.enabledDeliveryMethods,
      CHECKOUT_DELIVERY_METHODS,
      DEFAULT_CART_CHECKOUT_SETTINGS.enabledDeliveryMethods,
    ),
    enabledPaymentMethods: normalizeMethodList<CheckoutPaymentMethodSlug>(
      base.enabledPaymentMethods,
      CHECKOUT_PAYMENT_METHODS,
      DEFAULT_CART_CHECKOUT_SETTINGS.enabledPaymentMethods,
    ),
    showPromoCode: base.showPromoCode !== false,
    deliveryWeightRules: normalizeDeliveryWeightRules(base.deliveryWeightRules),
    carrierRateTables: base.carrierRateTables ?? {},
    cartWeight: (() => {
      const cw = base.cartWeight ?? DEFAULT_CART_CHECKOUT_SETTINGS.cartWeight
      const divisor = Number(cw.volumetricDivisor)
      return {
        enabled: cw.enabled === true,
        useFactKg: cw.useFactKg !== false,
        useVolumetricKg: cw.useVolumetricKg === true,
        volumetricDivisor:
          Number.isFinite(divisor) && divisor > 0
            ? divisor
            : DEFAULT_CART_CHECKOUT_SETTINGS.cartWeight.volumetricDivisor,
      }
    })(),
    codFeeAmount: Math.max(0, Number(base.codFeeAmount) || 0),
    codFeeMode: isCodFeeMode(base.codFeeMode)
      ? base.codFeeMode
      : DEFAULT_CART_CHECKOUT_SETTINGS.codFeeMode,
    onlineCardProvider: isOnlineCardProvider(base.onlineCardProvider)
      ? base.onlineCardProvider
      : DEFAULT_CART_CHECKOUT_SETTINGS.onlineCardProvider,
    onlineCardErpExportMode: isOnlineCardErpExportMode(base.onlineCardErpExportMode)
      ? base.onlineCardErpExportMode
      : DEFAULT_CART_CHECKOUT_SETTINGS.onlineCardErpExportMode,
    bankDetailsSource: base.bankDetailsSource === 'store' ? 'store' : 'cart',
    bankDetails: normalizeBankDetails(base.bankDetails),
    paymentPurposeTemplate:
      asTrimmedString(base.paymentPurposeTemplate) ||
      DEFAULT_CART_CHECKOUT_SETTINGS.paymentPurposeTemplate,
    nextSteps: normalizeNextSteps(base.nextSteps),
    gdprConsentText:
      asTrimmedString(base.gdprConsentText) || DEFAULT_CART_CHECKOUT_SETTINGS.gdprConsentText,
    allowShipmentSplit: base.allowShipmentSplit !== false,
    orderPdfDownloadEnabled: base.orderPdfDownloadEnabled !== false,
    orderPdfEmailEnabled: base.orderPdfEmailEnabled !== false,
    orderPdfTitle: asTrimmedString(base.orderPdfTitle),
  }
}

export function pickDefaultDeliveryMethod(
  enabled: CheckoutDeliveryMethodSlug[],
): CheckoutDeliveryMethodSlug {
  if (!enabled.length) {
    return DEFAULT_CART_CHECKOUT_SETTINGS.enabledDeliveryMethods[0]
  }
  // Prefer a priced carrier method over free pickup so summary doesn't show
  // «Free» before the customer intentionally chooses self-pickup.
  const nonPickup = enabled.find((method) => method !== 'pickup')
  return nonPickup ?? enabled[0]
}

export function pickDefaultPaymentMethod(
  enabled: CheckoutPaymentMethodSlug[],
): CheckoutPaymentMethodSlug {
  return enabled[0] ?? DEFAULT_CART_CHECKOUT_SETTINGS.enabledPaymentMethods[0]
}

export function formatPaymentPurpose(
  template: string,
  orderNumbers: string[],
): string {
  const primary = orderNumbers[0] ?? ''
  const all = orderNumbers.join(', ')
  return template
    .replaceAll('{orderNumber}', primary)
    .replaceAll('{orderNumbers}', all)
}
