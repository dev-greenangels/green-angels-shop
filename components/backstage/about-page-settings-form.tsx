'use client'

import { Plus, Save, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CmsLocaleFieldLabel } from '@/components/backstage/cms-locale-fields-dialog'
import { ContentLocaleBanner } from '@/components/backstage/content-locale-banner'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { SUPPORTED_LOCALES, type AppLocale } from '@/lib/i18n/locales'
import {
  defaultAboutCmsByLocale,
  emptyAboutCms,
  isBlankAboutCms,
  type AboutPageCmsCopy,
  type AboutPageSettings,
  type AboutProductionCard,
  type AboutStatItem,
} from '@/lib/settings/about'

function listToLines(items: string[]): string {
  return items.join('\n')
}

function linesToList(value: string): string[] {
  return value
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean)
}

function SectionHeader({
  title,
  enabled,
  onEnabledChange,
}: {
  title: string
  enabled: boolean
  onEnabledChange: (next: boolean) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
      <h3 className="font-serif text-lg font-semibold text-foreground">{title}</h3>
      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground">Увімкнено</Label>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>
    </div>
  )
}

export function AboutPageSettingsForm({
  settings,
  contentLocale,
  onChange,
  onSave,
  saving,
  isDirty,
  marketRegion,
}: {
  settings: AboutPageSettings
  contentLocale: AppLocale
  onChange: (next: AboutPageSettings) => void
  onSave: () => void
  saving: boolean
  isDirty: boolean
  marketRegion: 'ua' | 'sk'
}) {
  const tBanner = useTranslations('contentBanner')
  const empty = emptyAboutCms(marketRegion)
  const storedCopy = settings.byLocale[contentLocale]
  const copy: AboutPageCmsCopy = storedCopy ?? empty
  const sameLocaleDefault = defaultAboutCmsByLocale(marketRegion)[contentLocale]
  const hintCopy =
    !storedCopy || isBlankAboutCms(storedCopy)
      ? sameLocaleDefault && !isBlankAboutCms(sameLocaleDefault)
        ? sameLocaleDefault
        : null
      : null

  const patchCopy = (partial: Partial<AboutPageCmsCopy>) => {
    onChange({
      ...settings,
      schemaVersion: 2,
      byLocale: {
        ...settings.byLocale,
        [contentLocale]: { ...copy, ...partial, schemaVersion: 2 },
      },
    })
  }

  const patchSection = <K extends keyof AboutPageCmsCopy>(
    key: K,
    partial: Partial<AboutPageCmsCopy[K]>,
  ) => {
    const current = copy[key]
    if (current && typeof current === 'object') {
      patchCopy({ [key]: { ...(current as object), ...partial } } as Partial<AboutPageCmsCopy>)
    }
  }

  const fieldValues = (get: (c: AboutPageCmsCopy) => string) => {
    const out: Partial<Record<AppLocale, string>> = {}
    for (const loc of SUPPORTED_LOCALES) {
      out[loc] = get(settings.byLocale[loc] ?? empty)
    }
    return out
  }

  const applyTranslations = (
    set: (c: AboutPageCmsCopy, value: string) => AboutPageCmsCopy,
    translations: Partial<Record<AppLocale, string>>,
  ) => {
    const byLocale: Partial<Record<AppLocale, AboutPageCmsCopy>> = { ...settings.byLocale }
    for (const loc of SUPPORTED_LOCALES) {
      const base = byLocale[loc] ?? emptyAboutCms(marketRegion)
      byLocale[loc] = set({ ...base, schemaVersion: 2 }, translations[loc] ?? '')
    }
    onChange({ ...settings, schemaVersion: 2, byLocale })
  }

  const updateStat = (index: number, patch: Partial<AboutStatItem>) => {
    const items = copy.stats.items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    patchSection('stats', { items })
  }

  const addStat = () => {
    patchSection('stats', {
      items: [...copy.stats.items, { value: '', label: '', description: '' }],
    })
  }

  const removeStat = (index: number) => {
    patchSection('stats', { items: copy.stats.items.filter((_, i) => i !== index) })
  }

  const updateCard = (index: number, patch: Partial<AboutProductionCard>) => {
    const cards = copy.production.cards.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    )
    patchSection('production', { cards })
  }

  const addCard = () => {
    patchSection('production', {
      cards: [
        ...copy.production.cards,
        { title: '', description: '', imageUrl: '', imageAlt: '' },
      ],
    })
  }

  const removeCard = (index: number) => {
    patchSection('production', {
      cards: copy.production.cards.filter((_, i) => i !== index),
    })
  }

  const missingLocaleHint =
    (!storedCopy || isBlankAboutCms(storedCopy)) && !hintCopy
      ? 'Ця мова ще не заповнена. Storefront покаже «недоступно» (без EN fallback).'
      : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Сторінка «Про нас»</CardTitle>
        <CardDescription>
          CMS секції /about мовою контенту (перемикач у шапці). Дефолти залежать від ринку деплою (
          {marketRegion === 'sk' ? 'SK / EU' : 'UA'}). Layout фіксований у коді — без page builder.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <ContentLocaleBanner hint={tBanner('switchAutoSave')} />
        {missingLocaleHint ? (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
            {missingLocaleHint}
          </p>
        ) : null}

        <div className="space-y-4">
          <h3 className="font-serif text-lg font-semibold">SEO</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <CmsLocaleFieldLabel
                htmlFor="about-seo-title"
                values={fieldValues((c) => c.seo.title)}
                onSaveTranslations={(translations) =>
                  applyTranslations(
                    (c, value) => ({ ...c, seo: { ...c.seo, title: value } }),
                    translations,
                  )
                }
              >
                SEO title
              </CmsLocaleFieldLabel>
              <Input
                id="about-seo-title"
                value={copy.seo.title}
                onChange={(e) => patchSection('seo', { title: e.target.value })}
                placeholder={hintCopy?.seo.title}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <CmsLocaleFieldLabel
                htmlFor="about-seo-desc"
                values={fieldValues((c) => c.seo.description)}
                multiline
                onSaveTranslations={(translations) =>
                  applyTranslations(
                    (c, value) => ({ ...c, seo: { ...c.seo, description: value } }),
                    translations,
                  )
                }
              >
                SEO description
              </CmsLocaleFieldLabel>
              <Textarea
                id="about-seo-desc"
                rows={2}
                value={copy.seo.description}
                onChange={(e) => patchSection('seo', { description: e.target.value })}
                placeholder={hintCopy?.seo.description}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader
            title="Hero"
            enabled={copy.hero.enabled}
            onEnabledChange={(enabled) => patchSection('hero', { enabled })}
          />
          <div className="space-y-2">
            <CmsLocaleFieldLabel
              htmlFor="about-hero"
              values={fieldValues((c) => c.hero.title)}
              onSaveTranslations={(translations) =>
                applyTranslations(
                  (c, value) => ({ ...c, hero: { ...c.hero, title: value } }),
                  translations,
                )
              }
            >
              Заголовок H1
            </CmsLocaleFieldLabel>
            <Input
              id="about-hero"
              value={copy.hero.title}
              onChange={(e) => patchSection('hero', { title: e.target.value })}
              placeholder={hintCopy?.hero.title}
              disabled={!copy.hero.enabled}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader
            title="Intro"
            enabled={copy.intro.enabled}
            onEnabledChange={(enabled) => patchSection('intro', { enabled })}
          />
          <div className="space-y-2">
            <CmsLocaleFieldLabel
              htmlFor="about-intro"
              values={fieldValues((c) => c.intro.body)}
              multiline
              onSaveTranslations={(translations) =>
                applyTranslations(
                  (c, value) => ({ ...c, intro: { ...c.intro, body: value } }),
                  translations,
                )
              }
            >
              Текст (safe HTML)
            </CmsLocaleFieldLabel>
            <Textarea
              id="about-intro"
              rows={10}
              value={copy.intro.body}
              onChange={(e) => patchSection('intro', { body: e.target.value })}
              placeholder={hintCopy?.intro.body}
              className="font-mono text-sm"
              disabled={!copy.intro.enabled}
            />
            <p className="text-xs text-muted-foreground">
              Дозволені теги: p, br, strong, em, ul, ol, li, a[href]
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="about-intro-url">Зображення (URL)</Label>
              <Input
                id="about-intro-url"
                value={copy.intro.imageUrl}
                onChange={(e) => patchSection('intro', { imageUrl: e.target.value })}
                disabled={!copy.intro.enabled}
              />
            </div>
            <div className="space-y-2">
              <CmsLocaleFieldLabel
                htmlFor="about-intro-alt"
                values={fieldValues((c) => c.intro.imageAlt)}
                onSaveTranslations={(translations) =>
                  applyTranslations(
                    (c, value) => ({ ...c, intro: { ...c.intro, imageAlt: value } }),
                    translations,
                  )
                }
              >
                Alt
              </CmsLocaleFieldLabel>
              <Input
                id="about-intro-alt"
                value={copy.intro.imageAlt}
                onChange={(e) => patchSection('intro', { imageAlt: e.target.value })}
                disabled={!copy.intro.enabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Стиль фото</Label>
            <Select
              value={copy.intro.imageStyle}
              onValueChange={(value) =>
                patchSection('intro', { imageStyle: value === 'rounded' ? 'rounded' : 'circle' })
              }
              disabled={!copy.intro.enabled}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circle">Коло</SelectItem>
                <SelectItem value="rounded">Широке з заокругленням</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader
            title="Stats"
            enabled={copy.stats.enabled}
            onEnabledChange={(enabled) => patchSection('stats', { enabled })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <CmsLocaleFieldLabel
                values={fieldValues((c) => c.stats.title)}
                onSaveTranslations={(translations) =>
                  applyTranslations(
                    (c, value) => ({ ...c, stats: { ...c.stats, title: value } }),
                    translations,
                  )
                }
              >
                Заголовок
              </CmsLocaleFieldLabel>
              <Input
                placeholder="Заголовок"
                value={copy.stats.title}
                onChange={(e) => patchSection('stats', { title: e.target.value })}
                disabled={!copy.stats.enabled}
              />
            </div>
            <div className="space-y-1">
              <CmsLocaleFieldLabel
                values={fieldValues((c) => c.stats.subtitle)}
                onSaveTranslations={(translations) =>
                  applyTranslations(
                    (c, value) => ({ ...c, stats: { ...c.stats, subtitle: value } }),
                    translations,
                  )
                }
              >
                Підзаголовок
              </CmsLocaleFieldLabel>
              <Input
                placeholder="Підзаголовок"
                value={copy.stats.subtitle}
                onChange={(e) => patchSection('stats', { subtitle: e.target.value })}
                disabled={!copy.stats.enabled}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label>Цифри</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStat}
              disabled={!copy.stats.enabled}
            >
              <Plus className="mr-1 h-4 w-4" />
              Додати
            </Button>
          </div>
          {copy.stats.items.map((stat, index) => (
            <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-1">
                <CmsLocaleFieldLabel
                  values={fieldValues((c) => c.stats.items[index]?.value ?? '')}
                  onSaveTranslations={(translations) =>
                    applyTranslations((c, value) => {
                      const items = [...c.stats.items]
                      while (items.length <= index) {
                        items.push({ value: '', label: '', description: '' })
                      }
                      items[index] = { ...items[index]!, value }
                      return { ...c, stats: { ...c.stats, items } }
                    }, translations)
                  }
                >
                  Значення
                </CmsLocaleFieldLabel>
                <Input
                  placeholder="Значення"
                  value={stat.value}
                  onChange={(e) => updateStat(index, { value: e.target.value })}
                  disabled={!copy.stats.enabled}
                />
              </div>
              <div className="space-y-1">
                <CmsLocaleFieldLabel
                  values={fieldValues((c) => c.stats.items[index]?.label ?? '')}
                  onSaveTranslations={(translations) =>
                    applyTranslations((c, value) => {
                      const items = [...c.stats.items]
                      while (items.length <= index) {
                        items.push({ value: '', label: '', description: '' })
                      }
                      items[index] = { ...items[index]!, label: value }
                      return { ...c, stats: { ...c.stats, items } }
                    }, translations)
                  }
                >
                  Підпис
                </CmsLocaleFieldLabel>
                <Input
                  placeholder="Підпис"
                  value={stat.label}
                  onChange={(e) => updateStat(index, { label: e.target.value })}
                  disabled={!copy.stats.enabled}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="self-end"
                onClick={() => removeStat(index)}
                disabled={!copy.stats.enabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="space-y-1 sm:col-span-3">
                <CmsLocaleFieldLabel
                  values={fieldValues((c) => c.stats.items[index]?.description ?? '')}
                  multiline
                  onSaveTranslations={(translations) =>
                    applyTranslations((c, value) => {
                      const items = [...c.stats.items]
                      while (items.length <= index) {
                        items.push({ value: '', label: '', description: '' })
                      }
                      items[index] = { ...items[index]!, description: value }
                      return { ...c, stats: { ...c.stats, items } }
                    }, translations)
                  }
                >
                  Опис
                </CmsLocaleFieldLabel>
                <Textarea
                  rows={2}
                  placeholder="Опис"
                  value={stat.description}
                  onChange={(e) => updateStat(index, { description: e.target.value })}
                  disabled={!copy.stats.enabled}
                />
              </div>
            </div>
          ))}
          <div className="space-y-2">
            <CmsLocaleFieldLabel
              values={fieldValues((c) => listToLines(c.stats.theses))}
              multiline
              onSaveTranslations={(translations) =>
                applyTranslations(
                  (c, value) => ({
                    ...c,
                    stats: { ...c.stats, theses: linesToList(value) },
                  }),
                  translations,
                )
              }
            >
              Тези (по одному в рядку)
            </CmsLocaleFieldLabel>
            <Textarea
              rows={4}
              value={listToLines(copy.stats.theses)}
              onChange={(e) => patchSection('stats', { theses: linesToList(e.target.value) })}
              disabled={!copy.stats.enabled}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader
            title="Why us"
            enabled={copy.whyUs.enabled}
            onEnabledChange={(enabled) => patchSection('whyUs', { enabled })}
          />
          <div className="space-y-1">
            <CmsLocaleFieldLabel
              values={fieldValues((c) => c.whyUs.title)}
              onSaveTranslations={(translations) =>
                applyTranslations(
                  (c, value) => ({ ...c, whyUs: { ...c.whyUs, title: value } }),
                  translations,
                )
              }
            >
              Заголовок
            </CmsLocaleFieldLabel>
            <Input
              placeholder="Заголовок"
              value={copy.whyUs.title}
              onChange={(e) => patchSection('whyUs', { title: e.target.value })}
              disabled={!copy.whyUs.enabled}
            />
          </div>
          <div className="space-y-1">
            <CmsLocaleFieldLabel
              values={fieldValues((c) => c.whyUs.body)}
              multiline
              onSaveTranslations={(translations) =>
                applyTranslations(
                  (c, value) => ({ ...c, whyUs: { ...c.whyUs, body: value } }),
                  translations,
                )
              }
            >
              Текст (safe HTML)
            </CmsLocaleFieldLabel>
            <Textarea
              rows={8}
              placeholder="Текст (safe HTML)"
              value={copy.whyUs.body}
              onChange={(e) => patchSection('whyUs', { body: e.target.value })}
              className="font-mono text-sm"
              disabled={!copy.whyUs.enabled}
            />
          </div>
          <div className="space-y-1">
            <CmsLocaleFieldLabel
              values={fieldValues((c) => listToLines(c.whyUs.benefits))}
              multiline
              onSaveTranslations={(translations) =>
                applyTranslations(
                  (c, value) => ({
                    ...c,
                    whyUs: { ...c.whyUs, benefits: linesToList(value) },
                  }),
                  translations,
                )
              }
            >
              Переваги (по одному в рядку)
            </CmsLocaleFieldLabel>
            <Textarea
              rows={6}
              placeholder="Переваги (по одному в рядку)"
              value={listToLines(copy.whyUs.benefits)}
              onChange={(e) => patchSection('whyUs', { benefits: linesToList(e.target.value) })}
              disabled={!copy.whyUs.enabled}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader
            title="Markets (один продавець / домени)"
            enabled={copy.markets.enabled}
            onEnabledChange={(enabled) => patchSection('markets', { enabled })}
          />
          <div className="space-y-1">
            <CmsLocaleFieldLabel
              values={fieldValues((c) => c.markets.title)}
              onSaveTranslations={(translations) =>
                applyTranslations(
                  (c, value) => ({ ...c, markets: { ...c.markets, title: value } }),
                  translations,
                )
              }
            >
              Заголовок
            </CmsLocaleFieldLabel>
            <Input
              placeholder="Заголовок"
              value={copy.markets.title}
              onChange={(e) => patchSection('markets', { title: e.target.value })}
              disabled={!copy.markets.enabled}
            />
          </div>
          <div className="space-y-1">
            <CmsLocaleFieldLabel
              values={fieldValues((c) => c.markets.body)}
              multiline
              onSaveTranslations={(translations) =>
                applyTranslations(
                  (c, value) => ({ ...c, markets: { ...c.markets, body: value } }),
                  translations,
                )
              }
            >
              Текст (safe HTML)
            </CmsLocaleFieldLabel>
            <Textarea
              rows={6}
              placeholder="Текст (safe HTML) — хто продавець, SK база, .sk/.hu/.at"
              value={copy.markets.body}
              onChange={(e) => patchSection('markets', { body: e.target.value })}
              className="font-mono text-sm"
              disabled={!copy.markets.enabled}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader
            title="Production cards"
            enabled={copy.production.enabled}
            onEnabledChange={(enabled) => patchSection('production', { enabled })}
          />
          <div className="space-y-1">
            <CmsLocaleFieldLabel
              values={fieldValues((c) => c.production.title)}
              onSaveTranslations={(translations) =>
                applyTranslations(
                  (c, value) => ({ ...c, production: { ...c.production, title: value } }),
                  translations,
                )
              }
            >
              Заголовок секції
            </CmsLocaleFieldLabel>
            <Input
              placeholder="Заголовок секції"
              value={copy.production.title}
              onChange={(e) => patchSection('production', { title: e.target.value })}
              disabled={!copy.production.enabled}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label>Картки</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCard}
              disabled={!copy.production.enabled}
            >
              <Plus className="mr-1 h-4 w-4" />
              Додати
            </Button>
          </div>
          {copy.production.cards.map((line, index) => (
            <div key={index} className="space-y-2 rounded-lg border p-3">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCard(index)}
                  disabled={!copy.production.enabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <CmsLocaleFieldLabel
                  values={fieldValues((c) => c.production.cards[index]?.title ?? '')}
                  onSaveTranslations={(translations) =>
                    applyTranslations((c, value) => {
                      const cards = [...c.production.cards]
                      while (cards.length <= index) {
                        cards.push({ title: '', description: '', imageUrl: '', imageAlt: '' })
                      }
                      cards[index] = { ...cards[index]!, title: value }
                      return { ...c, production: { ...c.production, cards } }
                    }, translations)
                  }
                >
                  Назва
                </CmsLocaleFieldLabel>
                <Input
                  placeholder="Назва"
                  value={line.title}
                  onChange={(e) => updateCard(index, { title: e.target.value })}
                  disabled={!copy.production.enabled}
                />
              </div>
              <div className="space-y-1">
                <CmsLocaleFieldLabel
                  values={fieldValues((c) => c.production.cards[index]?.description ?? '')}
                  multiline
                  onSaveTranslations={(translations) =>
                    applyTranslations((c, value) => {
                      const cards = [...c.production.cards]
                      while (cards.length <= index) {
                        cards.push({ title: '', description: '', imageUrl: '', imageAlt: '' })
                      }
                      cards[index] = { ...cards[index]!, description: value }
                      return { ...c, production: { ...c.production, cards } }
                    }, translations)
                  }
                >
                  Опис
                </CmsLocaleFieldLabel>
                <Textarea
                  rows={3}
                  placeholder="Опис"
                  value={line.description}
                  onChange={(e) => updateCard(index, { description: e.target.value })}
                  disabled={!copy.production.enabled}
                />
              </div>
              <div className="space-y-1">
                <Label>URL зображення</Label>
                <Input
                  placeholder="URL зображення"
                  value={line.imageUrl}
                  onChange={(e) => updateCard(index, { imageUrl: e.target.value })}
                  disabled={!copy.production.enabled}
                />
              </div>
              <div className="space-y-1">
                <CmsLocaleFieldLabel
                  values={fieldValues((c) => c.production.cards[index]?.imageAlt ?? '')}
                  onSaveTranslations={(translations) =>
                    applyTranslations((c, value) => {
                      const cards = [...c.production.cards]
                      while (cards.length <= index) {
                        cards.push({ title: '', description: '', imageUrl: '', imageAlt: '' })
                      }
                      cards[index] = { ...cards[index]!, imageAlt: value }
                      return { ...c, production: { ...c.production, cards } }
                    }, translations)
                  }
                >
                  Alt
                </CmsLocaleFieldLabel>
                <Input
                  placeholder="Alt"
                  value={line.imageAlt}
                  onChange={(e) => updateCard(index, { imageAlt: e.target.value })}
                  disabled={!copy.production.enabled}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <SectionHeader
            title="Video"
            enabled={copy.video.enabled}
            onEnabledChange={(enabled) => patchSection('video', { enabled })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <CmsLocaleFieldLabel
                values={fieldValues((c) => c.video.title)}
                onSaveTranslations={(translations) =>
                  applyTranslations(
                    (c, value) => ({ ...c, video: { ...c.video, title: value } }),
                    translations,
                  )
                }
              >
                Заголовок
              </CmsLocaleFieldLabel>
              <Input
                placeholder="Заголовок"
                value={copy.video.title}
                onChange={(e) => patchSection('video', { title: e.target.value })}
                disabled={!copy.video.enabled}
              />
            </div>
            <div className="space-y-1">
              <CmsLocaleFieldLabel
                values={fieldValues((c) => c.video.subtitle)}
                onSaveTranslations={(translations) =>
                  applyTranslations(
                    (c, value) => ({ ...c, video: { ...c.video, subtitle: value } }),
                    translations,
                  )
                }
              >
                Підзаголовок
              </CmsLocaleFieldLabel>
              <Input
                placeholder="Підзаголовок"
                value={copy.video.subtitle}
                onChange={(e) => patchSection('video', { subtitle: e.target.value })}
                disabled={!copy.video.enabled}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>YouTube embed URL</Label>
            <Input
              placeholder="YouTube embed URL"
              value={copy.video.embedUrl}
              onChange={(e) => patchSection('video', { embedUrl: e.target.value })}
              disabled={!copy.video.enabled}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader
            title="Delivery"
            enabled={copy.delivery.enabled}
            onEnabledChange={(enabled) => patchSection('delivery', { enabled })}
          />
          <div className="space-y-1">
            <CmsLocaleFieldLabel
              values={fieldValues((c) => c.delivery.title)}
              onSaveTranslations={(translations) =>
                applyTranslations(
                  (c, value) => ({ ...c, delivery: { ...c.delivery, title: value } }),
                  translations,
                )
              }
            >
              Заголовок
            </CmsLocaleFieldLabel>
            <Input
              placeholder="Заголовок"
              value={copy.delivery.title}
              onChange={(e) => patchSection('delivery', { title: e.target.value })}
              disabled={!copy.delivery.enabled}
            />
          </div>
          <div className="space-y-1">
            <CmsLocaleFieldLabel
              values={fieldValues((c) => c.delivery.body)}
              multiline
              onSaveTranslations={(translations) =>
                applyTranslations(
                  (c, value) => ({ ...c, delivery: { ...c.delivery, body: value } }),
                  translations,
                )
              }
            >
              Текст (safe HTML)
            </CmsLocaleFieldLabel>
            <Textarea
              rows={6}
              placeholder="Текст (safe HTML)"
              value={copy.delivery.body}
              onChange={(e) => patchSection('delivery', { body: e.target.value })}
              className="font-mono text-sm"
              disabled={!copy.delivery.enabled}
            />
          </div>
          <div className="space-y-1">
            <CmsLocaleFieldLabel
              values={fieldValues((c) => listToLines(c.delivery.cities))}
              multiline
              onSaveTranslations={(translations) =>
                applyTranslations(
                  (c, value) => ({
                    ...c,
                    delivery: { ...c.delivery, cities: linesToList(value) },
                  }),
                  translations,
                )
              }
            >
              Міста (по одному в рядку)
            </CmsLocaleFieldLabel>
            <Textarea
              rows={5}
              placeholder="Міста (по одному в рядку)"
              value={listToLines(copy.delivery.cities)}
              onChange={(e) => patchSection('delivery', { cities: linesToList(e.target.value) })}
              disabled={!copy.delivery.enabled}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Фото URL</Label>
              <Input
                placeholder="Фото URL"
                value={copy.delivery.imageUrl}
                onChange={(e) => patchSection('delivery', { imageUrl: e.target.value })}
                disabled={!copy.delivery.enabled}
              />
            </div>
            <div className="space-y-1">
              <CmsLocaleFieldLabel
                values={fieldValues((c) => c.delivery.imageAlt)}
                onSaveTranslations={(translations) =>
                  applyTranslations(
                    (c, value) => ({ ...c, delivery: { ...c.delivery, imageAlt: value } }),
                    translations,
                  )
                }
              >
                Alt
              </CmsLocaleFieldLabel>
              <Input
                placeholder="Alt"
                value={copy.delivery.imageAlt}
                onChange={(e) => patchSection('delivery', { imageAlt: e.target.value })}
                disabled={!copy.delivery.enabled}
              />
            </div>
          </div>
          <div className="space-y-1">
            <CmsLocaleFieldLabel
              values={fieldValues((c) => c.delivery.ctaLabel)}
              onSaveTranslations={(translations) =>
                applyTranslations(
                  (c, value) => ({ ...c, delivery: { ...c.delivery, ctaLabel: value } }),
                  translations,
                )
              }
            >
              CTA label → /shipping
            </CmsLocaleFieldLabel>
            <Input
              placeholder="CTA label → /shipping"
              value={copy.delivery.ctaLabel}
              onChange={(e) => patchSection('delivery', { ctaLabel: e.target.value })}
              disabled={!copy.delivery.enabled}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader
            title="CTA"
            enabled={copy.cta.enabled}
            onEnabledChange={(enabled) => patchSection('cta', { enabled })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <CmsLocaleFieldLabel
                values={fieldValues((c) => c.cta.primaryLabel)}
                onSaveTranslations={(translations) =>
                  applyTranslations(
                    (c, value) => ({ ...c, cta: { ...c.cta, primaryLabel: value } }),
                    translations,
                  )
                }
              >
                Каталог (label)
              </CmsLocaleFieldLabel>
              <Input
                placeholder="Каталог (label)"
                value={copy.cta.primaryLabel}
                onChange={(e) => patchSection('cta', { primaryLabel: e.target.value })}
                disabled={!copy.cta.enabled}
              />
            </div>
            <div className="space-y-1">
              <CmsLocaleFieldLabel
                values={fieldValues((c) => c.cta.secondaryLabel)}
                onSaveTranslations={(translations) =>
                  applyTranslations(
                    (c, value) => ({ ...c, cta: { ...c.cta, secondaryLabel: value } }),
                    translations,
                  )
                }
              >
                Контакти (label)
              </CmsLocaleFieldLabel>
              <Input
                placeholder="Контакти (label)"
                value={copy.cta.secondaryLabel}
                onChange={(e) => patchSection('cta', { secondaryLabel: e.target.value })}
                disabled={!copy.cta.enabled}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Посилання фіксовані в коді: каталог + /contacts.
          </p>
        </div>

        <Button type="button" onClick={onSave} disabled={!isDirty || saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Збереження…' : 'Зберегти «Про нас»'}
        </Button>
      </CardContent>
    </Card>
  )
}
