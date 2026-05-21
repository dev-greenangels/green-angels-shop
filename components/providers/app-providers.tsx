'use client'

import { NextIntlClientProvider } from 'next-intl'
import type { AbstractIntlMessages } from 'next-intl'

import type { PublicSession } from '@/lib/auth/types'

import { SessionProvider } from './session-provider'

export function AppProviders({
  children,
  locale,
  messages,
  initialSession,
}: {
  children: React.ReactNode
  locale: string
  messages: AbstractIntlMessages
  initialSession: PublicSession | null
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Kyiv">
      <SessionProvider initialSession={initialSession}>{children}</SessionProvider>
    </NextIntlClientProvider>
  )
}
