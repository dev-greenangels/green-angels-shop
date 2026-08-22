'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowUpDown, Loader2, Plus, RefreshCw, Square, Trash2, Download } from 'lucide-react'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { FreshPhotoUploadCard } from '@/components/backstage/fresh-photo-upload-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { formatDateTimeOrDash } from '@/lib/i18n/format-datetime'
import { resolveFreshPhotoThumbUrl } from '@/lib/variant-photos/fresh-photo-urls'

type PhotoItem = {
  id: string
  url: string
  mainUrl?: string
  thumbUrl?: string
  ean: string
  fileSizeBytes: number
  createdAt: string
  updatedAt: string
  appProperties: Record<string, string>
}

type PhotosPage = {
  items: PhotoItem[]
  total: number
  totalFileSizeBytes: number
  page: number
  pageSize: number
  totalPages: number
}

type ViberRecipient = { id: string; name: string }

type LegacyPhotoSyncStatus = {
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled'
  manifestUrl: string | null
  total: number
  imported: number
  skipped: number
  startedAt: string | null
  finishedAt: string | null
  cancelRequested?: boolean
  errors: Array<{ sourceId: string; error: string }>
}

const SORT_OPTIONS = [
  { value: 'photoDate:desc', label: 'Дата зйомки: спочатку нові' },
  { value: 'photoDate:asc', label: 'Дата зйомки: спочатку старі' },
  { value: 'createdAt:desc', label: 'Завантажено: спочатку нові' },
  { value: 'createdAt:asc', label: 'Завантажено: спочатку старі' },
  { value: 'ean:asc', label: 'EAN (А→Я)' },
  { value: 'ean:desc', label: 'EAN (Я→А)' },
  { value: 'fileSizeBytes:desc', label: 'Розмір файлу: більші' },
  { value: 'fileSizeBytes:asc', label: 'Розмір файлу: менші' },
] as const

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function parseSort(value: string): {
  sortBy: 'createdAt' | 'updatedAt' | 'ean' | 'fileSizeBytes' | 'photoDate'
  sortDir: 'asc' | 'desc'
} {
  const [sortBy, sortDir] = value.split(':')
  if (
    sortBy === 'photoDate' ||
    sortBy === 'createdAt' ||
    sortBy === 'updatedAt' ||
    sortBy === 'ean' ||
    sortBy === 'fileSizeBytes'
  ) {
    return { sortBy, sortDir: sortDir === 'asc' ? 'asc' : 'desc' }
  }
  return { sortBy: 'photoDate', sortDir: 'desc' }
}

function getPhotoTakenAt(photo: PhotoItem): string | null {
  return photo.appProperties.date?.trim() || null
}

