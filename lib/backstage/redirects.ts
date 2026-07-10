export type RedirectRecord = {
  id: string
  fromPath: string
  toPath: string
  statusCode: number
  isActive: boolean
  prefix: string | null
  hitCount: number
  lastHitAt: string | null
  createdAt: string
  updatedAt: string
}

export type RedirectFormValues = {
  fromPath: string
  toPath: string
  statusCode: number
  isActive: boolean
  prefix?: string
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

export async function fetchBackstageRedirects(prefix?: string): Promise<RedirectRecord[]> {
  const query = prefix ? `?prefix=${encodeURIComponent(prefix)}` : ''
  const res = await fetch(`/api/backstage/redirects${query}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchBackstageRedirectPrefixes(): Promise<string[]> {
  const res = await fetch('/api/backstage/redirects/prefixes', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function createBackstageRedirect(payload: RedirectFormValues): Promise<RedirectRecord> {
  const res = await fetch('/api/backstage/redirects', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageRedirect(
  id: string,
  payload: Partial<RedirectFormValues>,
): Promise<RedirectRecord> {
  const res = await fetch(`/api/backstage/redirects/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteBackstageRedirect(id: string): Promise<void> {
  const res = await fetch(`/api/backstage/redirects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
}

export async function invalidateBackstageRedirectCache(): Promise<void> {
  const res = await fetch('/api/backstage/redirects/invalidate-cache', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
}
