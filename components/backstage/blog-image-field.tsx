'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { isBlogImagePath, resolveThumbUrl } from '@/lib/media/paths'
import { toPublicMediaUrl } from '@/lib/media/public-url'
import { validateImageFile } from '@/lib/media/validate'
import { cn } from '@/lib/utils'

async function uploadBlogImage(file: File, blogPostId?: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  if (blogPostId) formData.append('blogPostId', blogPostId)

  const res = await fetch('/api/backstage/blog/upload', {
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

function hasRemovableImage(image: string | null): boolean {
  if (!image?.trim()) return false
  return isBlogImagePath(image) || image.startsWith('/uploads/') || /^https?:\/\//i.test(image)
}

export function BlogImageField({
  image,
  blogPostId,
  onImageChange,
}: {
  image: string | null
  blogPostId?: string
  onImageChange: (image: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState(image ? resolveThumbUrl(image) : '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canRemoveImage = hasRemovableImage(image)

  useEffect(() => {
    setPreviewUrl(image ? toPublicMediaUrl(resolveThumbUrl(image)) : '')
  }, [image])

  const handleRemoveImage = () => {
    onImageChange(null)
    setPreviewUrl('')
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleFile = async (file: File) => {
    setError(null)
    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)
    try {
      const url = await uploadBlogImage(file, blogPostId)
      onImageChange(url)
      setPreviewUrl(toPublicMediaUrl(resolveThumbUrl(url)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <Label>Обкладинка</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative w-fit shrink-0">
          <div
            className={cn(
              'relative h-28 w-44 overflow-hidden rounded-lg border border-border bg-muted',
              !canRemoveImage && 'bg-gradient-to-br from-accent via-secondary/60 to-muted',
            )}
          >
            {previewUrl ? (
              <Image src={previewUrl} alt="Превʼю обкладинки" fill className="object-cover" sizes="176px" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Без фото
              </div>
            )}
          </div>

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
                  {canRemoveImage ? 'Замінити зображення' : 'Завантажити зображення'}
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">JPG, PNG, WebP або GIF до 8 МБ.</p>

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
