'use client'

import { createContext, useContext } from 'react'

const CanonicalOriginContext = createContext('')

export function CanonicalOriginProvider({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  return (
    <CanonicalOriginContext.Provider value={value}>{children}</CanonicalOriginContext.Provider>
  )
}

export function useCanonicalOrigin(): string {
  return useContext(CanonicalOriginContext)
}
