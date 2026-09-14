import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { consumeOtpIpLimit, readBrowserIpFromRequest } from '@/lib/auth/otp-ip-rate-limit'
import { getRequestCountrySiteCode } from '@/lib/country-sites/request-country'
import { SUPPORTED_LOCALES } from '@/lib/i18n/locales'

const OTP_PURPOSES = new Set(['login', 'checkout', 'review'])

function resolveRequestLocale(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const code = raw.trim().toLowerCase().slice(0, 2)
  return (SUPPORTED_LOCALES as readonly string[]).includes(code) ? code : undefined
}

export async function POST(request: Request) {
  let body: { phone?: string; email?: string; purpose?: string; locale?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.', code: 'INVALID_JSON' }, { status: 400 })
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''

  if (!phone && !email) {
    return NextResponse.json(
      {
        error: 'Enter a phone number or email.',
        code: 'OTP_REQUIRED_CONTACT',
        message: 'Enter a phone number or email.',
      },
      { status: 400 },
    )
  }

  const purpose =
    typeof body.purpose === 'string' && OTP_PURPOSES.has(body.purpose)
      ? body.purpose
      : 'login'

  if (!consumeOtpIpLimit('send', readBrowserIpFromRequest(request))) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        code: 'OTP_RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      },
      { status: 429 },
    )
  }

  const countrySiteCode = await getRequestCountrySiteCode()
  const cookieStore = await cookies()
  const locale =
    resolveRequestLocale(body.locale) ||
    resolveRequestLocale(cookieStore.get('NEXT_LOCALE')?.value)

  try {
    const backendRes = await fetchBackend('/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(phone ? { phone } : {}),
        ...(email ? { email: email.toLowerCase() } : {}),
        purpose,
        ...(countrySiteCode ? { countrySiteCode } : {}),
        ...(locale ? { locale } : {}),
      }),
    })
    const data = await readBackendJson(backendRes)
    return NextResponse.json(data, { status: backendRes.status })
  } catch {
    return NextResponse.json(
      {
        error: 'Unable to reach the API.',
        code: 'API_UNAVAILABLE',
        message: 'Unable to reach the API.',
      },
      { status: 502 },
    )
  }
}
