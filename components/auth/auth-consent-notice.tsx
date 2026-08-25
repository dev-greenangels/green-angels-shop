'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { DEFAULT_AUTH_CONSENT_TEXT } from '@/lib/settings/market'

type AuthConsentNoticeProps = {
  text?: string | null
  className?: string
}

/**
 * Renders auth consent copy with {terms}/{privacy}/{cookies} replaced by locale links.
 * Empty or Ukrainian default CMS text falls back to the active UI locale template.
 */
export function AuthConsentNotice({ text, className }: AuthConsentNoticeProps) {
  const t = useTranslations('auth')
  const tl = useTranslations('legalPages')

  const trimmedCms = text?.trim() ?? ''
  const source = (
    !trimmedCms || trimmedCms === DEFAULT_AUTH_CONSENT_TEXT
      ? t('consentTemplate')
      : trimmedCms
  ).trim()

  const nodes = useMemo(() => {
    const labels: Record<string, string> = {
      terms: tl('termsLink'),
      privacy: tl('privacyLink'),
      cookies: tl('cookiesLink'),
    }
    const hrefs: Record<string, '/terms' | '/privacy' | '/cookies'> = {
      terms: '/terms',
      privacy: '/privacy',
      cookies: '/cookies',
    }

    const parts = source.split(/(\{(?:terms|privacy|cookies)\})/g)
    return parts.map((part, index) => {
      const match = part.match(/^\{(terms|privacy|cookies)\}$/)
      if (!match) return <span key={index}>{part}</span>
      const key = match[1] as 'terms' | 'privacy' | 'cookies'
      return (
        <Link
          key={index}
          href={hrefs[key]}
          className="underline underline-offset-2 hover:text-foreground"
          target="_blank"
          rel="noopener noreferrer"
        >
          {labels[key]}
        </Link>
      )
    })
  }, [source, tl])

  if (!source) {
    return (
      <p className={className ?? 'text-xs text-muted-foreground'}>{t('consentFallback')}</p>
    )
  }

  return <p className={className ?? 'text-xs leading-relaxed text-muted-foreground'}>{nodes}</p>
}
