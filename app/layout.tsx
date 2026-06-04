import type { Metadata } from 'next'
import { Source_Sans_3 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { getLocale, getMessages, getTranslations, setRequestLocale } from 'next-intl/server'

import { AppProviders } from '@/components/providers/app-providers'
import { Toaster } from '@/components/ui/sonner'
import { getSession } from '@/lib/auth/get-session'
import { defaultLocale } from '@/i18n/routing'

import './globals.css'

const sourceSans = Source_Sans_3({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-source',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: defaultLocale, namespace: 'metadata' })
  const keywords = t('keywords')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  return {
    title: t('title'),
    description: t('description'),
    keywords,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  setRequestLocale(locale)
  const messages = await getMessages()
  const session = await getSession()

  return (
    <html lang={locale} className={`${sourceSans.variable} bg-background`}>
      <body className="font-sans antialiased">
        <AppProviders locale={locale} messages={messages} initialSession={session}>
          {children}
        </AppProviders>
        <Toaster richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
