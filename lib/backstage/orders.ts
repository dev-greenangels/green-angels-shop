import type { OrderStatus } from '@/lib/backstage/order-status'

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[]
    error?: string
  }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

export type BackstageOrderListItem = {
  id: string
  orderNumber: string
  status: OrderStatus
  statusLabel?: string
  totalAmount: number
  currency: string
  customerFirstName: string
  customerLastName: string
  customerPatronymic: string | null
  customerPhone: string
  customerEmail: string | null
  itemCount: number
  trackingNumber?: string | null
  createdAt: string
}

export type BackstageOrderItem = {
  id: string
  quantity: number
  priceAtPurchase: number
  commercialUnitPrice?: number | null
  commercialLineAmount?: number | null
  lineTotal: number
  productVariantId: string
  productName: string
  latinName?: string | null
  productSlug: string
  variantLabel: string | null
  sku: string | null
  ean?: string | null
  imageUrl?: string | null
}

export type BackstageOrderDetail = BackstageOrderListItem & {
  receiverFirstName: string
  receiverLastName: string
  receiverPatronymic: string | null
  receiverPhone: string
  receiverCompanyName?: string | null
  deliveryMethod: string
  deliveryCity: string | null
  deliveryBranch: string | null
  deliveryBranchLabel?: string | null
  /** Packeta internal serviceKey snapshot at order create. */
  packetaServiceKey?: string | null
  /** Opaque Packeta carrier id snapshot. */
  packetaCarrierId?: string | null
  /** branch | box | carrier */
  packetaPickupPointKind?: string | null
  deliveryStreet: string | null
  deliveryHouseNumber: string | null
  deliveryPostalCode?: string | null
  deliveryCountryCode?: string | null
  countrySiteCode?: string | null
  locale?: string | null
  paymentMethod: string
  paymentStatus?: string | null
  paymentProvider?: string | null
  stripePaymentId?: string | null
  monopayInvoiceId?: string | null
  paidAt?: string | null
  paymentExpiresAt?: string | null
  /** Bank-transfer only: end-of-business-day deadline (ISO). preferredShipDate never changes this. */
  paymentDueAt?: string | null
  /** COD at create; card/bank set on payment success (paidAt + shippingLeadTimeMaxBusinessDays). */
  shipByDate?: string | null
  productsSubtotal?: number | null
  deliveryAmount?: number | null
  packagingAmount?: number | null
  /** Immutable checkout packaging fee box count snapshot. */
  packagingBoxCount?: number | null
  /** Immutable checkout packaging fee pallet count snapshot. */
  packagingPalletCount?: number | null
  /** Warehouse packing summary (actual packages + completion). */
  packing?: {
    phase: 'not_started' | 'in_progress' | 'completed'
    estimatedBoxCount: number | null
    estimatedPalletCount: number | null
    packagingAmount: number | null
    actualPackageCount: number
    boxDifference: number | null
    packingCompletedAt: string | null
  }
  taxAmount?: number | null
  codFeeAmount?: number | null
  pointsDiscountAmount?: number | null
  comment: string | null
  preferredShipDate?: string | null
  trackingCarrier?: string | null
  npDocumentRef?: string | null
  trackingSyncedAt?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  onlineWithdrawalActionEnabled?: boolean
  cancellationReasonId?: string | null
  cancellationReasonName?: string | null
  cancellationSource?: string | null
  cancellationNote?: string | null
  cancelledAt?: string | null
  /** Correlation only: ext:GA:{uuid}. Not native ERP number. */
  externalErpId?: string | null
  erpSyncStatus?: string | null
  erpNativeId?: string | null
  erpNativeKod?: string | null
  erpSyncAttempts?: number
  erpLastErrorCode?: string | null
  erpLastErrorMessage?: string | null
  erpLastSyncAt?: string | null
  erpSyncedAt?: string | null
  erpAdvanceExternalId?: string | null
  erpAdvanceNativeId?: string | null
  erpAdvanceKod?: string | null
  erpAdvanceSyncStatus?: string | null
  erpAdvanceSyncedAt?: string | null
  erpAdvanceLastError?: string | null
  erpStripePayExternalId?: string | null
  erpStripePayNativeId?: string | null
  erpStripePaySyncStatus?: string | null
  erpStripePayLastError?: string | null
  erpBankPayExternalId?: string | null
  erpBankPayNativeId?: string | null
  erpBankPayNativeKod?: string | null
  erpBankPaySyncStatus?: string | null
  erpBankPaySyncedAt?: string | null
  erpBankPayLastError?: string | null
  buyerType?: string | null
  taxRegime?: string | null
  taxRatePercent?: number | null
  taxCountryCode?: string | null
  vatCountryCode?: string | null
  companyLegalName?: string | null
  companyIco?: string | null
  companyDic?: string | null
  companyVatId?: string | null
  companyStreet?: string | null
  companyCity?: string | null
  companyPostalCode?: string | null
  billingStreet?: string | null
  billingHouseNumber?: string | null
  billingCity?: string | null
  billingPostalCode?: string | null
  billingCountryCode?: string | null
  billingFirstName?: string | null
  billingLastName?: string | null
  viesCheck?: {
    valid: boolean | null
    vatCountryCode: string
    vatNumber: string
    checkedAt: string
    viesRequestDate: string | null
    requestIdentifier: string | null
    registeredName: string | null
    registeredAddress: string | null
    source: string
  } | null
  viesStatus?: 'VALID' | 'INVALID' | 'ERROR' | 'NOT_CHECKED'
  /** Present on Retry VIES responses only. */
  flexiNoteSync?: {
    ok: boolean
    skipped?: boolean
    message: string
  }
  items: BackstageOrderItem[]
  confirmationPdfPresent?: boolean
  communications?: BackstageOrderCommunication[]
}

