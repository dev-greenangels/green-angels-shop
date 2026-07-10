import type { NpOption } from './types'

async function fetchNpOptions(path: string): Promise<NpOption[]> {
  const base = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const url = `${base}${path}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return []
  const data = (await res.json().catch(() => [])) as unknown
  if (!Array.isArray(data)) return []
  return data.filter(
    (item): item is NpOption =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as NpOption).id === 'string' &&
      typeof (item as NpOption).label === 'string',
  )
}

export function searchNpSettlements(
  query: string,
  options?: { limit?: number; warehouseOnly?: boolean },
): Promise<NpOption[]> {
  const q = query.trim()
  if (q.length < 2) return Promise.resolve([])
  const limit = options?.limit ?? 20
  const params = new URLSearchParams({ q, limit: String(limit) })
  if (options?.warehouseOnly) {
    params.set('warehouseOnly', '1')
  }
  return fetchNpOptions(`/api/nova-poshta/settlements?${params}`)
}

export function searchNpWarehouses(settlementRef: string, query: string): Promise<NpOption[]> {
  const ref = settlementRef.trim()
  if (!ref) return Promise.resolve([])
  const params = new URLSearchParams({
    settlementRef: ref,
    q: query.trim(),
  })
  return fetchNpOptions(`/api/nova-poshta/warehouses?${params}`)
}

export function searchNpStreets(settlementRef: string, query: string): Promise<NpOption[]> {
  const ref = settlementRef.trim()
  const q = query.trim()
  if (!ref || q.length < 2) return Promise.resolve([])
  const params = new URLSearchParams({ settlementRef: ref, q })
  return fetchNpOptions(`/api/nova-poshta/streets?${params}`)
}
