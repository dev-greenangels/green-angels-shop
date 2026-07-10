import 'server-only'

import { NextResponse } from 'next/server'

import { getBackstageSession } from './get-session'

export async function requireBackstageSession(request?: Request) {
  const session = await getBackstageSession(request)
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Потрібна авторизація в бек-офісі.' }, { status: 401 }),
    }
  }
  return { session, error: null }
}
