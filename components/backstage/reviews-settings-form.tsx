'use client'

import { Loader2, Save } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { TranslationLocaleLabel } from '@/components/backstage/content-locale-banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { SUPPORTED_LOCALES, type AppLocale } from '@/lib/i18n/locales'
import {
  REVIEW_REQUEST_EMAIL_PLACEHOLDERS,
  type ReviewsSettings,
} from '@/lib/settings/reviews'

type ReviewsSettingsFormProps = {
  settings: ReviewsSettings
  onChange: (next: ReviewsSettings) => void
  onSave: () => void | Promise<void>
  saving?: boolean
  isDirty?: boolean
}

export function ReviewsSettingsForm({
  settings,
  onChange,
  onSave,
  saving = false,
  isDirty = false,
}: ReviewsSettingsFormProps) {
  const t = useTranslations('pages.settings.reviews')

  const patchTemplate = (locale: AppLocale, field: 'subject' | 'body', value: string) => {
    const current = settings.requestEmailTemplates[locale] ?? { subject: '', body: '' }
    onChange({
      ...settings,
      requestEmailTemplates: {
        ...settings.requestEmailTemplates,
        [locale]: {
          ...current,
          [field]: value,
        },
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-3">
          <div>
            <p className="text-sm font-medium">{t('featureEnabled')}</p>
            <p className="text-xs text-muted-foreground">{t('featureEnabledHint')}</p>
          </div>
          <Switch
            checked={settings.postPurchaseRequestsEnabled}
            onCheckedChange={(checked) =>
              onChange({ ...settings, postPurchaseRequestsEnabled: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-3">
          <div>
            <p className="text-sm font-medium">{t('automaticSending')}</p>
            <p className="text-xs text-muted-foreground">{t('automaticSendingHint')}</p>
          </div>
          <Switch
            checked={settings.automaticSendingEnabled}
            onCheckedChange={(checked) =>
              onChange({ ...settings, automaticSendingEnabled: checked })
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reviews-delay-days">{t('delayDays')}</Label>
            <Input
              id="reviews-delay-days"
              type="number"
              min={1}
              max={60}
              value={settings.delayDays}
              onChange={(e) =>
                onChange({
                  ...settings,
                  delayDays: Math.min(60, Math.max(1, Number(e.target.value) || 1)),
                })
              }
            />
            <p className="text-xs text-muted-foreground">{t('delayDaysHint')}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reviews-token-days">{t('tokenValidityDays')}</Label>
            <Input
              id="reviews-token-days"
              type="number"
              min={7}
              max={365}
              value={settings.tokenValidityDays}
              onChange={(e) =>
                onChange({
                  ...settings,
                  tokenValidityDays: Math.min(365, Math.max(7, Number(e.target.value) || 7)),
                })
              }
            />
            <p className="text-xs text-muted-foreground">{t('tokenValidityDaysHint')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">{t('emailTemplateTitle')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('emailTemplatePlaceholdersLabel')}: {REVIEW_REQUEST_EMAIL_PLACEHOLDERS}
            </p>
          </div>
          <div className="max-h-[min(60vh,28rem)] space-y-4 overflow-y-auto pr-1">
            {SUPPORTED_LOCALES.map((loc) => (
              <div key={loc} className="space-y-3 rounded-lg border border-border/60 p-3">
                <TranslationLocaleLabel locale={loc} />
                <div className="space-y-2">
                  <Label
                    htmlFor={`reviews-subject-${loc}`}
                    className="text-xs font-normal text-muted-foreground"
                  >
                    {t('emailSubject')}
                  </Label>
                  <Input
                    id={`reviews-subject-${loc}`}
                    value={settings.requestEmailTemplates[loc]?.subject ?? ''}
                    onChange={(e) => patchTemplate(loc, 'subject', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor={`reviews-body-${loc}`}
                    className="text-xs font-normal text-muted-foreground"
                  >
                    {t('emailBody')}
                  </Label>
                  <Textarea
                    id={`reviews-body-${loc}`}
                    rows={8}
                    value={settings.requestEmailTemplates[loc]?.body ?? ''}
                    onChange={(e) => patchTemplate(loc, 'body', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button type="button" onClick={() => void onSave()} disabled={saving || !isDirty}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t('save')}
        </Button>
      </CardContent>
    </Card>
  )
}
