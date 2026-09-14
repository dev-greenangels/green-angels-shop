import type { BackstageOrderDetail } from '@/lib/backstage/orders'

export function formatOrderMoney(amount: number, currency = 'EUR') {
  if (currency === 'UAH') return `${amount.toLocaleString('uk-UA')} ₴`
  return `${amount.toLocaleString('uk-UA')} ${currency}`
}

export function canManualErpSync(order: Pick<
  BackstageOrderDetail,
  'erpSyncStatus' | 'erpNativeId' | 'erpNativeKod'
>): boolean {
  const status = (order.erpSyncStatus ?? 'NOT_REQUIRED').trim()
  if (status === 'SYNCED') return false
  if (status === 'CANCEL_PENDING_ERP' || status === 'CANCEL_SYNCED') return false
  if (
    status === 'FAILED' ||
    status === 'ERP_CONFLICT' ||
    status === 'PENDING_ERP' ||
    status === 'RETRYING'
  ) {
    return true
  }
  return !order.erpNativeId?.trim() && !order.erpNativeKod?.trim()
}

export function taxRegimeLabel(regime: string | null | undefined): string {
  switch ((regime ?? '').trim()) {
    case 'seller':
      return 'Seller VAT (OSS inactive / seller country)'
    case 'destination':
      return 'Destination VAT (OSS active)'
    case 'reverse_charge':
      return 'Reverse charge (B2B)'
    default:
      return regime?.trim() || '—'
  }
}

export function buyerTypeLabel(buyerType: string | null | undefined): string {
  if (buyerType === 'company') return 'B2B'
  if (buyerType === 'individual') return 'B2C'
  return buyerType?.trim() || '—'
}

export function countryCodeLabel(code: string | null | undefined): string {
  const c = (code ?? '').trim().toUpperCase()
  if (!c) return '—'
  const names: Record<string, string> = {
    SK: 'Slovakia',
    AT: 'Austria',
    HU: 'Hungary',
    CZ: 'Czechia',
    DE: 'Germany',
    PL: 'Poland',
    UA: 'Ukraine',
  }
  return names[c] ? `${names[c]} (${c})` : c
}

export type OrderTimelineEvent = {
  key: string
  label: string
  at: string
}

export function buildOrderTimeline(
  order: BackstageOrderDetail,
): OrderTimelineEvent[] {
  const events: OrderTimelineEvent[] = [
    { key: 'created', label: 'Створено', at: order.createdAt },
  ]
  if (order.paidAt) events.push({ key: 'paid', label: 'Оплачено', at: order.paidAt })
  if (order.erpSyncedAt) {
    events.push({ key: 'erp', label: 'Синхронізовано з ABRA', at: order.erpSyncedAt })
  } else if (order.erpLastSyncAt) {
    events.push({
      key: 'erp-attempt',
      label: 'Остання спроба ERP',
      at: order.erpLastSyncAt,
    })
  }
  if (order.shippedAt) events.push({ key: 'shipped', label: 'Відправлено', at: order.shippedAt })
  if (order.deliveredAt) {
    events.push({ key: 'delivered', label: 'Доставлено', at: order.deliveredAt })
  }
  if (order.cancelledAt) {
    events.push({ key: 'cancelled', label: 'Скасовано', at: order.cancelledAt })
  }
  return events.sort((a, b) => a.at.localeCompare(b.at))
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}
