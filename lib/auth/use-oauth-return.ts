'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import type { GoogleCheckoutProfile, PublicSession } from '@/lib/auth/types'

export type OAuthReturnPayload = {
  user: PublicSession
  profile: GoogleCheckoutProfile | null
}

export function useOAuthReturn(
  onSuccess: (payload: OAuthReturnPayload) => void,
  options?: {
    errorMessage?: string
    errorMessages?: Record<string, string>
    showSuccessToast?: boolean
  },
) {
  const tc = useTranslations('common')
  const handledRef = useRef(false)
  const showSuccessToast = options?.showSuccessToast ?? true

  useEffect(() => {
    if (handledRef.current || typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const oauthError = params.get('oauth_error')
    const oauthSuccess = params.get('oauth') === 'success'

    if (!oauthError && !oauthSuccess) return

    handledRef.current = true

    params.delete('oauth')
    params.delete('oauth_error')
    const query = params.toString()
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}`
    window.history.replaceState({}, '', nextUrl)

    if (oauthError) {
      toast.error(options?.errorMessages?.[oauthError] ?? options?.errorMessage ?? oauthError)
      return
    }

    void fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: OAuthReturnPayload | null) => {
        if (!data?.user) {
          toast.error(tc('oauthSessionFailed'))
          return
        }
        if (showSuccessToast) {
          const firstName = data.profile?.firstName?.trim() || data.user.firstName?.trim()
          toast.success(
            firstName
              ? tc('welcomeNameGoogle', { name: firstName })
              : tc('welcomeGoogle'),
          )
        }
        onSuccess(data)
      })
      .catch(() => {
        toast.error(tc('oauthConnectionError'))
      })
  }, [onSuccess, options?.errorMessage, options?.errorMessages, showSuccessToast, tc])
}
