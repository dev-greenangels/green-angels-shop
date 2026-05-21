'use client'

import { createContext, useContext, useMemo, useState } from 'react'

import type { PublicSession } from '@/lib/auth/types'

type SessionContextValue = {
  user: PublicSession | null
  setUser: (user: PublicSession | null) => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode
  initialSession: PublicSession | null
}) {
  const [user, setUser] = useState<PublicSession | null>(initialSession)
  const value = useMemo(() => ({ user, setUser }), [user])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return ctx
}