export type BackstageOrderCommunication = {
  id: string
  orderId: string | null
  orderNumber: string | null
  audience: string
  type: string
  source: string
  status: string
  toEmail: string | null
  subjectSnapshot: string | null
  bodySnapshot?: string | null
  locale?: string | null
  createdByUserId?: string | null
  hasAttachment: boolean
  errorMessage: string | null
  providerMessageId: string | null
  sentAt: string | null
  createdAt: string
}

export type BackstageOrdersFilters = {
  search?: string
  status?: string
  excludeCancelled?: boolean
  page?: number
  pageSize?: number
}

export type PaginatedBackstageOrders = {
  items: BackstageOrderListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type PatchOrderPayload = {
  status?: OrderStatus
  cancellationReasonId?: string
  cancellationNote?: string | null
  trackingNumber?: string | null
  trackingCarrier?: string | null
  npDocumentRef?: string | null
  onlineWithdrawalActionEnabled?: boolean
}

export async function fetchBackstageOrders(
  params?: BackstageOrdersFilters,
): Promise<PaginatedBackstageOrders> {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.status && params.status !== 'all') {
    query.set('status', params.status.toUpperCase())
  }
  if (params?.excludeCancelled) query.set('excludeCancelled', '1')
  if (params?.page != null) query.set('page', String(params.page))
  if (params?.pageSize != null) query.set('pageSize', String(params.pageSize))

  const suffix = query.toString() ? `?${query}` : ''
  const res = await fetch(`/api/backstage/orders${suffix}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = await res.json()
  if (Array.isArray(data)) {
    return {
      items: data as BackstageOrderListItem[],
      total: data.length,
      page: 1,
      pageSize: data.length,
      totalPages: 1,
    }
  }
  return data as PaginatedBackstageOrders
}

export type BackstageOrdersSummary = {
  totalOrders: number
  activeOrders?: number
  cancelledOrders?: number
  totalRevenue: number
  ordersValue?: number
  paidRevenue?: number
  averageOrderValue?: number
  currency: string
}

export async function fetchBackstageOrdersSummary(): Promise<BackstageOrdersSummary> {
  const res = await fetch('/api/backstage/orders/summary', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchBackstageOrder(id: string): Promise<BackstageOrderDetail> {
  const res = await fetch(`/api/backstage/orders/${id}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function sendBackstageOrderManualEmail(
  id: string,
  payload: {
    subject: string
    body: string
    attachConfirmationPdf?: boolean
    idempotencyKey: string
  },
): Promise<BackstageOrderCommunication> {
  const res = await fetch(`/api/backstage/orders/${id}/communications/manual`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export type BackstageReviewRequestEvent = {
  id: string
  type: 'GENERATED' | 'REGENERATED' | 'REVOKED'
  createdByUserId: string | null
  createdAt: string
}

export type BackstageReviewRequestStatus = {
  exists: boolean
  featureEnabled: boolean
  automaticSendingEnabled: boolean
  derivedStatus: 'NOT_CREATED' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'REVOKED'
  createdAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  completedAt: string | null
  sentAt: string | null
  scheduledFor: string | null
  lastOpenedAt: string | null
  lastGeneratedAt: string | null
  locale: string | null
  storeReviewed: boolean
  productsReviewed: number
  productsTotal: number
  customerEmail: string | null
  rawUrlAvailable: false
  canSend: boolean
  requiresRegenerateToSend: boolean
  /** Calculated expected date (shippedAt + delayDays) — not proof a queue job exists. */
  expectedAutomaticSendAt: string | null
  events: BackstageReviewRequestEvent[]
  latestFailedCommunication: {
    id: string
    status: string
    source: string
    errorMessage: string | null
    createdAt: string
    sentAt: string | null
  } | null
}

export type BackstageReviewRequestGenerateResult = {
  reviewUrl: string
  expiresAt: string
  locale: string
  regenerated: boolean
}

export type BackstageReviewRequestEmailPreview = {
  locale: string
  toEmail: string | null
  subject: string
  bodyText: string
  bodyHtml: string
  reviewUrl: string
  reviewUrlIsPlaceholder: boolean
}

export type BackstageReviewRequestSendResult = {
  communication: BackstageOrderCommunication & {
    bodySnapshot?: string | null
    locale?: string | null
    type: string
    source: string
  }
  reviewUrl: string | null
  regenerated: boolean
  requestSentAt: string | null
}

async function parseReviewRequestError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[] | { message?: string; code?: string }
    error?: string
    code?: string
  }
  if (typeof data.message === 'object' && data.message && 'message' in data.message) {
    return String(data.message.message ?? data.error ?? 'Помилка запиту')
  }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

export async function fetchBackstageReviewRequestStatus(
  orderId: string,
): Promise<BackstageReviewRequestStatus> {
  const res = await fetch(`/api/backstage/orders/${orderId}/review-request`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseReviewRequestError(res))
  return res.json()
}

export async function generateBackstageReviewRequest(
  orderId: string,
): Promise<BackstageReviewRequestGenerateResult> {
  const res = await fetch(`/api/backstage/orders/${orderId}/review-request`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseReviewRequestError(res))
  return res.json()
}

export async function regenerateBackstageReviewRequest(
  orderId: string,
): Promise<BackstageReviewRequestGenerateResult> {
  const res = await fetch(`/api/backstage/orders/${orderId}/review-request/regenerate`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseReviewRequestError(res))
  return res.json()
}

export async function revokeBackstageReviewRequest(orderId: string): Promise<{ revoked: true }> {
  const res = await fetch(`/api/backstage/orders/${orderId}/review-request/revoke`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseReviewRequestError(res))
  return res.json()
}

export async function previewBackstageReviewRequestEmail(
  orderId: string,
  payload?: { locale?: string },
): Promise<BackstageReviewRequestEmailPreview> {
  const res = await fetch(`/api/backstage/orders/${orderId}/review-request/preview`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  })
  if (!res.ok) throw new Error(await parseReviewRequestError(res))
  return res.json()
}

export async function sendBackstageReviewRequestEmail(
  orderId: string,
  payload: {
    locale?: string
    confirmRegenerate?: boolean
    idempotencyKey: string
  },
): Promise<BackstageReviewRequestSendResult> {
  const res = await fetch(`/api/backstage/orders/${orderId}/review-request/send`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = (await res.json().catch(() => ({}))) as BackstageReviewRequestSendResult & {
    message?: string | string[] | { message?: string; code?: string }
    error?: string
    code?: string
  }
  if (!res.ok) {
    const code =
      typeof data.message === 'object' && data.message && 'code' in data.message
        ? data.message.code
        : data.code
    const message =
      typeof data.message === 'object' && data.message && 'message' in data.message
        ? String(data.message.message)
        : Array.isArray(data.message)
          ? data.message.join(', ')
          : typeof data.message === 'string'
            ? data.message
            : typeof data.error === 'string'
              ? data.error
              : 'Помилка запиту'
    const err = new Error(message) as Error & { code?: string; status?: number }
    err.code = code
    err.status = res.status
    throw err
  }
  return data
}

export async function patchBackstageOrder(
  id: string,
  payload: PatchOrderPayload,
): Promise<BackstageOrderDetail | BackstageOrderListItem> {
  const res = await fetch(`/api/backstage/orders/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function patchBackstageOrderStatus(
  id: string,
  status: OrderStatus,
  options?: { cancellationReasonId?: string; cancellationNote?: string | null },
): Promise<BackstageOrderListItem> {
  return patchBackstageOrder(id, {
    status,
    cancellationReasonId: options?.cancellationReasonId,
    cancellationNote: options?.cancellationNote,
  }) as Promise<BackstageOrderListItem>
}

export async function syncBackstageOrderTracking(id: string): Promise<BackstageOrderDetail> {
  const res = await fetch(`/api/backstage/orders/${id}/sync-tracking`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function markBackstageBankTransferPaid(id: string): Promise<BackstageOrderDetail> {
  const res = await fetch(`/api/backstage/orders/${id}/mark-bank-paid`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function syncBackstageOrderErp(id: string): Promise<BackstageOrderDetail> {
  const res = await fetch(`/api/backstage/orders/${id}/erp-sync`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

/** AUDIT ONLY — refreshes OrderViesCheck; does not mutate tax/payment/Flexi. */
export async function retryBackstageOrderVies(id: string): Promise<BackstageOrderDetail> {
  const res = await fetch(`/api/backstage/orders/${id}/vies-retry`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteBackstageOrder(id: string): Promise<{ ok: true }> {
  const res = await fetch(`/api/backstage/orders/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
