import type { FetchedPublicSiteSettings } from '@/lib/settings/fetch'
import type { PublicSiteSettings, StoreContactSettings } from '@/lib/settings/types'

type WithdrawalSlice = {
  returnAddressMode?: 'store' | 'custom'
  customReturnAddress?: {
    organizationName?: string
    street?: string
    city?: string
    postalCode?: string
    country?: string
  }
}

function formatCustomAddress(address: NonNullable<WithdrawalSlice['customReturnAddress']>): string {
  return [
    address.organizationName,
    address.street,
    [address.postalCode, address.city].filter(Boolean).join(' '),
    address.country,
  ]
    .filter((line) => line?.trim())
    .join('\n')
}

export function resolveWithdrawalReturnAddressText(
  fetched: FetchedPublicSiteSettings | PublicSiteSettings,
  store: StoreContactSettings,
): string {
  const settings = 'settings' in fetched ? fetched.settings : fetched
  const withdrawal = (settings as { withdrawal?: WithdrawalSlice }).withdrawal
  if (withdrawal?.returnAddressMode === 'custom' && withdrawal.customReturnAddress) {
    const custom = formatCustomAddress(withdrawal.customReturnAddress)
    if (custom.trim()) return custom
  }
  return [store.companyDetails?.organizationName, store.addressLine1, store.addressLine2]
    .filter((line) => line?.trim())
    .join('\n')
}
