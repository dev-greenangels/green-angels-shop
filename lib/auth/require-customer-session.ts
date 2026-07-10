import 'server-only'

import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth/get-session'

export async function requireCustomerSession(_request?: Request) {
  const session = await getSession()
  if (!session || (session.role !== 'customer' && session.role !== 'admin')) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Потрібна авторизація.' }, { status: 401 }),
    }
  }
  return { session, error: null }
}
