'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, RefreshCw } from 'lucide-react'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  createBackstageLegalDraft,
  fetchBackstageLegalDocuments,
  publishBackstageLegalRevision,
  updateBackstageLegalDraft,
  type LegalBackstageDocument,
  type LegalBackstageRevision,
} from '@/lib/backstage/legal'
import { formatDateTimeOrDash } from '@/lib/i18n/format-datetime'
import { cn } from '@/lib/utils'

const TYPES: LegalBackstageDocument['type'][] = [
  'TERMS',
  'PRIVACY',
  'COOKIES',
  'RETURNS',
  'MARKETING_CONSENT',
]

function sectionsToText(sections: LegalBackstageRevision['sections']) {
  return sections
    .map((section) => `${section.heading}\n${section.body.join('\n\n')}`)
    .join('\n\n---\n\n')
}

function textToSections(raw: string): LegalBackstageRevision['sections'] {
  return raw
    .split(/\n---\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const [heading, ...rest] = block.split('\n')
      const body = rest.join('\n').split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)
      return { heading: heading.trim(), body: body.length ? body : [''] }
    })
    .filter((section) => section.heading)
}

export default function LegalDocumentsPage() {
  const { locale: uiLocale } = useBackstageUiLocale()
  const t = useTranslations('legal')
  const tCommon = useTranslations('common')
  const { locale: contentLocale, ready } = useBackstageContentLocale()
  const [documents, setDocuments] = useState<LegalBackstageDocument[]>([])
  const [type, setType] = useState<LegalBackstageDocument['type']>('TERMS')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [intro, setIntro] = useState('')
  const [body, setBody] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const items = await fetchBackstageLegalDocuments(contentLocale)
      setDocuments(items)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [contentLocale, t])

  useEffect(() => {
    if (ready) void load()
  }, [load, ready])

  const current = documents.find((item) => item.type === type)
  const revisions = current?.revisions ?? []
  const selected = revisions.find((item) => item.id === selectedId) ?? revisions[0] ?? null

  useEffect(() => {
    if (!selected) return
    setSelectedId(selected.id)
    setTitle(selected.title)
    setIntro(selected.intro)
    setBody(sectionsToText(selected.sections))
  }, [selected?.id])

  const published = useMemo(
    () => revisions.find((item) => item.status === 'PUBLISHED') ?? null,
    [revisions],
  )

  const draftOnly = selected?.status === 'DRAFT'

  async function handleNewDraft() {
    setSaving(true)
    try {
      const created = await createBackstageLegalDraft({
        type,
        locale: contentLocale,
        fromRevisionId: published?.id ?? selected?.id,
      })
      toast.success(t('draftCreated'))
      await load()
      setSelectedId(created.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    if (!selected || !draftOnly) return
    setSaving(true)
    try {
      await updateBackstageLegalDraft(selected.id, {
        title,
        intro,
        sections: textToSections(body),
      })
      toast.success(t('saved'))
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!selected || !draftOnly) return
    setSaving(true)
    try {
      await updateBackstageLegalDraft(selected.id, {
        title,
        intro,
        sections: textToSections(body),
      })
      await publishBackstageLegalRevision(selected.id)
      toast.success(t('published'))
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-semibold">{t('title')}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button type="button" onClick={() => void handleNewDraft()} disabled={saving}>
              <Plus className="mr-2 h-4 w-4" />
              {t('newDraft')}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {TYPES.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={item === type ? 'default' : 'outline'}
              onClick={() => {
                setType(item)
                setSelectedId(null)
              }}
            >
              {t(`types.${item}`)}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('revisions')}</CardTitle>
              <CardDescription>
                {t('localeHint', { locale: contentLocale.toUpperCase() })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {revisions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('empty')}</p>
              ) : (
                revisions.map((revision) => (
                  <button
                    key={revision.id}
                    type="button"
                    onClick={() => setSelectedId(revision.id)}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-left text-sm',
                      revision.id === selected?.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50',
                    )}
                  >
                    <span className="font-medium">v{revision.version}</span>
                    <span className="ml-2 text-muted-foreground">{revision.status}</span>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTimeOrDash(revision.publishedAt ?? revision.createdAt, uiLocale, 'datetime')}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{selected?.title || t('editor')}</CardTitle>
              <CardDescription>
                {draftOnly ? t('draftHint') : t('publishedHint')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selected ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="legal-title">{t('fieldTitle')}</Label>
                    <Input
                      id="legal-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      disabled={!draftOnly || saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legal-intro">{t('fieldIntro')}</Label>
                    <Textarea
                      id="legal-intro"
                      value={intro}
                      onChange={(event) => setIntro(event.target.value)}
                      disabled={!draftOnly || saving}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legal-body">{t('fieldBody')}</Label>
                    <Textarea
                      id="legal-body"
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      disabled={!draftOnly || saving}
                      rows={18}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">{t('bodyHint')}</p>
                    <p className="text-xs text-muted-foreground">{t('placeholderHint')}</p>
                  </div>
                  {draftOnly ? (
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => void handleSave()} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {tCommon('save')}
                      </Button>
                      <Button type="button" onClick={() => void handlePublish()} disabled={saving}>
                        {t('publish')}
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t('empty')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
