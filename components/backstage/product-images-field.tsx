'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Star, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from '@/lib/toast'

import type { ProductImageDraft } from '@/lib/backstage/product-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toPublicMediaUrl } from '@/lib/media/public-url'
import { validateImageFile } from '@/lib/media/validate'
import { cn } from '@/lib/utils'

async function uploadProductImage(file: File, productId?: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  if (productId) formData.append('productId', productId)

  const res = await fetch('/api/backstage/products/upload', {
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

export function ProductImagesField({
  images,
  productId,
  onChange,
  onPersist,
}: {
  images: ProductImageDraft[]
  productId?: string
  onChange: (images: ProductImageDraft[]) => void
  onPersist?: (images: ProductImageDraft[]) => Promise<ProductImageDraft[]>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const persistImages = async (next: ProductImageDraft[]) => {
    onChange(next)

    if (!onPersist) return

    setSaving(true)
    setError(null)
    try {
      const saved = await onPersist(next)
      onChange(saved)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не вдалося зберегти фото.'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  const setMain = (clientId: string) => {
    const next = images.map((image) => ({
      ...image,
      isMain: image.clientId === clientId,
    }))
    void persistImages(next)
  }

  const removeImage = (clientId: string) => {
    const next = images.filter((image) => image.clientId !== clientId)
    if (next.length && !next.some((image) => image.isMain)) {
      next[0] = { ...next[0], isMain: true }
    }
    void persistImages(next)
  }

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return
    setError(null)

    const files = Array.from(fileList)
    for (const file of files) {
      const validationError = validateImageFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setUploading(true)
    try {
      const uploaded: ProductImageDraft[] = []
      for (const file of files) {
        const url = await uploadProductImage(file, productId)
        uploaded.push({
          clientId: crypto.randomUUID(),
          url,
          isMain: false,
        })
      }

      const merged = [...images, ...uploaded]
      if (!merged.some((image) => image.isMain) && merged.length) {
        merged[0] = { ...merged[0], isMain: true }
      }

      if (onPersist) {
        const saved = await onPersist(merged)
        onChange(saved)
        toast.success('Фото збережено')
      } else {
        onChange(merged)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не вдалося завантажити.'
      setError(message)
      toast.error(message)
    } finally {
      setUploading(false)
      setSaving(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const busy = uploading || saving

  return (
    <div className="space-y-4">
      <div className="flex min-h-[10rem] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center">
        <ImagePlus className="h-10 w-10 shrink-0 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          JPG, PNG, WebP або GIF до 8 МБ. Файли автоматично стискаються до WebP.
          {onPersist ? ' Після завантаження фото одразу зберігаються в товарі.' : null}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploading ? 'Завантаження…' : 'Збереження…'}
            </>
          ) : (
            'Оберіть файли'
          )}
        </Button>
      </div>

      {images.length > 0 ? (
        <div className="space-y-2">
          <Label>Завантажені фото ({images.length})</Label>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <li
                key={image.clientId}
                className={cn(
                  'relative overflow-hidden rounded-lg border bg-muted/30',
                  image.isMain && 'ring-2 ring-primary',
                )}
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={toPublicMediaUrl(image.url.replace('/main.webp', '/thumb.webp'))}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex items-center gap-1 border-t bg-background p-2">
                  <Button
                    type="button"
                    variant={image.isMain ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 flex-1 text-xs"
                    disabled={busy}
                    onClick={() => setMain(image.clientId)}
                  >
                    <Star className={cn('mr-1 h-3.5 w-3.5', image.isMain && 'fill-current')} />
                    {image.isMain ? 'Головне' : 'Зробити головним'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive"
                    disabled={busy}
                    onClick={() => removeImage(image.clientId)}
                    aria-label="Видалити"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
