import type {
  CommerceDefaultsSettings,
  CurrencyInfo,
  UnitOfMeasureInfo,
} from '@/lib/commerce/types'

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

export async function fetchCurrencies(): Promise<CurrencyInfo[]> {
  const res = await fetch('/api/backstage/currencies?activeOnly=false', { cache: 'no-store' })
  const data = await res.json()
  if (!res.ok) throw new Error(await parseError(res))
  return data as CurrencyInfo[]
}

export async function fetchUnitsOfMeasure(): Promise<UnitOfMeasureInfo[]> {
  const res = await fetch('/api/backstage/units-of-measure?activeOnly=false', { cache: 'no-store' })
  const data = await res.json()
  if (!res.ok) throw new Error(await parseError(res))
  return data as UnitOfMeasureInfo[]
}

export async function fetchCommerceDefaults(): Promise<CommerceDefaultsSettings> {
  const res = await fetch('/api/backstage/commerce/defaults', { cache: 'no-store' })
  const data = await res.json()
  if (!res.ok) throw new Error(await parseError(res))
  return data as CommerceDefaultsSettings
}

export async function updateCommerceDefaults(
  patch: Partial<CommerceDefaultsSettings>,
): Promise<CommerceDefaultsSettings> {
  const res = await fetch('/api/backstage/commerce/defaults', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(await parseError(res))
  return data as CommerceDefaultsSettings
}

export type UpsertCurrencyPayload = {
  code: string
  symbol: string
  isoNumericCode?: number | null
  decimals?: number
  isActive?: boolean
  sortOrder?: number
  translations: Array<{ locale: string; name: string }>
}

export async function createCurrency(payload: UpsertCurrencyPayload): Promise<CurrencyInfo> {
  const res = await fetch('/api/backstage/currencies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(await parseError(res))
  return data as CurrencyInfo
}

export async function updateCurrency(
  code: string,
  payload: UpsertCurrencyPayload,
): Promise<CurrencyInfo> {
  const res = await fetch(`/api/backstage/currencies/${encodeURIComponent(code)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(await parseError(res))
  return data as CurrencyInfo
}

export async function deleteCurrency(code: string): Promise<void> {
  const res = await fetch(`/api/backstage/currencies/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(await parseError(res))
}

export type UpsertUnitPayload = {
  code: string
  symbol: string
  type: 'COUNT' | 'WEIGHT' | 'VOLUME' | 'LENGTH' | 'AREA'
  decimals?: number
  isActive?: boolean
  sortOrder?: number
  translations: Array<{ locale: string; name: string }>
}

export async function createUnit(payload: UpsertUnitPayload): Promise<UnitOfMeasureInfo> {
  const res = await fetch('/api/backstage/units-of-measure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(await parseError(res))
  return data as UnitOfMeasureInfo
}

export async function updateUnit(id: string, payload: UpsertUnitPayload): Promise<UnitOfMeasureInfo> {
  const res = await fetch(`/api/backstage/units-of-measure/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(await parseError(res))
  return data as UnitOfMeasureInfo
}

export async function deleteUnit(id: string): Promise<void> {
  const res = await fetch(`/api/backstage/units-of-measure/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseError(res))
}
