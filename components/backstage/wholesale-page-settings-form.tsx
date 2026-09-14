'use client'

import { Save } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CmsLocaleFieldLabel } from '@/components/backstage/cms-locale-fields-dialog'
import { ContentLocaleBanner } from '@/components/backstage/content-locale-banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { SUPPORTED_LOCALES, type AppLocale } from '@/lib/i18n/locales'
import {
  EMPTY_WHOLESALE_CMS,
  isBlankWholesaleCms,
  resolveWholesalePageCopy,
  type WholesalePageCmsCopy,
  type WholesalePageSettings,
} from '@/lib/settings/wholesale'

function paragraphsToText(items: string[]): string {
  return items.join('\n\n')
}

function textToParagraphs(value: string): string[] {
  return value
    .split(/\n{2,}/)
    .map((row) => row.trim())
    .filter(Boolean)
}

export function WholesalePageSettingsForm({
  settings,
  contentLocale,
  onChange,
  onSave,
  saving,
  isDirty,
  marketRegion,
}: {
  settings: WholesalePageSettings
  contentLocale: AppLocale
  onChange: (next: WholesalePageSettings) => void
  onSave: () => void
  saving: boolean
  isDirty: boolean
  marketRegion: 'ua' | 'sk'
}) {
  const tBanner = useTranslations('contentBanner')
  const storedCopy = settings.byLocale[contentLocale]
  const copy: WholesalePageCmsCopy = storedCopy ?? { ...EMPTY_WHOLESALE_CMS }
  const hintCopy =
    !storedCopy || isBlankWholesaleCms(storedCopy)
      ? resolveWholesalePageCopy(settings, contentLocale, marketRegion)
      : null

  const patchFlags = (partial: Partial<WholesalePageSettings>) => {
    onChange({ ...settings, ...partial })
  }

  const patchCopy = (partial: Partial<WholesalePageCmsCopy>) => {
    onChange({
      ...settings,
      byLocale: {
        ...settings.byLocale,
        [contentLocale]: { ...copy, ...partial },
      },
    })
  }

  const fieldValues = (get: (c: WholesalePageCmsCopy) => string) => {
    const out: Partial<Record<AppLocale, string>> = {}
    for (const loc of SUPPORTED_LOCALES) {
      out[loc] = get(settings.byLocale[loc] ?? EMPTY_WHOLESALE_CMS)
    }
    return out
  }

  const applyTranslations = (
    set: (c: WholesalePageCmsCopy, value: string) => WholesalePageCmsCopy,
    translations: Partial<Record<AppLocale, string>>,
  ) => {
    const byLocale: Partial<Record<AppLocale, WholesalePageCmsCopy>> = { ...settings.byLocale }
    for (const loc of SUPPORTED_LOCALES) {
      const base = byLocale[loc] ?? { ...EMPTY_WHOLESALE_CMS }
      byLocale[loc] = set(base, translations[loc] ?? '')
    }
    onChange({ ...settings, byLocale })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Сторінка «Гурт»</CardTitle>
        <CardDescription>
          Текст лендінгу перекладається мовою контенту (перемикач у шапці бекофісу). Прапорці
          видимості та email — спільні для всього деплою ({marketRegion === 'sk' ? 'SK / EU' : 'UA'}
          ).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ContentLocaleBanner hint={tBanner('switchAutoSave')} />

        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <p className="font-medium">Показувати сторінку гурту</p>
            <p className="text-sm text-muted-foreground">
              Вимкніть, щоб приховати /wholesale з меню, футера та sitemap (пряме посилання —
              404).
            </p>
          </div>
          <Switch
            checked={settings.pageEnabled}
            onCheckedChange={(pageEnabled) => patchFlags({ pageEnabled })}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <p className="font-medium">Email-сповіщення про нові заявки</p>
            <p className="text-sm text-muted-foreground">
              Якщо вимкнено — заявки зберігаються в бекофісі без листа.
            </p>
          </div>
          <Switch
            checked={settings.notifyEmailEnabled}
            onCheckedChange={(notifyEmailEnabled) => patchFlags({ notifyEmailEnabled })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wholesale-notify-email">Email для сповіщень (необовʼязково)</Label>
          <Input
            id="wholesale-notify-email"
            type="email"
            placeholder="Залишити порожнім — email з контактів магазину"
            value={settings.notifyEmail ?? ''}
            disabled={!settings.notifyEmailEnabled}
            onChange={(e) => {
              const raw = e.target.value.trim()
              patchFlags({ notifyEmail: raw ? raw : null })
            }}
          />
          <p className="text-xs text-muted-foreground">
            Якщо порожньо — береться email з блоку контактів (мітка гурт / wholesale) або перший
            email магазину.
          </p>
        </div>

        <div className="space-y-2">
          <CmsLocaleFieldLabel
            htmlFor="wholesale-title"
            values={fieldValues((c) => c.title)}
            onSaveTranslations={(translations) =>
              applyTranslations((c, value) => ({ ...c, title: value }), translations)
            }
          >
            Заголовок H1
          </CmsLocaleFieldLabel>
          <Input
            id="wholesale-title"
            value={copy.title}
            onChange={(e) => patchCopy({ title: e.target.value })}
            placeholder={hintCopy?.title}
          />
        </div>
        <div className="space-y-2">
          <CmsLocaleFieldLabel
            htmlFor="wholesale-intro"
            values={fieldValues((c) => c.intro)}
            multiline
            onSaveTranslations={(translations) =>
              applyTranslations((c, value) => ({ ...c, intro: value }), translations)
            }
          >
            Лід
          </CmsLocaleFieldLabel>
          <Textarea
            id="wholesale-intro"
            rows={3}
            value={copy.intro}
            onChange={(e) => patchCopy({ intro: e.target.value })}
            placeholder={hintCopy?.intro}
          />
        </div>
        <div className="space-y-2">
          <CmsLocaleFieldLabel
            htmlFor="wholesale-body"
            values={fieldValues((c) => paragraphsToText(c.paragraphs))}
            multiline
            onSaveTranslations={(translations) =>
              applyTranslations(
                (c, value) => ({ ...c, paragraphs: textToParagraphs(value) }),
                translations,
              )
            }
          >
            Текст (абзаци через порожній рядок)
          </CmsLocaleFieldLabel>
          <Textarea
            id="wholesale-body"
            rows={12}
            value={paragraphsToText(copy.paragraphs)}
            onChange={(e) => patchCopy({ paragraphs: textToParagraphs(e.target.value) })}
            placeholder={hintCopy ? paragraphsToText(hintCopy.paragraphs) : undefined}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <CmsLocaleFieldLabel
              htmlFor="wholesale-seo-title"
              values={fieldValues((c) => c.seoTitle)}
              onSaveTranslations={(translations) =>
                applyTranslations((c, value) => ({ ...c, seoTitle: value }), translations)
              }
            >
              SEO title
            </CmsLocaleFieldLabel>
            <Input
              id="wholesale-seo-title"
              value={copy.seoTitle}
              onChange={(e) => patchCopy({ seoTitle: e.target.value })}
              placeholder={hintCopy?.seoTitle}
            />
          </div>
          <div className="space-y-2">
            <CmsLocaleFieldLabel
              htmlFor="wholesale-form-title"
              values={fieldValues((c) => c.formTitle)}
              onSaveTranslations={(translations) =>
                applyTranslations((c, value) => ({ ...c, formTitle: value }), translations)
              }
            >
              Заголовок форми
            </CmsLocaleFieldLabel>
            <Input
              id="wholesale-form-title"
              value={copy.formTitle}
              onChange={(e) => patchCopy({ formTitle: e.target.value })}
              placeholder={hintCopy?.formTitle}
            />
          </div>
        </div>
        <div className="space-y-2">
          <CmsLocaleFieldLabel
            htmlFor="wholesale-seo-desc"
            values={fieldValues((c) => c.seoDescription)}
            multiline
            onSaveTranslations={(translations) =>
              applyTranslations((c, value) => ({ ...c, seoDescription: value }), translations)
            }
          >
            SEO description
          </CmsLocaleFieldLabel>
          <Textarea
            id="wholesale-seo-desc"
            rows={2}
            value={copy.seoDescription}
            onChange={(e) => patchCopy({ seoDescription: e.target.value })}
            placeholder={hintCopy?.seoDescription}
          />
        </div>
        <div className="space-y-2">
          <CmsLocaleFieldLabel
            htmlFor="wholesale-form-intro"
            values={fieldValues((c) => c.formIntro)}
            multiline
            onSaveTranslations={(translations) =>
              applyTranslations((c, value) => ({ ...c, formIntro: value }), translations)
            }
          >
            Підзаголовок форми
          </CmsLocaleFieldLabel>
          <Textarea
            id="wholesale-form-intro"
            rows={2}
            value={copy.formIntro}
            onChange={(e) => patchCopy({ formIntro: e.target.value })}
            placeholder={hintCopy?.formIntro}
          />
        </div>
        <Button type="button" onClick={onSave} disabled={!isDirty || saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Збереження…' : 'Зберегти сторінку гурту'}
        </Button>
      </CardContent>
    </Card>
  )
}
