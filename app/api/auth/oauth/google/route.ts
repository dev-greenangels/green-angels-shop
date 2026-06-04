import { NextResponse } from 'next/server'

import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SEC } from '@/lib/auth/constants'
import { MOCK_GOOGLE_CHECKOUT_USER } from '@/lib/auth/mock-google-user'
import { signSessionToken } from '@/lib/auth/session-token'

/** Імітація OAuth Google: створює сесію customer і повертає профіль для чекауту. */
export async function POST() {
  await new Promise((r) => setTimeout(r, 700))

  const email = MOCK_GOOGLE_CHECKOUT_USER.email.toLowerCase()
  const role = 'customer' as const

  const token = await signSessionToken({ email, role, v: 1 })
  if (!token) {
    return NextResponse.json(
      {
        error:
          'Не вдалося створити сесію. У production задайте AUTH_SESSION_SECRET (мінімум 32 символи).',
      },
      { status: 500 }
    )
  }

  const res = NextResponse.json({
    ok: true,
    user: { email, role },
    profile: {
      firstName: MOCK_GOOGLE_CHECKOUT_USER.firstName,
      lastName: MOCK_GOOGLE_CHECKOUT_USER.lastName,
      phone: MOCK_GOOGLE_CHECKOUT_USER.phone,
      personalDiscountPercent: MOCK_GOOGLE_CHECKOUT_USER.personalDiscountPercent,
    },
  })

  const secure = process.env.NODE_ENV === 'production'
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  })

  return res
}
