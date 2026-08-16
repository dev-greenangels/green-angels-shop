import type {
  ClaimReferralCodeResult,
  MyReferralSummary,
  PointsRedemptionPreview,
  ReferralProgramSummary,
} from './types'

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

/** Публічна інформація про активну реферальну програму (для банерів/промо-блоків). */
export async function fetchPublicReferralProgram(): Promise<ReferralProgramSummary | null> {
  const res = await fetch('/api/referrals/program', { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

/** Дані для розділу «Мої реферали» в кабінеті клієнта (Phase 6 UI). */
export async function fetchMyReferralSummary(): Promise<MyReferralSummary> {
  const res = await fetch('/api/referrals/me', { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

/** Перевіряє код і встановлює cookie `ga-ref` на стороні BFF, якщо код дійсний. */
export async function claimReferralCode(code: string): Promise<ClaimReferralCodeResult> {
  const res = await fetch(`/api/referrals/claim/${encodeURIComponent(code)}`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

/** Прев'ю грошового еквіваленту балів клієнта перед застосуванням на чекауті. */
export async function previewPointsRedemption(points: number): Promise<PointsRedemptionPreview> {
  const res = await fetch(`/api/referrals/points/preview?points=${encodeURIComponent(String(points))}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
