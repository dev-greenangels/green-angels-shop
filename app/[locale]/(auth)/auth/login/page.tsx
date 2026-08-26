import { setRequestLocale } from 'next-intl/server'

import { LoginPageClient } from '@/app/[locale]/(auth)/auth/login/login-page-client'
import { redirect } from '@/i18n/navigation'
import { resolveAuthSubtitleKey } from '@/lib/auth/auth-subtitle'
import { getSession } from '@/lib/auth/get-session'
import { isGoogleOAuthConfigured } from '@/lib/auth/google-oauth'
import { safeAuthRedirect } from '@/lib/auth/redirect'
import { fetchPublicSiteSettings, getMarketSettings } from '@/lib/settings/fetch'

type PageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ redirect?: string }>
}

export default async function LoginPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  const query = await searchParams
  const redirectTo = query.redirect?.trim()
    ? safeAuthRedirect(query.redirect)
    : '/account'

  const session = await getSession()
  if (session) {
    redirect({ href: redirectTo, locale })
  }

  const market = getMarketSettings(await fetchPublicSiteSettings())
  const subtitleKey = resolveAuthSubtitleKey(market, isGoogleOAuthConfigured())

  return <LoginPageClient redirectTo={redirectTo} subtitleKey={subtitleKey} />
}
