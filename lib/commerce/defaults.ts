import type { CurrencyInfo, PublicCommerceSettings, UnitOfMeasureInfo } from '@/lib/commerce/types'

export const DEFAULT_CURRENCY: CurrencyInfo = {
  code: 'UAH',
  symbol: '₴',
  decimals: 2,
  name: 'Гривня',
  isoNumericCode: 980,
  isActive: true,
  sortOrder: 1,
  translations: [{ locale: 'uk', name: 'Гривня' }],
}

export const DEFAULT_SALES_UNIT: UnitOfMeasureInfo = {
  id: '00000000-0000-4000-8000-000000000001',
  code: 'pcs',
  symbol: 'шт',
  type: 'COUNT',
  decimals: 0,
  name: 'Штука',
  isActive: true,
  sortOrder: 1,
  translations: [{ locale: 'uk', name: 'Штука' }],
}

export const DEFAULT_COMMERCE_SETTINGS: PublicCommerceSettings = {
  defaultCurrency: DEFAULT_CURRENCY,
  defaultSalesUnit: DEFAULT_SALES_UNIT,
  currencies: [DEFAULT_CURRENCY],
  units: [DEFAULT_SALES_UNIT],
}
