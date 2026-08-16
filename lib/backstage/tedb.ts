export type TedbSyncSettings = {
  enabledAuto: boolean
  cron: string
  lastRunAt: string | null
  lastError: string | null
  lastSyncedCount: number
}

export type VatCountryRateRow = {
  id: string
  countryCode: string
  rateType: string
  percent: number
  cnPrefixes: string[]
  source: string
  validFrom: string
  syncedAt: string | null
}

export async function fetchTedbSettings(): Promise<TedbSyncSettings> {
  const res = await fetch('/api/backstage/tedb/settings', { credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to load TEDB settings')
  return data as TedbSyncSettings
}

export async function patchTedbSettings(
  patch: Partial<Pick<TedbSyncSettings, 'enabledAuto' | 'cron'>>,
): Promise<TedbSyncSettings> {
  const res = await fetch('/api/backstage/tedb/settings', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to save TEDB settings')
  return data as TedbSyncSettings
}

export async function runTedbSync(): Promise<{ message: string; synced: number }> {
  const res = await fetch('/api/backstage/tedb/sync', {
    method: 'POST',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || 'TEDB sync failed')
  return data as { message: string; synced: number }
}

export async function fetchTedbRates(page = 1) {
  const res = await fetch(`/api/backstage/tedb/rates?page=${page}&pageSize=50`, {
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to load rates')
  return data as {
    items: VatCountryRateRow[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}
