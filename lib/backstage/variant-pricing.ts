export type QuantityDiscountType = 'fixed_price' | 'percent'

export type VariantQuantityPriceDraft = {
  clientId: string
  minQuantity: string
  discountType: QuantityDiscountType
  value: string
  validFrom: string
  validTo: string
}

export function createQuantityPriceDraft(
  partial?: Partial<VariantQuantityPriceDraft>,
): VariantQuantityPriceDraft {
  return {
    clientId: crypto.randomUUID(),
    minQuantity: '',
    discountType: 'fixed_price',
    value: '',
    validFrom: '',
    validTo: '',
    ...partial,
  }
}

export function resolveDiscountUnitPrice(
  basePrice: number,
  discountType: QuantityDiscountType,
  value: number,
): number {
  if (discountType === 'percent') {
    return Math.round(basePrice * (1 - value / 100) * 100) / 100
  }
  return value
}

export function isoToDateInput(iso: string | null | undefined): string {
  if (!iso?.trim()) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function formatAvailableFromDisplay(iso: string | null | undefined): string | undefined {
  if (!iso?.trim()) return undefined
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return undefined
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()
  return `${day}.${month}.${year}`
}
