'use client'

import { NextIntlClientProvider } from 'next-intl'
import { useParams } from 'next/navigation'
import type { ReactNode } from 'react'

import { defaultLocale, isAppLocale } from '@/i18n/routing'
import csMessages from '@/messages/cs.json'
import deMessages from '@/messages/de.json'
import enMessages from '@/messages/en.json'
import huMessages from '@/messages/hu.json'
import skMessages from '@/messages/sk.json'
import ukMessages from '@/messages/uk.json'
import type { AppLocale } from '@/lib/i18n/locales'

const BASE_MESSAGES: Record<AppLocale, Record<string, unknown>> = {
  uk: ukMessages as Record<string, unknown>,
  en: enMessages as Record<string, unknown>,
  sk: skMessages as Record<string, unknown>,
  hu: huMessages as Record<string, unknown>,
  de: deMessages as Record<string, unknown>,
  cs: csMessages as Record<string, unknown>,
}

function localeFromParams(params: ReturnType<typeof useParams>): AppLocale {
  const raw = params?.locale
  if (typeof raw === 'string' && isAppLocale(raw)) {
    return raw
  }
  return defaultLocale
}

/** Intl context for UI rendered outside `app/[locale]/layout` (e.g. cart merge dialog). */
export function UrlLocaleIntlProvider({ children }: { children: ReactNode }) {
  const locale = localeFromParams(useParams())

  return (
    <NextIntlClientProvider locale={locale} messages={BASE_MESSAGES[locale]} timeZone="Europe/Kyiv">
      {children}
    </NextIntlClientProvider>
  )
}
