'use client'

import { useTranslations } from 'next-intl'

import { Switch } from '@/components/ui/switch'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { legalSubsectionHeadingClassName } from '@/lib/legal/storefront-typography'
import { useCookieConsent } from '@/lib/legal/use-cookie-consent'
import { toast } from '@/lib/toast'

export function CookiePreferencesManager({ locale }: { locale: string }) {
  const t = useTranslations('cookiesPage')
  const { consent, hydrated, saveConsent } = useCookieConsent()

  if (!hydrated) return null

  const analyticsEnabled = consent?.analytics ?? false
  const marketingEnabled = consent?.marketing ?? false

  const handleAnalyticsToggle = (checked: boolean) => {
    saveConsent({ analytics: checked, marketing: marketingEnabled })
    toast.success(t('saved'))
  }

  const handleMarketingToggle = (checked: boolean) => {
    saveConsent({ analytics: analyticsEnabled, marketing: checked })
    toast.success(t('saved'))
  }

  const statusParts: string[] = []
  if (consent) {
    statusParts.push(analyticsEnabled ? t('analyticsEnabled') : t('analyticsDisabled'))
    statusParts.push(marketingEnabled ? t('marketingEnabled') : t('marketingDisabled'))
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
      <h3 className={legalSubsectionHeadingClassName}>{t('manageTitle')}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t('manageHint')}</p>

      {consent ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {t('currentStatusLabel')}{' '}
          <span className="font-medium text-foreground">{statusParts.join(' · ')}</span>
          {' · '}
          {t('updatedAtLabel', {
            date: formatDateTime(consent.updatedAt, locale, 'datetimeLong'),
          })}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
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
            checked={analyticsEnabled}
            onCheckedChange={handleAnalyticsToggle}
            aria-label={t('analyticsTitle')}
          />
        </div>
        <div className="flex items-start justify-between gap-4 rounded-md border border-border/40 bg-background/60 p-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{t('marketingTitle')}</p>
            <p className="text-xs text-muted-foreground">{t('marketingDescription')}</p>
          </div>
          <Switch
            checked={marketingEnabled}
            onCheckedChange={handleMarketingToggle}
            aria-label={t('marketingTitle')}
          />
        </div>
      </div>
    </div>
  )
}
