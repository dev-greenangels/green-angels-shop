import type { ReferralBackstageProgram } from '@/lib/referrals/types'

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

export async function fetchBackstageReferralProgram(): Promise<ReferralBackstageProgram | null> {
  const res = await fetch('/api/backstage/referrals/program', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export type UpsertReferralProgramPayload = {
  name: string
  isActive: boolean
  refereeDiscountType: 'PERCENT' | 'FIXED'
  refereeDiscountValue: number
  referrerPoints: number
  minOrderSubtotal: number | null
  maxRefereeDiscount: number | null
  cookieDays: number
  pointsExpireDays: number | null
}

export async function updateBackstageReferralProgram(
  payload: UpsertReferralProgramPayload,
): Promise<ReferralBackstageProgram> {
  const res = await fetch('/api/backstage/referrals/program', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
