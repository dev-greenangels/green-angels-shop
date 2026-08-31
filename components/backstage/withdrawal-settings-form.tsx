'use client'

import { Loader2, Save } from 'lucide-react'

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
        <CardTitle>Odstúpenie od zmluvy</CardTitle>
        <CardDescription>
          Adresa na vrátenie tovaru a šablóny e-mailového potvrdenia prijatia oznámenia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="withdrawal-return-mode">Adresa na vrátenie</Label>
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
                <SelectItem value="store">Adresa obchodu (kontakty)</SelectItem>
                <SelectItem value="custom">Vlastná adresa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdrawal-window-days">Okno CTA v účte (dni)</Label>
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
            <p className="text-xs text-muted-foreground">
              Ovplyvňuje len tlačidlo v detaile objednávky zákazníka, nie verejný formulár.
            </p>
          </div>
        </div>

        {settings.returnAddressMode === 'custom' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="withdrawal-org">Názov organizácie</Label>
              <Input
                id="withdrawal-org"
                value={settings.customReturnAddress.organizationName}
                onChange={(e) => patchAddress('organizationName', e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="withdrawal-street">Ulica a číslo</Label>
              <Input
                id="withdrawal-street"
                value={settings.customReturnAddress.street}
                onChange={(e) => patchAddress('street', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-city">Mesto</Label>
              <Input
                id="withdrawal-city"
                value={settings.customReturnAddress.city}
                onChange={(e) => patchAddress('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-postal">PSČ</Label>
              <Input
                id="withdrawal-postal"
                value={settings.customReturnAddress.postalCode}
                onChange={(e) => patchAddress('postalCode', e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="withdrawal-country">Krajina</Label>
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
            <h3 className="text-sm font-semibold">Šablóna potvrdenia (e-mail)</h3>
            <p className="text-xs text-muted-foreground">
              Placeholdery: {'{{customerName}}'}, {'{{orderNumber}}'}, {'{{withdrawalReference}}'},
              {' {{submittedAt}}'}, {'{{withdrawalScope}}'}, {'{{partialItems}}'}, {'{{returnAddress}}'},
              {' {{sellerName}}'}, {'{{supportEmail}}'}
            </p>
          </div>
          <div className="max-h-[min(60vh,28rem)] space-y-4 overflow-y-auto pr-1">
            {SUPPORTED_LOCALES.map((loc) => (
              <div key={loc} className="space-y-3 rounded-lg border border-border/60 p-3">
                <TranslationLocaleLabel locale={loc} />
                <div className="space-y-2">
                  <Label htmlFor={`withdrawal-subject-${loc}`} className="text-xs font-normal text-muted-foreground">
                    Predmet
                  </Label>
                  <Input
                    id={`withdrawal-subject-${loc}`}
                    value={settings.acknowledgementTemplates[loc]?.subject ?? ''}
                    onChange={(e) => patchTemplate(loc, 'subject', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`withdrawal-body-${loc}`} className="text-xs font-normal text-muted-foreground">
                    Telo správy
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
          Uložiť nastavenia odstúpenia
        </Button>
      </CardContent>
    </Card>
  )
}
