import type {
  NovaPoshtaSettings,
  NovaPoshtaSyncStatus,
  NpSyncTarget,
} from '@/lib/nova-poshta/types'

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

export async function fetchNovaPoshtaSettings(): Promise<NovaPoshtaSettings> {
  const res = await fetch('/api/backstage/nova-poshta/settings', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateNovaPoshtaSettings(
  payload: Partial<NovaPoshtaSettings> & { apiKey?: string },
): Promise<NovaPoshtaSettings> {
  const res = await fetch('/api/backstage/nova-poshta/settings', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchNovaPoshtaSyncStatus(): Promise<NovaPoshtaSyncStatus> {
  const res = await fetch('/api/backstage/nova-poshta/sync/status', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function triggerNovaPoshtaSync(target: NpSyncTarget = 'all') {
  const res = await fetch('/api/backstage/nova-poshta/sync', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<{ queued: boolean; jobId: string; reason?: string }>
}

export async function cancelNovaPoshtaSync() {
  const res = await fetch('/api/backstage/nova-poshta/sync/cancel', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<{ cancelled: boolean; runsUpdated: number }>
}
