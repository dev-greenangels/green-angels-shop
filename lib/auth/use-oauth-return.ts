'use client'

import { useEffect, useRef } from 'react'
import { toast } from '@/lib/toast'

import type { GoogleCheckoutProfile, PublicSession } from '@/lib/auth/types'

export type OAuthReturnPayload = {
  user: PublicSession
  profile: GoogleCheckoutProfile | null
}

function googleSuccessToast(payload: OAuthReturnPayload) {
  const firstName = payload.profile?.firstName?.trim() || payload.user.firstName?.trim()
  toast.success(
    firstName ? `Вітаємо, ${firstName}! Увійшли через Google` : 'Вітаємо! Увійшли через Google',
  )
}

export function useOAuthReturn(
  onSuccess: (payload: OAuthReturnPayload) => void,
  options?: { errorMessage?: string; showSuccessToast?: boolean },
) {
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
      toast.error(options?.errorMessage ?? oauthError)
      return
    }

    void fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: OAuthReturnPayload | null) => {
        if (!data?.user) {
          toast.error('Не вдалося отримати сесію після входу через Google.')
          return
        }
        if (showSuccessToast) {
          googleSuccessToast(data)
        }
        onSuccess(data)
      })
      .catch(() => {
        toast.error('Помилка зʼєднання після входу через Google.')
      })
  }, [onSuccess, options?.errorMessage, showSuccessToast])
}
