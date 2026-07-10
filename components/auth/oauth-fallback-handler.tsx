'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useSession } from '@/components/providers/session-provider'
import type { GoogleCheckoutProfile, PublicSession } from '@/lib/auth/types'
import { stripLocalePrefix } from '@/lib/locale-path'

type SessionResponse = {
  user?: PublicSession
  profile?: GoogleCheckoutProfile | null
}

/** Обробляє ?oauth=success на сторінках без власного useOAuthReturn (напр. головна після старого багу redirect). */
export function OAuthFallbackHandler() {
  const pathname = usePathname()
  const router = useRouter()
  const tc = useTranslations('common')
  const { setUser } = useSession()
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current || typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const oauthError = params.get('oauth_error')
    const oauthSuccess = params.get('oauth') === 'success'
    if (!oauthError && !oauthSuccess) return

    const barePath = stripLocalePrefix(pathname)
    if (barePath.startsWith('/auth/login') || barePath === '/checkout') return

    handledRef.current = true

    params.delete('oauth')
    params.delete('oauth_error')
    const query = params.toString()
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}`
    window.history.replaceState({}, '', nextUrl)

    if (oauthError) {
      toast.error(oauthError)
      return
    }

    void fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SessionResponse | null) => {
        if (!data?.user) {
          toast.error(tc('oauthSessionFailed'))
          return
        }
        setUser(data.user!)
        router.refresh()
        const firstName = data.profile?.firstName?.trim() || data.user.firstName?.trim()
        toast.success(
          firstName ? tc('welcomeNameGoogle', { name: firstName }) : tc('welcomeGoogle'),
        )
      })
      .catch(() => {
        toast.error(tc('oauthConnectionError'))
      })
  }, [pathname, router, setUser, tc])

  return null
}
