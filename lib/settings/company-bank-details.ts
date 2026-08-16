import type {
  CartCheckoutSettings,
  CheckoutBankDetails,
  StoreContactSettings,
} from '@/lib/settings/types'

export function hasCompanyBankDetails(bank: CheckoutBankDetails | null | undefined): boolean {
  if (!bank) return false
  return Boolean(
    bank.organizationName ||
      bank.edrpou ||
      bank.iban ||
      bank.bankName ||
      bank.mfo ||
      bank.bic ||
      bank.dic ||
      bank.icDph ||
      bank.legalAddress ||
      bank.taxStatus,
  )
}

export function resolveCheckoutBankDetails(
  cart: Pick<CartCheckoutSettings, 'bankDetailsSource' | 'bankDetails'>,
  store: Pick<StoreContactSettings, 'companyDetails'>,
): CheckoutBankDetails {
  if (cart.bankDetailsSource === 'store') {
    return store.companyDetails
  }
  return cart.bankDetails
}
