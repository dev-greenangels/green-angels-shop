export type ContractWithdrawalScope = 'ENTIRE_ORDER' | 'PARTIAL'

export type PublicContractWithdrawalPayload = {
  customerName: string
  email: string
  orderNumber: string
  scope: ContractWithdrawalScope
  phone?: string
  partialItemsText?: string
  locale?: string
  fax?: string
  startedAt?: number
}

export type AccountContractWithdrawalLineSelection = {
  orderItemId: string
  quantity: number
}

export type AccountContractWithdrawalPayload = {
  orderId: string
  scope: ContractWithdrawalScope
  lineItems?: AccountContractWithdrawalLineSelection[]
  locale?: string
}

export type ContractWithdrawalSubmitResult = {
  ok: true
  referenceNumber: string
  submittedAt: string
}

export type AccountWithdrawalMetaItem = {
  id: string
  quantity: number
  productName: string
  variantLabel: string | null
  sku: string | null
  label: string
}

export type AccountWithdrawalMeta = {
  actionVisible: boolean
  orderNumber: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  items: AccountWithdrawalMetaItem[]
}

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

export async function submitPublicContractWithdrawal(
  payload: PublicContractWithdrawalPayload,
): Promise<ContractWithdrawalSubmitResult> {
  const res = await fetch('/api/contract-withdrawals/public', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function submitAccountContractWithdrawal(
  payload: AccountContractWithdrawalPayload,
): Promise<ContractWithdrawalSubmitResult> {
  const res = await fetch('/api/contract-withdrawals/account', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchAccountWithdrawalMeta(orderId: string): Promise<AccountWithdrawalMeta> {
  const res = await fetch(`/api/contract-withdrawals/account/orders/${orderId}/meta`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
