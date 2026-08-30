'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { resolveHeroPreviewUrl } from '@/lib/home/hero-image'
import { isHomeHeroImagePath } from '@/lib/media/paths'
import { validateImageFile } from '@/lib/media/validate'
import { cn } from '@/lib/utils'

async function uploadHomeHeroImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/backstage/settings/home-hero/upload', {
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

async function deleteHomeHeroImageFromStorage(): Promise<void> {
  const res = await fetch('/api/backstage/settings/home-hero/delete', {
    method: 'POST',
    credentials: 'include',
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) {
    throw new Error(data.error || 'Не вдалося видалити зображення зі сховища.')
  }
}

function hasRemovableHeroImage(imageUrl: string | null | undefined): boolean {
  return Boolean(imageUrl?.trim())
}

export function HeroImageField({
  imageUrl,
  onImageUrlChange,
}: {
  imageUrl: string
  onImageUrlChange: (imageUrl: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState(() => resolveHeroPreviewUrl(imageUrl))
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canRemoveImage = hasRemovableHeroImage(imageUrl)

  useEffect(() => {
    setPreviewUrl(resolveHeroPreviewUrl(imageUrl))
  }, [imageUrl])

  const handleRemoveImage = async () => {
    setError(null)
    setUploading(true)
    try {
      if (isHomeHeroImagePath(imageUrl)) {
        await deleteHomeHeroImageFromStorage()
      }
      onImageUrlChange('')
      setPreviewUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
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
      const url = await uploadHomeHeroImage(file)
      onImageUrlChange(url)
      setPreviewUrl(resolveHeroPreviewUrl(url))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <Label>Зображення хіро</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className={cn(
            'relative h-36 w-full max-w-xs shrink-0 overflow-hidden rounded-lg border border-border bg-muted',
            !previewUrl && 'bg-gradient-to-br from-accent via-secondary/60 to-muted',
          )}
        >
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Превʼю хіро"
              fill
              className="object-cover"
              unoptimized
            />
          ) : null}

          {canRemoveImage ? (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 h-8 w-8 rounded-full shadow-md"
              disabled={uploading}
              aria-label="Видалити зображення"
              onClick={() => void handleRemoveImage()}
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

            {canRemoveImage ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={uploading}
                onClick={() => void handleRemoveImage()}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Видалити
              </Button>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            {canRemoveImage
              ? 'Зображення зберігається в R2. Після заміни або видалення натисніть «Зберегти головну».'
              : 'Завантажте фото для правої частини хіро-блоку на головній сторінці.'}
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
