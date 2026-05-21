import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth/get-session'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({ user: { email: session.email, role: session.role } })
}
