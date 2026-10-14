import 'server-only'

import { NextResponse } from 'next/server'

import { getBackstageSession } from './get-session'
import {
  hasAnyPermission,
  type StaffPermission,
} from './permissions'

export async function requireBackstageSession(request?: Request) {
  const session = await getBackstageSession(request)
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Потрібна авторизація в бек-офісі.' }, { status: 401 }),
    }
  }
  if (
    session.staffRole === 'MANAGER' &&
    !hasAnyPermission(session.permissions, session.staffRole, ['backoffice.access'])
  ) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Немає доступу до Backoffice.' }, { status: 403 }),
    }
  }
  return { session, error: null }
}

/** Soft UI/BFF gate — Nest remains source of truth. */
export async function requireBackstagePermission(
  request: Request,
  ...required: StaffPermission[]
) {
  const { session, error } = await requireBackstageSession(request)
  if (error || !session) return { session: null, error: error! }
  if (!hasAnyPermission(session.permissions, session.staffRole, required)) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Недостатньо прав доступу.' }, { status: 403 }),
    }
  }
  return { session, error: null }
}
