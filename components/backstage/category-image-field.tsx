'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'

import { CategoryThumbnail } from '@/components/backstage/category-thumbnail'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  CATEGORY_DEFAULT_IMAGE,
  isCategoryPlaceholderImage,
  resolveCategoryImageUrl,
  resolveCategoryThumbUrl,
  validateCategoryImageFile,
} from '@/lib/category-image'
import { isCategoryImagePath } from '@/lib/media/paths'
import { cn } from '@/lib/utils'

async function uploadCategoryImage(file: File, categoryId?: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  if (categoryId) formData.append('categoryId', categoryId)

  const res = await fetch('/api/backstage/categories/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Не вдалося завантажити зображення.')
  }
  return data.url
}

function hasRemovableCategoryImage(image: string | null): boolean {
  if (!image?.trim()) return false
  if (isCategoryPlaceholderImage(image)) return false
  return isCategoryImagePath(image) || image.startsWith('/uploads/')
}

export function CategoryImageField({
  image,
  categoryId,
  onImageChange,
}: {
  image: string | null
  categoryId?: string
  onImageChange: (image: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState(
    image ? resolveCategoryThumbUrl(image) : resolveCategoryImageUrl(image),
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canRemoveImage = hasRemovableCategoryImage(image)

  useEffect(() => {
    setPreviewUrl(image ? resolveCategoryThumbUrl(image) : resolveCategoryImageUrl(image))
  }, [image])

  const handleRemoveImage = () => {
    onImageChange(null)
    setPreviewUrl(CATEGORY_DEFAULT_IMAGE)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleFile = async (file: File) => {
    setError(null)
    const validationError = validateCategoryImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)
    try {
      const url = await uploadCategoryImage(file, categoryId)
      onImageChange(url)
      setPreviewUrl(resolveCategoryThumbUrl(url))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <Label>Зображення</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative w-fit shrink-0">
          <CategoryThumbnail
            src={previewUrl}
            alt="Превʼю категорії"
            className={cn(
              'h-28 w-40 rounded-lg border border-border',
              !canRemoveImage && 'bg-gradient-to-br from-accent via-secondary/60 to-muted',
            )}
          />

          {canRemoveImage ? (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 h-8 w-8 rounded-full shadow-md"
              disabled={uploading}
              aria-label="Видалити зображення"
              onClick={handleRemoveImage}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Завантаження…
                </>
              ) : (
                <>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {canRemoveImage ? 'Замінити зображення' : 'Додати зображення'}
                </>
              )}
            </Button>

            {canRemoveImage ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={uploading}
                onClick={handleRemoveImage}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Видалити зображення
              </Button>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            {canRemoveImage
              ? 'Після видалення на вітрині буде стандартна заглушка. Не забудьте зберегти категорію.'
              : 'Якщо не додати фото, буде стандартна заглушка в стилі сайту.'}
          </p>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
