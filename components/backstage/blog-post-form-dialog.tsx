'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { RequiredLabel } from '@/components/auth/auth-form-ui'
import { BlogImageField } from '@/components/backstage/blog-image-field'
import { RichTextEditor } from '@/components/backstage/rich-text-editor'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { BlogPostFormValues } from '@/lib/backstage/blog'
import { isEmptyHtmlContent, slugifyBlogTitle } from '@/lib/blog/posts'

const emptyForm: BlogPostFormValues = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  image: '',
  author: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  isPublished: true,
}

export function BlogPostFormDialog({
  open,
  onOpenChange,
  title,
  description,
  initialValues,
  blogPostId,
  submitLabel,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  initialValues?: Partial<BlogPostFormValues>
  blogPostId?: string
  submitLabel: string
  onSubmit: (values: BlogPostFormValues) => Promise<void>
}) {
  const [form, setForm] = useState<BlogPostFormValues>(emptyForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setForm({ ...emptyForm, ...initialValues })
    setSlugTouched(Boolean(initialValues?.slug))
    setError(null)
  }, [open, initialValues])

  const patchForm = (patch: Partial<BlogPostFormValues>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch }
      if (!slugTouched && patch.title !== undefined) {
        next.slug = slugifyBlogTitle(patch.title)
      }
      return next
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!form.title.trim() || !form.slug.trim() || isEmptyHtmlContent(form.content)) {
      setError('Заповніть назву, slug і текст статті.')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        ...form,
        title: form.title.trim(),
        slug: form.slug.trim().toLowerCase(),
        content: form.content.trim(),
        excerpt: form.excerpt.trim(),
        image: form.image.trim(),
        author: form.author.trim(),
        metaTitle: form.metaTitle.trim(),
        metaDescription: form.metaDescription.trim(),
        metaKeywords: form.metaKeywords.trim(),
        isPublished: form.isPublished,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти статтю.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92dvh,52rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-foreground">Опубліковано на сайті</p>
                <p className="text-xs text-muted-foreground">
                  Вимкніть, щоб приховати статтю з публічного блогу.
                </p>
              </div>
              <Switch
                checked={form.isPublished}
                onCheckedChange={(checked) => patchForm({ isPublished: checked })}
                aria-label="Опубліковано"
              />
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor="blog-title">Заголовок</RequiredLabel>
              <InputWithClear
                id="blog-title"
                value={form.title}
                onChange={(e) => patchForm({ title: e.target.value })}
                onClear={() => patchForm({ title: '' })}
              />
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor="blog-slug">Slug (URL)</RequiredLabel>
              <Input
                id="blog-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setForm((prev) => ({ ...prev, slug: e.target.value }))
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-author">Автор</Label>
              <InputWithClear
                id="blog-author"
                value={form.author}
                onChange={(e) => patchForm({ author: e.target.value })}
                onClear={() => patchForm({ author: '' })}
                placeholder="Author name"
              />
            </div>

            <BlogImageField
              image={form.image || null}
              blogPostId={blogPostId}
              onImageChange={(image) => patchForm({ image: image ?? '' })}
            />

            <div className="space-y-2">
              <Label htmlFor="blog-excerpt">Короткий опис (excerpt)</Label>
              <Textarea
                id="blog-excerpt"
                value={form.excerpt}
                onChange={(e) => patchForm({ excerpt: e.target.value })}
                rows={3}
                placeholder="Якщо порожньо — згенерується з тексту статті."
              />
            </div>

            <RichTextEditor
              id="blog-content"
              label="Текст статті"
              value={form.content}
              onChange={(content) => patchForm({ content })}
              placeholder="Напишіть або вставте HTML…"
            />

            <div className="space-y-3 rounded-lg border border-border/70 p-3">
              <p className="text-sm font-medium text-foreground">SEO</p>
              <div className="space-y-2">
                <Label htmlFor="blog-meta-title">Meta title</Label>
                <InputWithClear
                  id="blog-meta-title"
                  value={form.metaTitle}
                  onChange={(e) => patchForm({ metaTitle: e.target.value })}
                  onClear={() => patchForm({ metaTitle: '' })}
                  placeholder="Якщо порожньо — використається заголовок"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-meta-description">Meta description</Label>
                <Textarea
                  id="blog-meta-description"
                  value={form.metaDescription}
                  onChange={(e) => patchForm({ metaDescription: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-meta-keywords">Meta keywords</Label>
                <InputWithClear
                  id="blog-meta-keywords"
                  value={form.metaKeywords}
                  onChange={(e) => patchForm({ metaKeywords: e.target.value })}
                  onClear={() => patchForm({ metaKeywords: '' })}
                  placeholder="слово1, слово2"
                />
              </div>
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Скасувати
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Збереження…
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
