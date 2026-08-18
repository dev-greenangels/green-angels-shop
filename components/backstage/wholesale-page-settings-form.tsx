'use client'

import { Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { WholesalePageSettings } from '@/lib/settings/wholesale'

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
  onChange,
  onSave,
  saving,
  isDirty,
  marketRegion,
}: {
  settings: WholesalePageSettings
  onChange: (next: WholesalePageSettings) => void
  onSave: () => void
  saving: boolean
  isDirty: boolean
  marketRegion: 'ua' | 'sk'
}) {
  const patch = (partial: Partial<WholesalePageSettings>) => {
    onChange({ ...settings, ...partial })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Сторінка «Гурт»</CardTitle>
        <CardDescription>
          Текст лендінгу для цього деплою ({marketRegion === 'sk' ? 'SK / EU' : 'UA'}). Не
          залежить від перемикача мови контенту.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wholesale-title">Заголовок H1</Label>
          <Input
            id="wholesale-title"
            value={settings.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wholesale-intro">Лід</Label>
          <Textarea
            id="wholesale-intro"
            rows={3}
            value={settings.intro}
            onChange={(e) => patch({ intro: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wholesale-body">Текст (абзаци через порожній рядок)</Label>
          <Textarea
            id="wholesale-body"
            rows={12}
            value={paragraphsToText(settings.paragraphs)}
            onChange={(e) => patch({ paragraphs: textToParagraphs(e.target.value) })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wholesale-seo-title">SEO title</Label>
            <Input
              id="wholesale-seo-title"
              value={settings.seoTitle}
              onChange={(e) => patch({ seoTitle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wholesale-form-title">Заголовок форми</Label>
            <Input
              id="wholesale-form-title"
              value={settings.formTitle}
              onChange={(e) => patch({ formTitle: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="wholesale-seo-desc">SEO description</Label>
          <Textarea
            id="wholesale-seo-desc"
            rows={2}
            value={settings.seoDescription}
            onChange={(e) => patch({ seoDescription: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wholesale-form-intro">Підзаголовок форми</Label>
          <Textarea
            id="wholesale-form-intro"
            rows={2}
            value={settings.formIntro}
            onChange={(e) => patch({ formIntro: e.target.value })}
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
