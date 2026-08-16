'use client'

import { useEffect, useRef } from 'react'

/** Перехоплює ?ref=CODE у URL, валідує код і встановлює cookie `ga-ref` через BFF (без видимого UI). */
export function ReferralCaptureHandler() {
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current || typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const code = params.get('ref')?.trim()
    if (!code) return

    handledRef.current = true

    void fetch(`/api/referrals/claim/${encodeURIComponent(code)}`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {})

    params.delete('ref')
    const query = params.toString()
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', nextUrl)
  }, [])

  return null
}
