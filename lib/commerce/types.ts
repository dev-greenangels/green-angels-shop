export type CurrencyInfo = {
  code: string
  symbol: string
  decimals: number
  name: string
  isoNumericCode: number | null
  isActive: boolean
  sortOrder: number
  translations: Array<{ locale: string; name: string }>
}

export type UnitOfMeasureInfo = {
  id: string
  code: string
  symbol: string
  type: string
  decimals: number
  name: string
  isActive: boolean
  sortOrder: number
  translations: Array<{ locale: string; name: string }>
}

export type CommerceDefaultsSettings = {
  defaultCurrencyCode: string
  defaultSalesUnitCode: string
}

export type PublicCommerceSettings = {
  defaultCurrency: CurrencyInfo
  defaultSalesUnit: UnitOfMeasureInfo
  currencies: CurrencyInfo[]
  units: UnitOfMeasureInfo[]
}
