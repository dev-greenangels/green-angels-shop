import { NextResponse } from 'next/server'

import { getBackstageSession } from '@/lib/backstage-auth/get-session'

export async function GET(request: Request) {
  const session = await getBackstageSession(request)
  if (!session) {
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({ user: session })
}
