import { safeAuthRedirect } from '@/lib/auth/redirect'
import { localePath } from '@/lib/locale-path'

export type GoogleOAuthContext = 'login' | 'checkout'

export function buildGoogleOAuthReturnPath(
  finalDestination: string,
  context: GoogleOAuthContext = 'login',
): string {
  if (context === 'checkout') return localePath('/checkout')

  const redirect = safeAuthRedirect(finalDestination)
  if (redirect === '/') return localePath('/auth/login')

  const params = new URLSearchParams({ redirect })
  return `${localePath('/auth/login')}?${params.toString()}`
}

export function startGoogleOAuth(
  finalDestination: string,
  context: GoogleOAuthContext = 'login',
): void {
  const returnTo = buildGoogleOAuthReturnPath(finalDestination, context)
  const url = new URL('/api/auth/oauth/google', window.location.origin)
  url.searchParams.set('returnTo', returnTo)
  window.location.assign(url.toString())
}
