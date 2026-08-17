'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Loader2, Upload } from 'lucide-react'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import {
  fetchBackstageProductsPage,
  updateProductImages,
  type BackstageProductListItem,
} from '@/lib/backstage/products'
import {
  fetchCategoryTree,
  flattenCategoryTree,
  patchCategory,
  type CategoryFlat,
} from '@/lib/backstage/categories'

async function uploadProductImage(file: File, productId: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('productId', productId)
  const res = await fetch('/api/backstage/products/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  if (!res.ok) throw new Error('Не вдалося завантажити фото товару')
  const data = (await res.json()) as { url?: string }
  if (!data.url) throw new Error('Порожня відповідь upload')
  return data.url
}

async function uploadCategoryImage(file: File, categoryId: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('categoryId', categoryId)
  const res = await fetch('/api/backstage/categories/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  if (!res.ok) throw new Error('Не вдалося завантажити фото категорії')
  const data = (await res.json()) as { url?: string; path?: string }
  return data.url || data.path || ''
}

export function ProductsPhotosBulkEditor({ onClose }: { onClose?: () => void }) {
  const { locale: contentLocale } = useBackstageContentLocale()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<BackstageProductListItem[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(async (nextPage: number, q: string) => {
    setLoading(true)
    try {
      const data = await fetchBackstageProductsPage({
        page: nextPage,
        pageSize: 40,
        search: q.trim() || undefined,
        locale: contentLocale,
      })
      setItems(data.items)
      setPage(data.page)
      setTotalPages(data.totalPages)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити')
    } finally {
      setLoading(false)
    }
  }, [contentLocale])

  useEffect(() => {
    void load(1, '')
  }, [load])

  const onUpload = async (productId: string, file: File) => {
    setBusyId(productId)
    try {
      const url = await uploadProductImage(file, productId)
      await updateProductImages(productId, [{ url, isMain: true }])
      toast.success('Фото оновлено')
      await load(page, search)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка upload')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Пошук…"
          className="max-w-xs"
        />
        <Button type="button" variant="outline" onClick={() => void load(1, search)}>
          Оновити
        </Button>
        {onClose ? (
          <Button type="button" variant="ghost" onClick={onClose}>
            Закрити
          </Button>
        ) : null}
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-4 py-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-md bg-muted">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" fill className="object-cover" unoptimized />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.name}</p>
                <p className="truncate text-xs text-muted-foreground">{item.slug}</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={busyId === item.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (file) void onUpload(item.id, file)
                  }}
                />
                <span className="inline-flex items-center rounded-md border border-border px-3 py-1.5 hover:bg-muted/50">
                  {busyId === item.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Фото
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => void load(page - 1, search)}
        >
          Назад
        </Button>
        <span className="text-sm text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => void load(page + 1, search)}
        >
          Далі
        </Button>
      </div>
    </div>
  )
}

export function CategoriesPhotosBulkEditor({ onClose }: { onClose?: () => void }) {
  const { locale: contentLocale } = useBackstageContentLocale()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<CategoryFlat[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const tree = await fetchCategoryTree(contentLocale, { edit: false })
      setItems(flattenCategoryTree(tree))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити')
    } finally {
      setLoading(false)
    }
  }, [contentLocale])

  useEffect(() => {
    void load()
  }, [load])

  const onUpload = async (categoryId: string, file: File) => {
    setBusyId(categoryId)
    try {
      const path = await uploadCategoryImage(file, categoryId)
      await patchCategory(categoryId, { image: path })
      toast.success('Фото категорії оновлено')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка upload')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => void load()}>
          Оновити
        </Button>
        {onClose ? (
          <Button type="button" variant="ghost" onClick={onClose}>
            Закрити
          </Button>
        ) : null}
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-4 py-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-md bg-muted">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" fill className="object-cover" unoptimized />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.name}</p>
                <p className="truncate text-xs text-muted-foreground">{item.slug}</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={busyId === item.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (file) void onUpload(item.id, file)
                  }}
                />
                <span className="inline-flex items-center rounded-md border border-border px-3 py-1.5 hover:bg-muted/50">
                  {busyId === item.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Фото
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
