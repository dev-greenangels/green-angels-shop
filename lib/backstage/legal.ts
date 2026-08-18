export type LegalBackstageRevision = {
  id: string
  documentId: string
  locale: string
  version: number
  title: string
  intro: string
  sections: Array<{ heading: string; body: string[] }>
  contentHash: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  effectiveAt: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type LegalBackstageDocument = {
  id: string
  type: 'TERMS' | 'PRIVACY' | 'COOKIES' | 'RETURNS'
  revisions: LegalBackstageRevision[]
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

export async function fetchBackstageLegalDocuments(
  locale?: string,
): Promise<LegalBackstageDocument[]> {
  const qs = locale ? `?locale=${encodeURIComponent(locale)}` : ''
  const res = await fetch(`/api/backstage/legal${qs}`, { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { items?: LegalBackstageDocument[] }
  return data.items ?? []
}

export async function createBackstageLegalDraft(payload: {
  type: LegalBackstageDocument['type']
  locale: string
  fromRevisionId?: string
  title?: string
  intro?: string
  sections?: LegalBackstageRevision['sections']
}): Promise<LegalBackstageRevision> {
  const res = await fetch('/api/backstage/legal', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageLegalDraft(
  id: string,
  payload: Pick<LegalBackstageRevision, 'title' | 'intro' | 'sections'>,
): Promise<LegalBackstageRevision> {
  const res = await fetch(`/api/backstage/legal/revisions/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function publishBackstageLegalRevision(id: string): Promise<LegalBackstageRevision> {
  const res = await fetch(`/api/backstage/legal/revisions/${id}/publish`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
