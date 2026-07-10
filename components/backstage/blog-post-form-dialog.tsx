'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { RequiredLabel } from '@/components/auth/auth-form-ui'
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
import { Textarea } from '@/components/ui/textarea'
import type { BlogPostFormValues } from '@/lib/backstage/blog'
import { slugifyBlogTitle } from '@/lib/blog/posts'

const emptyForm: BlogPostFormValues = {
  title: '',
  slug: '',
  content: '',
  image: '',
}

export function BlogPostFormDialog({
  open,
  onOpenChange,
  title,
  description,
  initialValues,
  submitLabel,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  initialValues?: Partial<BlogPostFormValues>
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

    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      setError('Заповніть назву, slug і текст статті.')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        title: form.title.trim(),
        slug: form.slug.trim().toLowerCase(),
        content: form.content.trim(),
        image: form.image.trim(),
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
      <DialogContent className="flex max-h-[min(90dvh,42rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
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
              <RequiredLabel htmlFor="blog-content">Текст статті</RequiredLabel>
              <Textarea
                id="blog-content"
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                rows={12}
                className="min-h-[220px] resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-image">URL зображення</Label>
              <InputWithClear
                id="blog-image"
                value={form.image}
                onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                onClear={() => setForm((prev) => ({ ...prev, image: '' }))}
                placeholder="https://..."
              />
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
