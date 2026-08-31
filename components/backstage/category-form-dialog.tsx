'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Checkbox } from '@/components/ui/checkbox'
import { CategoryImageField } from '@/components/backstage/category-image-field'
import { ContentLocaleBanner, ContentLocaleLabel, TranslationHint } from '@/components/backstage/content-locale-banner'
import {
  type CategoryFormValues,
  slugifyCategoryName,
} from '@/lib/backstage/categories'

export type ParentOption = {
  id: string
  name: string
  depth: number
}

const emptyForm: CategoryFormValues = {
  name: '',
  slug: '',
  parentId: null,
  image: null,
  description: '',
  footerDescription: '',
  metaTitle: '',
  metaDesc: '',
  isCatalogRoot: false,
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  title,
  description,
  initialValues,
  parentOptions,
  lockParent,
  categoryId,
  submitLabel,
  hints,
  onSubmit,
  onTranslationsSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  initialValues?: Partial<CategoryFormValues>
  parentOptions: ParentOption[]
  lockParent?: boolean
  categoryId?: string
  submitLabel: string
  hints?: {
    name?: { locale: string; text: string } | null
    description?: { locale: string; text: string } | null
    footerDescription?: { locale: string; text: string } | null
    metaTitle?: { locale: string; text: string } | null
    metaDesc?: { locale: string; text: string } | null
  }
  onSubmit: (values: CategoryFormValues) => Promise<void>
  onTranslationsSaved?: () => void | Promise<void>
}) {
  const [form, setForm] = useState<CategoryFormValues>(emptyForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tActions = useTranslations('actions')
  const tHints = useTranslations('hints')
  const tLabels = useTranslations('labels')
  const tValidation = useTranslations('validation')
  const tPages = useTranslations('pages.categories')
  const tt = useTranslations('toast')
  const tBanner = useTranslations('contentBanner')

  useEffect(() => {
    if (!open) return
    setForm({
      ...emptyForm,
      ...initialValues,
      parentId: initialValues?.parentId ?? null,
    })
    setSlugTouched(Boolean(initialValues?.slug))
    setError(null)
  }, [open, initialValues])

  const patch = (patchValues: Partial<CategoryFormValues>) => {
    setForm((prev) => {
      const next = { ...prev, ...patchValues }
      if (patchValues.name !== undefined && !slugTouched) {
        next.slug = slugifyCategoryName(patchValues.name)
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() && !categoryId) {
      setError(tValidation('categoryNameRequired'))
      return
    }
    if (!form.slug.trim()) {
      setError(tValidation('slugRequired'))
      return
    }

    setLoading(true)
    try {
      await onSubmit(form)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : tt('saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,56rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <ContentLocaleBanner />
          <div className="space-y-2">
            <ContentLocaleLabel
              htmlFor="category-name"
              translationTarget={
                categoryId ? { kind: 'category-name', categoryId } : undefined
              }
              translationFieldLabel={tLabels('nameRequired')}
              onTranslationsSaved={() => void onTranslationsSaved?.()}
            >
              {tLabels('nameRequired')}
            </ContentLocaleLabel>
            <Input
              id="category-name"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder={tBanner('missingPlaceholder')}
            />
            <TranslationHint hint={hints?.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-slug">{tLabels('slug')}</Label>
            <Input
              id="category-slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                patch({ slug: e.target.value.toLowerCase() })
              }}
              placeholder="conifers"
            />
            <p className="text-xs text-muted-foreground">{tHints('slugFormat')}</p>
          </div>

          <div className="space-y-2">
            <Label>{tLabels('parentCategory')}</Label>
            <Select
              value={form.parentId ?? 'root'}
              onValueChange={(value) => patch({ parentId: value === 'root' ? null : value })}
              disabled={lockParent}
            >
              <SelectTrigger>
                <SelectValue placeholder={tHints('rootCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">{tHints('rootCategory')}</SelectItem>
                {parentOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {'— '.repeat(option.depth)}
                    {option.name.trim() || tBanner('missingPlaceholder')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
            <Checkbox
              id="category-catalog-root"
              checked={form.isCatalogRoot}
              onCheckedChange={(checked) => patch({ isCatalogRoot: checked === true })}
            />
            <div className="space-y-1">
              <Label htmlFor="category-catalog-root" className="cursor-pointer font-medium">
                {tLabels('catalogRoot')}
              </Label>
              <p className="text-xs text-muted-foreground">{tPages('catalogRootHint')}</p>
            </div>
          </div>

          <CategoryImageField
            image={form.image}
            categoryId={categoryId}
            onImageChange={(image) => patch({ image })}
          />

          <div className="space-y-2">
            <ContentLocaleLabel
              htmlFor="category-description"
              translationTarget={
                categoryId ? { kind: 'category-description', categoryId } : undefined
              }
              translationFieldLabel={tLabels('shortDescription')}
              multiline
              onTranslationsSaved={() => void onTranslationsSaved?.()}
            >
              {tLabels('shortDescription')}
            </ContentLocaleLabel>
            <Textarea
              id="category-description"
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={3}
              placeholder={tBanner('missingPlaceholder')}
            />
            <TranslationHint hint={hints?.description} />
            <p className="text-xs text-muted-foreground">{tPages('shortDescHint')}</p>
          </div>

          <div className="space-y-2">
            <ContentLocaleLabel
              htmlFor="category-meta-title"
              translationTarget={
                categoryId ? { kind: 'category-meta-title', categoryId } : undefined
              }
              translationFieldLabel="SEO title"
              onTranslationsSaved={() => void onTranslationsSaved?.()}
            >
              SEO title
            </ContentLocaleLabel>
            <Input
              id="category-meta-title"
              value={form.metaTitle}
              onChange={(e) => patch({ metaTitle: e.target.value })}
              placeholder={tHints('seoTitle')}
            />
            <TranslationHint hint={hints?.metaTitle} />
          </div>

          <div className="space-y-2">
            <ContentLocaleLabel
              htmlFor="category-meta-desc"
              translationTarget={
                categoryId ? { kind: 'category-meta-desc', categoryId } : undefined
              }
              translationFieldLabel="SEO description"
              multiline
              onTranslationsSaved={() => void onTranslationsSaved?.()}
            >
              SEO description
            </ContentLocaleLabel>
            <Textarea
              id="category-meta-desc"
              value={form.metaDesc}
              onChange={(e) => patch({ metaDesc: e.target.value })}
              rows={3}
              placeholder={tHints('seoDesc')}
            />
            <TranslationHint hint={hints?.metaDesc} />
          </div>

          <div className="space-y-2">
            <ContentLocaleLabel
              htmlFor="category-footer-description"
              translationTarget={
                categoryId
                  ? { kind: 'category-footer-description', categoryId }
                  : undefined
              }
              translationFieldLabel={tLabels('footerDescription')}
              multiline
              onTranslationsSaved={() => void onTranslationsSaved?.()}
            >
              {tLabels('footerDescription')}
            </ContentLocaleLabel>
            <Textarea
              id="category-footer-description"
              value={form.footerDescription}
              onChange={(e) => patch({ footerDescription: e.target.value })}
              rows={6}
              placeholder={tBanner('missingPlaceholder')}
            />
            <TranslationHint hint={hints?.footerDescription} />
            <p className="text-xs text-muted-foreground">{tPages('footerDescHint')}</p>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tActions('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? tActions('saving') : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
