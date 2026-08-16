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

export type CancellationReason = {
  id: string
  code: string
  nameUk: string
  nameEn: string | null
  nameSk: string | null
  allowAdmin: boolean
  allowUser: boolean
  allowSystem: boolean
  isActive: boolean
  sortOrder: number
}

export type UpsertCancellationReasonPayload = {
  code: string
  nameUk: string
  nameEn?: string | null
  nameSk?: string | null
  allowAdmin?: boolean
  allowUser?: boolean
  allowSystem?: boolean
  isActive?: boolean
  sortOrder?: number
}

export async function fetchCancellationReasons(options?: {
  activeOnly?: boolean
  source?: 'ADMIN' | 'USER' | 'SYSTEM'
}): Promise<CancellationReason[]> {
  const query = new URLSearchParams()
  query.set('activeOnly', String(options?.activeOnly ?? true))
  if (options?.source) query.set('source', options.source)
  const res = await fetch(`/api/backstage/cancellation-reasons?${query}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function createCancellationReason(
  payload: UpsertCancellationReasonPayload,
): Promise<CancellationReason> {
  const res = await fetch('/api/backstage/cancellation-reasons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateCancellationReason(
  id: string,
  payload: UpsertCancellationReasonPayload,
): Promise<CancellationReason> {
  const res = await fetch(`/api/backstage/cancellation-reasons/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteCancellationReason(id: string): Promise<void> {
  const res = await fetch(`/api/backstage/cancellation-reasons/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(await parseError(res))
}
