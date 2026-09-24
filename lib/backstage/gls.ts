export type GlsAdminSettings = {
  enabled: boolean
  configured: boolean
  apiUrl: string
  hasUsername: boolean
  clientNumber: string
}

export type GlsSettingsPatch = {
  enabled?: boolean
  apiUrl?: string
  username?: string
  /** Leave blank to keep stored password. */
  password?: string
  clientNumber?: string
}

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[]
    error?: string
  }
  if (typeof data.message === 'string') return data.message
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.error === 'string') return data.error
  return 'Не вдалося виконати запит GLS.'
}

export async function fetchGlsSettings(): Promise<GlsAdminSettings> {
  const res = await fetch('/api/backstage/gls/settings', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return (await res.json()) as GlsAdminSettings
}

export async function updateGlsSettings(payload: GlsSettingsPatch): Promise<GlsAdminSettings> {
  const res = await fetch('/api/backstage/gls/settings', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return (await res.json()) as GlsAdminSettings
}
