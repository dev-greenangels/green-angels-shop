export const CONTRACT_WITHDRAWALS_NEW_COUNT_EVENT = 'ga:contract-withdrawals-new-count-refresh'

export type ContractWithdrawalStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CLOSED'

export type ContractWithdrawalListItem = {
  id: string
  referenceNumber: string
  status: ContractWithdrawalStatus
  submittedAt: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  submittedOrderNumber: string
  orderId: string | null
  matchedOrderNumber: string | null
  scope: 'ENTIRE_ORDER' | 'PARTIAL'
  partialItemsText: string | null
  source: 'PUBLIC_FORM' | 'ACCOUNT'
  locale: string
  acknowledgementSentAt: string | null
  lineItems: Array<{
    orderItemId: string | null
    quantity: number
    titleSnapshot: string
    skuSnapshot: string | null
  }>
}

export type ContractWithdrawalPage = {
  items: ContractWithdrawalListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function fetchContractWithdrawals(params?: {
  status?: ContractWithdrawalStatus
  page?: number
  pageSize?: number
}): Promise<ContractWithdrawalPage> {
  const search = new URLSearchParams()
  if (params?.status) search.set('status', params.status)
  if (params?.page) search.set('page', String(params.page))
  if (params?.pageSize) search.set('pageSize', String(params.pageSize))
  const query = search.toString()
  const res = await fetch(`/api/backstage/contract-withdrawals${query ? `?${query}` : ''}`, {
    credentials: 'include',
  })
  const data = (await res.json()) as ContractWithdrawalPage & { error?: string }
  if (!res.ok) throw new Error(data.error || 'Load failed')
  return data
}

export async function updateContractWithdrawalStatus(
  id: string,
  status: ContractWithdrawalStatus,
): Promise<ContractWithdrawalListItem> {
  const res = await fetch(`/api/backstage/contract-withdrawals/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const data = (await res.json()) as ContractWithdrawalListItem & { error?: string }
  if (!res.ok) throw new Error(data.error || 'Update failed')
  return data
}

export async function fetchContractWithdrawalsNewCount(): Promise<number> {
  const res = await fetch('/api/backstage/contract-withdrawals/new-count', {
    credentials: 'include',
  })
  const data = (await res.json()) as { count?: number }
  if (!res.ok) return 0
  return data.count ?? 0
}

export const fetchBackstageContractWithdrawals = fetchContractWithdrawals
export const updateBackstageContractWithdrawalStatus = updateContractWithdrawalStatus
export const fetchBackstageContractWithdrawalsNewCount = fetchContractWithdrawalsNewCount
