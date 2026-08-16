import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { DEFAULT_REFERRAL_COOKIE_DAYS, REFERRAL_COOKIE_NAME } from '@/lib/referrals/constants'
import type { ClaimReferralCodeResult } from '@/lib/referrals/types'

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const normalizedCode = code.trim().toUpperCase()

  try {
    const res = await fetchBackend(`/referrals/claim/${encodeURIComponent(normalizedCode)}`, {
      request,
      method: 'POST',
    })
    const data = await readBackendJson<ClaimReferralCodeResult>(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })

    const response = NextResponse.json(data)
    if (data.valid) {
      const cookieDays = data.cookieDays > 0 ? data.cookieDays : DEFAULT_REFERRAL_COOKIE_DAYS
      response.cookies.set(REFERRAL_COOKIE_NAME, normalizedCode, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: cookieDays * 24 * 60 * 60,
      })
    }
    return response
  } catch {
    return NextResponse.json({ error: 'Помилка зʼєднання з API.' }, { status: 502 })
  }
}
