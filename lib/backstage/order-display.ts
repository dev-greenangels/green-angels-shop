import { formatPersonName } from '@/lib/format-person-name'
import { DEFAULT_STORE_SETTINGS } from '@/lib/settings/defaults'
import { formatStoreAddress } from '@/lib/settings/store-helpers'
import type { BackstageOrderDetail, BackstageOrderListItem } from '@/lib/backstage/orders'

export function formatOrderCustomerName(
  order: Pick<
    BackstageOrderListItem,
    'customerLastName' | 'customerFirstName' | 'customerPatronymic'
  >,
): string {
  return formatPersonName(
    order.customerLastName,
    order.customerFirstName,
    order.customerPatronymic,
  )
}

export function formatOrderReceiverName(order: {
  receiverLastName: string
  receiverFirstName: string
  receiverPatronymic?: string | null
}): string {
  return formatPersonName(
    order.receiverLastName,
    order.receiverFirstName,
    order.receiverPatronymic,
  )
}

export function formatOrderDeliveryLines(
  order: Pick<
    BackstageOrderDetail,
    | 'deliveryMethod'
    | 'deliveryCity'
    | 'deliveryBranch'
    | 'deliveryStreet'
    | 'deliveryHouseNumber'
  >,
  pickupAddress?: string,
): string[] {
  if (order.deliveryMethod === 'pickup') {
    return ['Самовивіз', pickupAddress ?? formatStoreAddress(DEFAULT_STORE_SETTINGS)]
  }

  const lines: string[] = []
  if (order.deliveryCity) lines.push(`Місто: ${order.deliveryCity}`)
  if (order.deliveryBranch) lines.push(`Відділення: ${order.deliveryBranch}`)
  if (order.deliveryStreet) {
    const address = order.deliveryHouseNumber
      ? `${order.deliveryStreet}, ${order.deliveryHouseNumber}`
      : order.deliveryStreet
    lines.push(`Адреса: ${address}`)
  }
  return lines
}

export function isOrderReceiverDifferent(order: BackstageOrderDetail): boolean {
  return (
    order.receiverFirstName !== order.customerFirstName ||
    order.receiverLastName !== order.customerLastName ||
    (order.receiverPatronymic ?? '') !== (order.customerPatronymic ?? '') ||
    order.receiverPhone !== order.customerPhone
  )
}
