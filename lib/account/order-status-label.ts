/** Prefer storefront i18n for known system statuses; API label only as last resort. */

const SYSTEM_STATUSES = new Set([
  'PENDING',
  'AWAITING_PAYMENT',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
])

type StatusTranslator = {
  (key: string): string
  has: (key: string) => boolean
}

export function accountOrderStatusLabel(
  status: string,
  tAccount: StatusTranslator,
  apiLabel?: string | null,
): string {
  const code = status.trim().toUpperCase() || 'PENDING'
  const key = `orderStatus.${code}`
  if (SYSTEM_STATUSES.has(code) && tAccount.has(key)) {
    return tAccount(key)
  }
  if (apiLabel?.trim()) return apiLabel.trim()
  if (tAccount.has(key)) return tAccount(key)
  return code
}
