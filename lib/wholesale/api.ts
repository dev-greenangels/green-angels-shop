export type WholesaleInquiryPayload = {
  fullName: string
  companyName: string
  phone: string
  email: string
  city: string
  website?: string
  message?: string
  companyIco?: string
  companyVatId?: string
  consent?: boolean
  locale?: string
  fax?: string
  startedAt?: number
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

export async function submitWholesaleInquiry(payload: WholesaleInquiryPayload): Promise<void> {
  const res = await fetch('/api/wholesale-inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
}