export default function BackstagePhotosPage() {
  const { locale } = useBackstageUiLocale()
  const [data, setData] = useState<PhotosPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<string>(SORT_OPTIONS[0].value)
  const [recipients, setRecipients] = useState<ViberRecipient[]>([])
  const [newRecipientId, setNewRecipientId] = useState('')
  const [newRecipientName, setNewRecipientName] = useState('')
  const [manifestUrl, setManifestUrl] = useState('')
  const [legacyApiKey, setLegacyApiKey] = useState('')
  const [syncStatus, setSyncStatus] = useState<LegacyPhotoSyncStatus | null>(null)
  const [startingSync, setStartingSync] = useState(false)
  const [cancellingSync, setCancellingSync] = useState(false)
  const [savingRecipients, setSavingRecipients] = useState(false)
  const manifestUrlHydratedRef = useRef(false)

  const { sortBy, sortDir } = useMemo(() => parseSort(sort), [sort])
  const syncRunning = syncStatus?.status === 'running' || startingSync

  const loadPhotos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '50',
        sortBy,
        sortDir,
      })
      if (search.trim()) params.set('search', search.trim())
      if (dateFrom.trim()) params.set('dateFrom', dateFrom.trim())
      if (dateTo.trim()) params.set('dateTo', dateTo.trim())
      const res = await fetch(`/api/backstage/photos?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Помилка завантаження')
      setData(json)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити фото')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, search, dateFrom, dateTo, sortBy, sortDir])

  const loadRecipients = useCallback(async () => {
    try {
      const res = await fetch('/api/backstage/photos/viber-recipients', {
        credentials: 'include',
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Помилка')
      setRecipients(json.recipients ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити отримувачів')
    }
  }, [])

  const loadSyncStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/backstage/photos/sync-legacy/status', {
        credentials: 'include',
        cache: 'no-store',
      })
      const json = (await res.json()) as LegacyPhotoSyncStatus
      if (!res.ok) return
      setSyncStatus(json)
      return json
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    void loadPhotos()
  }, [loadPhotos])

  useEffect(() => {
    void loadRecipients()
  }, [loadRecipients])

  useEffect(() => {
    void loadSyncStatus()
  }, [loadSyncStatus])

  useEffect(() => {
    if (manifestUrlHydratedRef.current) return
    const savedUrl = syncStatus?.manifestUrl?.trim()
    if (!savedUrl) return
    setManifestUrl(savedUrl)
    manifestUrlHydratedRef.current = true
  }, [syncStatus?.manifestUrl])

  useEffect(() => {
    if (syncStatus?.status !== 'running') return
    const timer = window.setInterval(() => {
      void loadSyncStatus()
    }, 1500)
    return () => window.clearInterval(timer)
  }, [syncStatus?.status, loadSyncStatus])

  const prevSyncStatusRef = useRef<LegacyPhotoSyncStatus['status'] | undefined>(undefined)

  useEffect(() => {
    const prev = prevSyncStatusRef.current
    const current = syncStatus?.status
    if (prev === 'running' && current === 'completed' && syncStatus) {
      toast.success(
        `Синхронізовано ${syncStatus.imported} нових, пропущено ${syncStatus.skipped} з ${syncStatus.total}`,
      )
      void loadPhotos()
    }
    if (prev === 'running' && current === 'cancelled' && syncStatus) {
      toast.info(
        `Синхронізацію зупинено: завантажено ${syncStatus.imported} нових з ${syncStatus.total}`,
      )
      void loadPhotos()
    }
    if (prev === 'running' && current === 'error' && syncStatus) {
      toast.error(syncStatus.errors[0]?.error || 'Помилка синхронізації')
    }
    prevSyncStatusRef.current = current
  }, [syncStatus, loadPhotos])

  const deletePhoto = async (id: string) => {
    try {
      const res = await fetch('/api/backstage/photos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Не вдалося видалити')
      toast.success('Фото видалено')
      await loadPhotos()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка видалення')
    }
  }

  const saveRecipients = async (next: ViberRecipient[]) => {
    setSavingRecipients(true)
    try {
      const res = await fetch('/api/backstage/photos/viber-recipients', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: next }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Не вдалося зберегти')
      setRecipients(json.recipients ?? next)
      toast.success('Отримувачів оновлено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка збереження')
    } finally {
      setSavingRecipients(false)
    }
  }

  const addRecipient = async () => {
    const id = newRecipientId.trim()
    if (!id) {
      toast.error('Вкажіть Viber ID')
      return
    }
    if (recipients.some((r) => r.id === id)) {
      toast.error('Такий отримувач уже є')
      return
    }
    await saveRecipients([
      ...recipients,
      { id, name: newRecipientName.trim() || id },
    ])
    setNewRecipientId('')
    setNewRecipientName('')
  }

  const cancelSync = async () => {
    setCancellingSync(true)
    try {
      const res = await fetch('/api/backstage/photos/sync-legacy/cancel', {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || json.message || 'Не вдалося зупинити')
      setSyncStatus(json)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка зупинки синхронізації')
    } finally {
      setCancellingSync(false)
    }
  }

  const startLegacySync = async () => {
    const url = manifestUrl.trim()
    if (!url) {
      toast.error('Вкажіть URL маніфесту (…/photos/list-all)')
      return
    }

    setStartingSync(true)
    try {
      const res = await fetch('/api/backstage/photos/sync-legacy', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifestUrl: url,
          apiKey: legacyApiKey.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || json.message || 'Синхронізація не вдалася')
      setSyncStatus(json)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка синхронізації')
    } finally {
      setStartingSync(false)
    }
  }

  const rows = useMemo(() => data?.items ?? [], [data])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">Свіжі фото</h1>
            <p className="text-muted-foreground">
              Усього: {data?.total ?? 0} фото
              {data ? ` · ${formatBytes(data.totalFileSizeBytes)}` : ''}
            </p>
          </div>
          <Button variant="outline" onClick={() => void loadPhotos()} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            Оновити
          </Button>
        </div>

        <FreshPhotoUploadCard onUploaded={() => void loadPhotos()} />

        <Card>
          <CardHeader>
            <CardTitle>Синхронізація з legacy-сервером</CardTitle>
            <CardDescription>
              Вкажіть повний URL маніфесту (…/photos/list-all) діючого estimate-photo сервера.
              Повторний запуск пропускає вже імпортовані фото. API-ключ — у полі нижче або
              LEGACY_PHOTO_API_KEY у .env бекенду.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form autoComplete="off" className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <InputWithClear
              value={manifestUrl}
              onChange={(e) => setManifestUrl(e.target.value)}
              onClear={() => setManifestUrl('')}
              placeholder="https://your-server.example/photos/list-all"
              name="legacy-photo-manifest-url"
              autoComplete="off"
              disabled={syncRunning}
            />
            <InputWithClear
              value={legacyApiKey}
              onChange={(e) => setLegacyApiKey(e.target.value)}
              onClear={() => setLegacyApiKey('')}
              placeholder="x-api-key (опційно, якщо є в .env бекенду)"
              name="legacy-photo-api-key"
              type="text"
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              className="font-mono text-sm"
              disabled={syncRunning}
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" onClick={() => void startLegacySync()} disabled={syncRunning}>
                {syncRunning ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Синхронізувати
              </Button>
              {syncStatus?.status === 'running' ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void cancelSync()}
                  disabled={cancellingSync}
                >
                  {cancellingSync ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Square className="mr-2 h-4 w-4" />
                  )}
                  Зупинити
                </Button>
              ) : null}
            </div>
            </form>
            {syncStatus && syncStatus.status !== 'idle' ? (
              <div className="rounded-lg border border-border/80 bg-muted/30 px-4 py-3 text-sm">
                {syncStatus.status === 'running' ? (
                  <p className="font-medium">
                    Синхронізація: {syncStatus.imported + syncStatus.skipped} / {syncStatus.total}
                    {syncStatus.imported > 0 ? ` · нових ${syncStatus.imported}` : ''}
                    {syncStatus.skipped > 0 ? ` · пропущено ${syncStatus.skipped}` : ''}
                  </p>
                ) : null}
                {syncStatus.status === 'completed' ? (
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">
                    Завершено: нових {syncStatus.imported} з {syncStatus.total}
                    {syncStatus.skipped > 0 ? `, пропущено ${syncStatus.skipped}` : ''}
                  </p>
                ) : null}
                {syncStatus.status === 'cancelled' ? (
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    Зупинено: нових {syncStatus.imported} з {syncStatus.total}
                    {syncStatus.skipped > 0 ? `, пропущено ${syncStatus.skipped}` : ''}
                  </p>
                ) : null}
                {syncStatus.status === 'error' ? (
                  <p className="font-medium text-destructive">
                    {syncStatus.errors[0]?.error || 'Помилка синхронізації'}
                  </p>
                ) : null}
                {syncStatus.status === 'running' && syncStatus.total > 0 ? (
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((syncStatus.imported + syncStatus.skipped) / syncStatus.total) * 100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Отримувачі Viber</CardTitle>
            <CardDescription>
              Замість VIBER_USER_IDS. Імʼя підтягується з webhook, якщо користувач написав боту.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              autoComplete="off"
              className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
              onSubmit={(e) => {
                e.preventDefault()
                void addRecipient()
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="viber-recipient-id">Viber ID</Label>
                <InputWithClear
                  id="viber-recipient-id"
                  value={newRecipientId}
                  onChange={(e) => setNewRecipientId(e.target.value)}
                  onClear={() => setNewRecipientId('')}
                  placeholder="user id"
                  name="viber-recipient-id"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="viber-recipient-name">Імʼя</Label>
                <InputWithClear
                  id="viber-recipient-name"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  onClear={() => setNewRecipientName('')}
                  placeholder="опційно"
                  name="viber-recipient-name"
                  autoComplete="off"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={savingRecipients}>
                  <Plus className="mr-2 h-4 w-4" />
                  Додати
                </Button>
              </div>
            </form>

            {recipients.length === 0 ? (
              <p className="text-sm text-muted-foreground">Отримувачів ще немає.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Імʼя</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((recipient) => (
                    <TableRow key={recipient.id}>
                      <TableCell>{recipient.name}</TableCell>
                      <TableCell className="font-mono text-xs">{recipient.id}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            void saveRecipients(recipients.filter((r) => r.id !== recipient.id))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4 space-y-0 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Список фото</CardTitle>
              <CardDescription>Пошук за назвою, розміром, EAN, складом, датою</CardDescription>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <InputWithClear
                value={search}
                onChange={(e) => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
                onClear={() => {
                  setPage(1)
                  setSearch('')
                }}
                placeholder="Пошук…"
                className="w-56"
              />
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Дата зйомки від</Label>
                <InputWithClear
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setPage(1)
                    setDateFrom(e.target.value)
                  }}
                  onClear={() => {
                    setPage(1)
                    setDateFrom('')
                  }}
                  className="w-40"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">До</Label>
                <InputWithClear
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setPage(1)
                    setDateTo(e.target.value)
                  }}
                  onClear={() => {
                    setPage(1)
                    setDateTo('')
                  }}
                  className="w-40"
                />
              </div>
              <Select
                value={sort}
                onValueChange={(value) => {
                  setPage(1)
                  setSort(value)
                }}
              >
                <SelectTrigger className="w-64">
                  <ArrowUpDown className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Завантаження…
              </div>
            ) : rows.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">Фото немає.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                      <TableHead>Фото</TableHead>
                      <TableHead>Назва</TableHead>
                      <TableHead>Розмір</TableHead>
                      <TableHead>EAN</TableHead>
                      <TableHead>Склад</TableHead>
                      <TableHead>Дата зйомки</TableHead>
                      <TableHead>Завантажено</TableHead>
                      <TableHead>Файл</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="border-b border-border/80 odd:bg-background even:bg-muted/15 hover:bg-muted/35"
                      >
                        <TableCell className="py-3">
                          <div className="relative h-14 w-14 overflow-hidden rounded-md border border-border/70 bg-muted shadow-sm">
                            <Image
                              src={resolveFreshPhotoThumbUrl(row)}
                              alt=""
                              fill
                              unoptimized
                              className="object-cover"
                              sizes="56px"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[220px] min-w-0 truncate font-medium">
                          {row.appProperties.plantName || '—'}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate whitespace-nowrap">
                          {row.appProperties.plantSize || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.ean}</TableCell>
                        <TableCell className="max-w-[140px] truncate text-sm">
                          {row.appProperties.storageName || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTimeOrDash(getPhotoTakenAt(row), locale, 'datetime')}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTimeOrDash(row.createdAt, locale, 'datetime')}
                        </TableCell>
                        <TableCell>{formatBytes(row.fileSizeBytes)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => void deletePhoto(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {data && data.totalPages > 1 ? (
              <div className="flex items-center justify-center gap-3 border-t px-4 py-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Назад
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {data.totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Далі
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
