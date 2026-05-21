import { NextResponse } from 'next/server'

import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SEC } from '@/lib/auth/constants'
import { signSessionToken } from '@/lib/auth/session-token'
import type { UserRole } from '@/lib/auth/types'

function roleFromEmail(email: string): UserRole {
  return email.toLowerCase().includes('admin') ? 'admin' : 'customer'
}

/**
 * Спрощений вхід: достатньо вказати email (пароль поки не перевіряється).
 * Роль `admin`, якщо в email є підрядок «admin» (без урахування регістру).
 */
export async function POST(request: Request) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const emailRaw = typeof body.email === 'string' ? body.email.trim() : ''
  if (!emailRaw) {
    return NextResponse.json({ error: 'Вкажіть email.' }, { status: 400 })
  }

  const email = emailRaw.toLowerCase()
  const role = roleFromEmail(email)

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

  const res = NextResponse.json({ ok: true, user: { email, role } })
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
