import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireCustomerSession } from '@/lib/auth/require-customer-session'
import { getRequestCountrySiteCode } from '@/lib/country-sites/request-country'

export async function POST(request: Request) {
  const { error } = await requireCustomerSession(request)
  if (error) return error

  let parsed: { email?: string }
  try {
    parsed = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const email = typeof parsed.email === 'string' ? parsed.email.trim() : ''
  if (!email) {
    return NextResponse.json({ error: 'Вкажіть email.' }, { status: 400 })
  }

  const countrySiteCode = await getRequestCountrySiteCode()

  try {
    const res = await fetchBackend('/account/contacts/email/start', {
      request,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        ...(countrySiteCode ? { countrySiteCode } : {}),
      }),
    })
    const data = await readBackendJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}
