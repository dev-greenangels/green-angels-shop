/** Browser-safe fetch of published legal documents (via shop BFF). */

export type LegalDocumentClientView = {
  revisionId: string
  type: string
  title: string
  intro: string
  version: number
  locale: string
}

export async function fetchCurrentLegalDocument(
  type: string,
  locale: string,
): Promise<LegalDocumentClientView | null> {
  try {
    const res = await fetch(
      `/api/legal/current?locale=${encodeURIComponent(locale)}`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    const data = (await res.json()) as { items?: LegalDocumentClientView[] }
    const items = Array.isArray(data.items) ? data.items : []
    return items.find((item) => item.type === type) ?? null
  } catch {
    return null
  }
}

export async function recordMarketingConsent(input: {
  locale: string
  source: string
  revisionId?: string
  email?: string
  action?: 'GRANTED' | 'WITHDRAWN'
}): Promise<boolean> {
  try {
    const res = await fetch('/api/legal/consents', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purpose: 'MARKETING',
        action: input.action ?? 'GRANTED',
        locale: input.locale,
        source: input.source,
        revisionId: input.revisionId,
        email: input.email,
      }),
    })
    const data = (await res.json().catch(() => ({}))) as { recorded?: boolean }
    return Boolean(res.ok && data.recorded !== false)
  } catch {
    return false
  }
}
