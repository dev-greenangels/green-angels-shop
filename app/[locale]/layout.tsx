import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'

import { DocumentLang } from '@/components/localization/document-lang'
import { OAuthFallbackHandler } from '@/components/auth/oauth-fallback-handler'
import { CookieConsentBanner } from '@/components/legal/cookie-consent-banner'
import { ReferralCaptureHandler } from '@/components/referrals/referral-capture-handler'
import { ScrollToTopButton } from '@/components/scroll-to-top-button'
import { isAppLocale, locales } from '@/i18n/routing'

type LocaleLayoutProps = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params

  if (!isAppLocale(locale)) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Kyiv">
      <DocumentLang />
      <OAuthFallbackHandler />
      <ReferralCaptureHandler />
      {children}
      <ScrollToTopButton />
      <CookieConsentBanner />
    </NextIntlClientProvider>
  )
}
