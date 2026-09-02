'use client'

import { Loader2, Save } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { TranslationLocaleLabel } from '@/components/backstage/content-locale-banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SUPPORTED_LOCALES, type AppLocale } from '@/lib/i18n/locales'
import type { WithdrawalSettings } from '@/lib/settings/withdrawal'

const WITHDRAWAL_EMAIL_PLACEHOLDERS =
  '{{customerName}}, {{orderNumber}}, {{withdrawalReference}}, {{submittedAt}}, {{withdrawalScope}}, {{partialItems}}, {{returnAddress}}, {{sellerName}}, {{supportEmail}}'

type WithdrawalSettingsFormProps = {
  settings: WithdrawalSettings
  onChange: (next: WithdrawalSettings) => void
  onSave: () => void | Promise<void>
  saving?: boolean
  isDirty?: boolean
}

export function WithdrawalSettingsForm({
  settings,
  onChange,
  onSave,
  saving = false,
  isDirty = false,
}: WithdrawalSettingsFormProps) {
  const t = useTranslations('pages.settings.withdrawal')

  const patchAddress = (field: keyof WithdrawalSettings['customReturnAddress'], value: string) => {
    onChange({
      ...settings,
      customReturnAddress: {
        ...settings.customReturnAddress,
        [field]: value,
      },
    })
  }

  const patchTemplate = (locale: AppLocale, field: 'subject' | 'body', value: string) => {
    const current = settings.acknowledgementTemplates[locale] ?? { subject: '', body: '' }
    onChange({
      ...settings,
      acknowledgementTemplates: {
        ...settings.acknowledgementTemplates,
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="withdrawal-return-mode">{t('returnAddressLabel')}</Label>
            <Select
              value={settings.returnAddressMode}
              onValueChange={(value: 'store' | 'custom') =>
                onChange({ ...settings, returnAddressMode: value })
              }
            >
              <SelectTrigger id="withdrawal-return-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="store">{t('returnAddressStore')}</SelectItem>
                <SelectItem value="custom">{t('returnAddressCustom')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdrawal-window-days">{t('accountWindowDaysLabel')}</Label>
            <Input
              id="withdrawal-window-days"
              type="number"
              min={1}
              max={365}
              value={settings.accountWithdrawalWindowDays}
              onChange={(e) =>
                onChange({
                  ...settings,
                  accountWithdrawalWindowDays: Math.min(
                    365,
                    Math.max(1, Number(e.target.value) || 1),
                  ),
                })
              }
            />
            <p className="text-xs text-muted-foreground">{t('accountWindowDaysHint')}</p>
          </div>
        </div>

        {settings.returnAddressMode === 'custom' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="withdrawal-org">{t('organizationName')}</Label>
              <Input
                id="withdrawal-org"
                value={settings.customReturnAddress.organizationName}
                onChange={(e) => patchAddress('organizationName', e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="withdrawal-street">{t('street')}</Label>
              <Input
                id="withdrawal-street"
                value={settings.customReturnAddress.street}
                onChange={(e) => patchAddress('street', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-city">{t('city')}</Label>
              <Input
                id="withdrawal-city"
                value={settings.customReturnAddress.city}
                onChange={(e) => patchAddress('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-postal">{t('postalCode')}</Label>
              <Input
                id="withdrawal-postal"
                value={settings.customReturnAddress.postalCode}
                onChange={(e) => patchAddress('postalCode', e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="withdrawal-country">{t('country')}</Label>
              <Input
                id="withdrawal-country"
                value={settings.customReturnAddress.country}
                onChange={(e) => patchAddress('country', e.target.value)}
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">{t('emailTemplateTitle')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('emailTemplatePlaceholdersLabel')}: {WITHDRAWAL_EMAIL_PLACEHOLDERS}
            </p>
          </div>
          <div className="max-h-[min(60vh,28rem)] space-y-4 overflow-y-auto pr-1">
            {SUPPORTED_LOCALES.map((loc) => (
              <div key={loc} className="space-y-3 rounded-lg border border-border/60 p-3">
                <TranslationLocaleLabel locale={loc} />
                <div className="space-y-2">
                  <Label htmlFor={`withdrawal-subject-${loc}`} className="text-xs font-normal text-muted-foreground">
                    {t('emailSubject')}
                  </Label>
                  <Input
                    id={`withdrawal-subject-${loc}`}
                    value={settings.acknowledgementTemplates[loc]?.subject ?? ''}
                    onChange={(e) => patchTemplate(loc, 'subject', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`withdrawal-body-${loc}`} className="text-xs font-normal text-muted-foreground">
                    {t('emailBody')}
                  </Label>
                  <Textarea
                    id={`withdrawal-body-${loc}`}
                    rows={8}
                    value={settings.acknowledgementTemplates[loc]?.body ?? ''}
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
