'use client'

import { Plus, Save, Trash2 } from 'lucide-react'

import { ContentLocaleBanner, ContentLocaleLabel } from '@/components/backstage/content-locale-banner'
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
import type { AppLocale } from '@/lib/i18n/locales'
import {
  EMPTY_ABOUT_CMS,
  isBlankAboutCms,
  resolveAboutPageCopy,
  type AboutPageCmsCopy,
  type AboutPageSettings,
  type AboutProductLine,
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
  const storedCopy = settings.byLocale[contentLocale]
  const copy: AboutPageCmsCopy = storedCopy ?? { ...EMPTY_ABOUT_CMS }
  const hintCopy =
    !storedCopy || isBlankAboutCms(storedCopy)
      ? resolveAboutPageCopy(settings, contentLocale, marketRegion)
      : null

  const patchCopy = (partial: Partial<AboutPageCmsCopy>) => {
    onChange({
      ...settings,
      byLocale: {
        ...settings.byLocale,
        [contentLocale]: { ...copy, ...partial },
      },
    })
  }

  const updateStat = (index: number, patch: Partial<AboutStatItem>) => {
    const stats = copy.stats.map((item, i) => (i === index ? { ...item, ...patch } : item))
    patchCopy({ stats })
  }

  const addStat = () => {
    patchCopy({ stats: [...copy.stats, { value: '', label: '', description: '' }] })
  }

  const removeStat = (index: number) => {
    patchCopy({ stats: copy.stats.filter((_, i) => i !== index) })
  }

  const updateProductLine = (index: number, patch: Partial<AboutProductLine>) => {
    const productLines = copy.productLines.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    )
    patchCopy({ productLines })
  }

  const addProductLine = () => {
    patchCopy({
      productLines: [
        ...copy.productLines,
        { title: '', description: '', imageUrl: '', imageAlt: '' },
      ],
    })
  }

  const removeProductLine = (index: number) => {
    patchCopy({ productLines: copy.productLines.filter((_, i) => i !== index) })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Сторінка «Про нас»</CardTitle>
        <CardDescription>
          CMS-текст сторінки /about мовою контенту (перемикач у шапці). Дефолти залежать від ринку
          деплою ({marketRegion === 'sk' ? 'SK / EU' : 'UA'}).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ContentLocaleBanner hint="Редагуєте текст «Про нас» для обраної мови. Збережіть перед перемиканням мови." />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <ContentLocaleLabel htmlFor="about-seo-title">SEO title</ContentLocaleLabel>
            <Input
              id="about-seo-title"
              value={copy.seoTitle}
              onChange={(e) => patchCopy({ seoTitle: e.target.value })}
              placeholder={hintCopy?.seoTitle}
            />
          </div>
          <div className="space-y-2">
            <ContentLocaleLabel htmlFor="about-hero">Заголовок H1</ContentLocaleLabel>
            <Input
              id="about-hero"
              value={copy.heroTitle}
              onChange={(e) => patchCopy({ heroTitle: e.target.value })}
              placeholder={hintCopy?.heroTitle}
            />
          </div>
        </div>

        <div className="space-y-2">
          <ContentLocaleLabel htmlFor="about-seo-desc">SEO description</ContentLocaleLabel>
          <Textarea
            id="about-seo-desc"
            rows={2}
            value={copy.seoDescription}
            onChange={(e) => patchCopy({ seoDescription: e.target.value })}
            placeholder={hintCopy?.seoDescription}
          />
        </div>

        <div className="space-y-2">
          <ContentLocaleLabel htmlFor="about-intro">Вступ (HTML)</ContentLocaleLabel>
          <Textarea
            id="about-intro"
            rows={10}
            value={copy.introHtml}
            onChange={(e) => patchCopy({ introHtml: e.target.value })}
            placeholder={hintCopy?.introHtml}
            className="font-mono text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <ContentLocaleLabel htmlFor="about-founders-url">Фото засновників (URL)</ContentLocaleLabel>
            <Input
              id="about-founders-url"
              value={copy.foundersImageUrl}
              onChange={(e) => patchCopy({ foundersImageUrl: e.target.value })}
              placeholder={hintCopy?.foundersImageUrl}
            />
          </div>
          <div className="space-y-2">
            <ContentLocaleLabel htmlFor="about-founders-alt">Alt фото</ContentLocaleLabel>
            <Input
              id="about-founders-alt"
              value={copy.foundersImageAlt}
              onChange={(e) => patchCopy({ foundersImageAlt: e.target.value })}
              placeholder={hintCopy?.foundersImageAlt}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Стиль фото засновників</Label>
          <Select
            value={copy.foundersImageStyle}
            onValueChange={(value) =>
              patchCopy({ foundersImageStyle: value === 'rounded' ? 'rounded' : 'circle' })
            }
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="circle">Коло (менше, без обрізання овалом)</SelectItem>
              <SelectItem value="rounded">Широке з заокругленням</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <ContentLocaleLabel htmlFor="about-stats-title">Заголовок цифр</ContentLocaleLabel>
            <Input
              id="about-stats-title"
              value={copy.statsTitle}
              onChange={(e) => patchCopy({ statsTitle: e.target.value })}
              placeholder={hintCopy?.statsTitle}
            />
          </div>
          <div className="space-y-2">
            <ContentLocaleLabel htmlFor="about-stats-sub">Підзаголовок цифр</ContentLocaleLabel>
            <Input
              id="about-stats-sub"
              value={copy.statsSubtitle}
              onChange={(e) => patchCopy({ statsSubtitle: e.target.value })}
              placeholder={hintCopy?.statsSubtitle}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label>Цифри (stats)</Label>
            <Button type="button" variant="outline" size="sm" onClick={addStat}>
              <Plus className="mr-1 h-4 w-4" />
              Додати
            </Button>
          </div>
          {copy.stats.map((stat, index) => (
            <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                placeholder="Значення"
                value={stat.value}
                onChange={(e) => updateStat(index, { value: e.target.value })}
              />
              <Input
                placeholder="Підпис"
                value={stat.label}
                onChange={(e) => updateStat(index, { label: e.target.value })}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeStat(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Textarea
                className="sm:col-span-3"
                rows={2}
                placeholder="Опис"
                value={stat.description}
                onChange={(e) => updateStat(index, { description: e.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <ContentLocaleLabel htmlFor="about-theses">Тези (по одному в рядку)</ContentLocaleLabel>
          <Textarea
            id="about-theses"
            rows={4}
            value={listToLines(copy.theses)}
            onChange={(e) => patchCopy({ theses: linesToList(e.target.value) })}
            placeholder={hintCopy ? listToLines(hintCopy.theses) : undefined}
          />
        </div>

        <div className="space-y-2">
          <ContentLocaleLabel htmlFor="about-why-title">Заголовок «Чому ми»</ContentLocaleLabel>
          <Input
            id="about-why-title"
            value={copy.whyUsTitle}
            onChange={(e) => patchCopy({ whyUsTitle: e.target.value })}
            placeholder={hintCopy?.whyUsTitle}
          />
        </div>
        <div className="space-y-2">
          <ContentLocaleLabel htmlFor="about-why-html">Чому ми (HTML)</ContentLocaleLabel>
          <Textarea
            id="about-why-html"
            rows={8}
            value={copy.whyUsHtml}
            onChange={(e) => patchCopy({ whyUsHtml: e.target.value })}
            placeholder={hintCopy?.whyUsHtml}
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          <ContentLocaleLabel htmlFor="about-why-points">
            Пункти «Чому ми» (по одному в рядку)
          </ContentLocaleLabel>
          <Textarea
            id="about-why-points"
            rows={6}
            value={listToLines(copy.whyUsPoints)}
            onChange={(e) => patchCopy({ whyUsPoints: linesToList(e.target.value) })}
            placeholder={hintCopy ? listToLines(hintCopy.whyUsPoints) : undefined}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <ContentLocaleLabel htmlFor="about-cta-catalog">CTA каталог</ContentLocaleLabel>
            <Input
              id="about-cta-catalog"
              value={copy.catalogCtaLabel}
              onChange={(e) => patchCopy({ catalogCtaLabel: e.target.value })}
              placeholder={hintCopy?.catalogCtaLabel}
            />
          </div>
          <div className="space-y-2">
            <ContentLocaleLabel htmlFor="about-cta-contacts">CTA контакти</ContentLocaleLabel>
            <Input
              id="about-cta-contacts"
              value={copy.contactsCtaLabel}
              onChange={(e) => patchCopy({ contactsCtaLabel: e.target.value })}
              placeholder={hintCopy?.contactsCtaLabel}
            />
          </div>
        </div>

        <div className="space-y-2">
          <ContentLocaleLabel htmlFor="about-products-title">Заголовок продукції</ContentLocaleLabel>
          <Input
            id="about-products-title"
            value={copy.productLinesTitle}
            onChange={(e) => patchCopy({ productLinesTitle: e.target.value })}
            placeholder={hintCopy?.productLinesTitle}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label>Лінійки продукції</Label>
            <Button type="button" variant="outline" size="sm" onClick={addProductLine}>
              <Plus className="mr-1 h-4 w-4" />
              Додати
            </Button>
          </div>
          {copy.productLines.map((line, index) => (
            <div key={index} className="space-y-2 rounded-lg border p-3">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProductLine(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="Назва"
                value={line.title}
                onChange={(e) => updateProductLine(index, { title: e.target.value })}
              />
              <Textarea
                rows={3}
                placeholder="Опис"
                value={line.description}
                onChange={(e) => updateProductLine(index, { description: e.target.value })}
              />
              <Input
                placeholder="URL зображення"
                value={line.imageUrl}
                onChange={(e) => updateProductLine(index, { imageUrl: e.target.value })}
              />
              <Input
                placeholder="Alt"
                value={line.imageAlt}
                onChange={(e) => updateProductLine(index, { imageAlt: e.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <ContentLocaleLabel htmlFor="about-video-title">Заголовок відео</ContentLocaleLabel>
            <Input
              id="about-video-title"
              value={copy.videoTitle}
              onChange={(e) => patchCopy({ videoTitle: e.target.value })}
              placeholder={hintCopy?.videoTitle}
            />
          </div>
          <div className="space-y-2">
            <ContentLocaleLabel htmlFor="about-video-sub">Підзаголовок відео</ContentLocaleLabel>
            <Input
              id="about-video-sub"
              value={copy.videoSubtitle}
              onChange={(e) => patchCopy({ videoSubtitle: e.target.value })}
              placeholder={hintCopy?.videoSubtitle}
            />
          </div>
        </div>
        <div className="space-y-2">
          <ContentLocaleLabel htmlFor="about-video-url">YouTube embed URL</ContentLocaleLabel>
          <Input
            id="about-video-url"
            value={copy.videoEmbedUrl}
            onChange={(e) => patchCopy({ videoEmbedUrl: e.target.value })}
            placeholder={hintCopy?.videoEmbedUrl}
          />
        </div>

        <div className="space-y-2">
          <ContentLocaleLabel htmlFor="about-delivery-title">Заголовок доставки</ContentLocaleLabel>
          <Input
            id="about-delivery-title"
            value={copy.deliveryTitle}
            onChange={(e) => patchCopy({ deliveryTitle: e.target.value })}
            placeholder={hintCopy?.deliveryTitle}
          />
        </div>
        <div className="space-y-2">
          <ContentLocaleLabel htmlFor="about-delivery-html">Доставка (HTML)</ContentLocaleLabel>
          <Textarea
            id="about-delivery-html"
            rows={6}
            value={copy.deliveryHtml}
            onChange={(e) => patchCopy({ deliveryHtml: e.target.value })}
            placeholder={hintCopy?.deliveryHtml}
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          <ContentLocaleLabel htmlFor="about-delivery-cities">
            Міста доставки (по одному в рядку)
          </ContentLocaleLabel>
          <Textarea
            id="about-delivery-cities"
            rows={5}
            value={listToLines(copy.deliveryCities)}
            onChange={(e) => patchCopy({ deliveryCities: linesToList(e.target.value) })}
            placeholder={hintCopy ? listToLines(hintCopy.deliveryCities) : undefined}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <ContentLocaleLabel htmlFor="about-delivery-img">Фото доставки (URL)</ContentLocaleLabel>
            <Input
              id="about-delivery-img"
              value={copy.deliveryImageUrl}
              onChange={(e) => patchCopy({ deliveryImageUrl: e.target.value })}
              placeholder={hintCopy?.deliveryImageUrl}
            />
          </div>
          <div className="space-y-2">
            <ContentLocaleLabel htmlFor="about-delivery-alt">Alt доставки</ContentLocaleLabel>
            <Input
              id="about-delivery-alt"
              value={copy.deliveryImageAlt}
              onChange={(e) => patchCopy({ deliveryImageAlt: e.target.value })}
              placeholder={hintCopy?.deliveryImageAlt}
            />
          </div>
        </div>
        <div className="space-y-2">
          <ContentLocaleLabel htmlFor="about-delivery-cta">CTA доставки</ContentLocaleLabel>
          <Input
            id="about-delivery-cta"
            value={copy.deliveryCtaLabel}
            onChange={(e) => patchCopy({ deliveryCtaLabel: e.target.value })}
            placeholder={hintCopy?.deliveryCtaLabel}
          />
        </div>

        <Button type="button" onClick={onSave} disabled={!isDirty || saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Збереження…' : 'Зберегти «Про нас»'}
        </Button>
      </CardContent>
    </Card>
  )
}
