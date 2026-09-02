'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Cookie } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Link } from '@/i18n/navigation'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { useCookieConsent } from '@/lib/legal/use-cookie-consent'
import { cn } from '@/lib/utils'

export function CookieConsentBanner() {
  const pathname = usePathname()
  const t = useTranslations('cookieConsent')
  const { consent, hydrated, saveConsent } = useCookieConsent()
  const [expanded, setExpanded] = useState(false)
  const [analyticsChoice, setAnalyticsChoice] = useState(false)
  const [marketingChoice, setMarketingChoice] = useState(false)

  if (pathname.startsWith('/backstage')) return null
  if (!hydrated || consent !== null) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/98 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md supports-[backdrop-filter]:bg-background/90"
      role="dialog"
      aria-live="polite"
      aria-label={t('title')}
    >
      <div className={cn(siteContentShellClassName, 'flex flex-col gap-4 py-5')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div className="space-y-1">
              <p className="font-serif text-base font-semibold text-foreground">{t('title')}</p>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {t.rich('description', {
                  cookies: (chunks) => (
                    <Link href="/cookies" className="underline underline-offset-2 hover:text-foreground">
                      {chunks}
                    </Link>
                  ),
                  privacy: (chunks) => (
                    <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
              {t('customize')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => saveConsent({ analytics: false, marketing: false })}
            >
              {t('rejectAll')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => saveConsent({ analytics: true, marketing: true })}
            >
              {t('acceptAll')}
            </Button>
          </div>
        </div>

        {expanded ? (
          <div className="space-y-3 rounded-lg border border-border/50 bg-card/60 p-4">
            <div className="flex items-start justify-between gap-4 rounded-md border border-border/40 bg-background/60 p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">{t('necessaryTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('necessaryDescription')}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">{t('alwaysOn')}</span>
            </div>
            <div className="flex items-start justify-between gap-4 rounded-md border border-border/40 bg-background/60 p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">{t('analyticsTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('analyticsDescription')}</p>
              </div>
              <Switch
                checked={analyticsChoice}
                onCheckedChange={setAnalyticsChoice}
                aria-label={t('analyticsTitle')}
              />
            </div>
            <div className="flex items-start justify-between gap-4 rounded-md border border-border/40 bg-background/60 p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">{t('marketingTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('marketingDescription')}</p>
              </div>
              <Switch
                checked={marketingChoice}
                onCheckedChange={setMarketingChoice}
                aria-label={t('marketingTitle')}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  saveConsent({ analytics: analyticsChoice, marketing: marketingChoice })
                }
              >
                {t('savePreferences')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
