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
  paymentProvider?: string | null
  paymentExpiresAt?: string | null
  canRetry?: boolean
  clientSecret?: string
  publishableKey?: string
  paymentPageUrl?: string
  comment: string | null
  buyerType?: string | null
  taxRegime?: string | null
  taxRatePercent?: number | null
  vatCountryCode?: string | null
  companyLegalName?: string | null
  companyIco?: string | null
  companyDic?: string | null
  companyVatId?: string | null
  companyStreet?: string | null
  companyCity?: string | null
  companyPostalCode?: string | null
  deliveryPostalCode?: string | null
  deliveryCountryCode?: string | null
  items: PublicOrderConfirmationItem[]
}

export type PaymentRetryResult = {
  orderNumber: string
  status: string
  paymentStatus: string | null
  paymentProvider?: string
  clientSecret?: string
  publishableKey?: string
  paymentPageUrl?: string
  paymentExpiresAt?: string | null
}

function confirmationHeaders(confirmationToken?: string): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = confirmationToken?.trim() ?? ''
  if (token) headers['X-Order-Confirmation-Token'] = token
  return headers
}

export async function fetchOrderConfirmation(
  orderNumber: string,
  confirmationToken?: string,
): Promise<PublicOrderConfirmation | null> {
  const res = await fetch(`/api/orders/confirmation/${encodeURIComponent(orderNumber)}`, {
    cache: 'no-store',
    credentials: 'include',
    headers: confirmationHeaders(confirmationToken),
  })
  if (!res.ok) return null
  return (await res.json()) as PublicOrderConfirmation
}

export async function cancelUnpaidOrder(
  orderNumber: string,
  confirmationToken?: string,
): Promise<{ ok: boolean; status?: string; error?: string }> {
  const res = await fetch(
    `/api/orders/confirmation/${encodeURIComponent(orderNumber)}/cancel`,
    {
      method: 'POST',
      cache: 'no-store',
      credentials: 'include',
      headers: confirmationHeaders(confirmationToken),
    },
  )
  const data = (await res.json().catch(() => ({}))) as {
    status?: string
    error?: string
    message?: string
  }
  if (!res.ok) {
    return {
      ok: false,
      error: data.error || data.message || 'Cancel failed',
    }
  }
  return { ok: true, status: data.status }
}

export async function retryOrderPayment(
  orderNumber: string,
  confirmationToken?: string,
  returnBaseUrl?: string,
): Promise<PaymentRetryResult | null> {
  const res = await fetch(
    `/api/orders/confirmation/${encodeURIComponent(orderNumber)}/payment/retry`,
    {
      method: 'POST',
      cache: 'no-store',
      credentials: 'include',
      headers: {
        ...confirmationHeaders(confirmationToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(returnBaseUrl ? { returnBaseUrl } : {}),
    },
  )
  if (!res.ok) return null
  return (await res.json()) as PaymentRetryResult
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

/** BFF → Nest → Stripe Checkout Session retrieve; updates order when webhook lagged. */
export async function syncStripePayment(
  orderNumber: string,
  confirmationToken?: string,
): Promise<{ status: string; paymentStatus: string | null; synced: boolean } | null> {
  const res = await fetch(`/api/payments/stripe/sync/${encodeURIComponent(orderNumber)}`, {
    method: 'POST',
    cache: 'no-store',
    credentials: 'include',
    headers: confirmationHeaders(confirmationToken),
  })
  if (!res.ok) return null
  return (await res.json()) as {
    status: string
    paymentStatus: string | null
    synced: boolean
  }
}
