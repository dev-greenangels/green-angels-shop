export type PublicOrderConfirmationItem = {
  id: string
  quantity: number
  priceAtPurchase: number
  lineTotal: number
  productName: string
  productSlug: string
  variantLabel: string | null
}

export type PublicOrderConfirmation = {
  id: string
  orderNumber: string
  status: string
  currency: string
  createdAt: string
  totalAmount: number
  productsSubtotal: number | null
  deliveryAmount: number | null
  packagingAmount: number | null
  taxAmount: number | null
  customerFirstName: string
  customerLastName: string
  customerPatronymic: string | null
  customerPhone: string
  customerEmail: string | null
  receiverFirstName: string
  receiverLastName: string
  receiverPatronymic: string | null
  receiverPhone: string
  deliveryMethod: string
  deliveryCity: string | null
  deliveryBranch: string | null
  deliveryStreet: string | null
  deliveryHouseNumber: string | null
  paymentMethod: string
  paymentStatus: string | null
  comment: string | null
  items: PublicOrderConfirmationItem[]
}

export async function fetchOrderConfirmation(
  orderNumber: string,
  confirmationToken?: string,
): Promise<PublicOrderConfirmation | null> {
  const token = confirmationToken?.trim() ?? ''
  const headers: Record<string, string> = {}
  if (token) {
    headers['X-Order-Confirmation-Token'] = token
  }

  const res = await fetch(`/api/orders/confirmation/${encodeURIComponent(orderNumber)}`, {
    cache: 'no-store',
    credentials: 'include',
    headers,
  })
  if (!res.ok) return null
  return (await res.json()) as PublicOrderConfirmation
}

/** BFF → Nest → Mono invoice/status; updates order when webhook lagged. */
export async function syncMonopayPayment(
  orderNumber: string,
  syncToken: string,
): Promise<{ status: string; paymentStatus: string | null; synced: boolean } | null> {
  const token = syncToken.trim()
  if (!token) return null

  const res = await fetch(`/api/payments/monopay/sync/${encodeURIComponent(orderNumber)}`, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'X-Monopay-Sync-Token': token },
  })
  if (!res.ok) return null
  return (await res.json()) as {
    status: string
    paymentStatus: string | null
    synced: boolean
  }
}
