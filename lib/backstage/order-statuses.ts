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

export type OrderStatusDefinition = {
  id: string
  code: string
  nameUk: string
  nameEn: string | null
  nameSk: string | null
  color: string
  sortOrder: number
  isActive: boolean
  isSystem: boolean
  isTerminal: boolean
  externalCode: string | null
}

export type UpsertOrderStatusPayload = {
  code: string
  nameUk: string
  nameEn?: string | null
  nameSk?: string | null
  color?: string
  sortOrder?: number
  isActive?: boolean
  isTerminal?: boolean
  externalCode?: string | null
}

export async function fetchOrderStatuses(activeOnly = true): Promise<OrderStatusDefinition[]> {
  const res = await fetch(`/api/backstage/order-statuses?activeOnly=${activeOnly}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function createOrderStatus(
  payload: UpsertOrderStatusPayload,
): Promise<OrderStatusDefinition> {
  const res = await fetch('/api/backstage/order-statuses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateOrderStatus(
  code: string,
  payload: UpsertOrderStatusPayload,
): Promise<OrderStatusDefinition> {
  const res = await fetch(`/api/backstage/order-statuses/${encodeURIComponent(code)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteOrderStatus(code: string): Promise<void> {
  const res = await fetch(`/api/backstage/order-statuses/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(await parseError(res))
}
