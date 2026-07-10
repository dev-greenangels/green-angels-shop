'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { AdminLayout } from '@/components/admin/admin-layout'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  createBackstageRedirect,
  deleteBackstageRedirect,
  fetchBackstageRedirectPrefixes,
  fetchBackstageRedirects,
  invalidateBackstageRedirectCache,
  updateBackstageRedirect,
  type RedirectFormValues,
  type RedirectRecord,
} from '@/lib/backstage/redirects'
import { cn } from '@/lib/utils'

const EMPTY_FORM: RedirectFormValues = {
  fromPath: '',
  toPath: '',
  statusCode: 301,
  isActive: true,
  prefix: '',
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('uk-UA', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default function RedirectsPage() {
  const [rows, setRows] = useState<RedirectRecord[]>([])
  const [prefixes, setPrefixes] = useState<string[]>([])
  const [prefixFilter, setPrefixFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [invalidating, setInvalidating] = useState(false)
  const [form, setForm] = useState<RedirectFormValues>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<RedirectRecord | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [redirects, prefixList] = await Promise.all([
        fetchBackstageRedirects(prefixFilter === 'all' ? undefined : prefixFilter),
        fetchBackstageRedirectPrefixes(),
      ])
      setRows(redirects)
      setPrefixes(prefixList)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити редіректи.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [prefixFilter])

  useEffect(() => {
    void load()
  }, [load])

  const totalHits = useMemo(() => rows.reduce((sum, row) => sum + row.hitCount, 0), [rows])

  const submit = async () => {
    if (!form.fromPath.trim() || !form.toPath.trim()) {
      toast.error('Заповніть шляхи «звідки» та «куди».')
      return
    }
    setSaving(true)
    try {
      await createBackstageRedirect({
        ...form,
        prefix: form.prefix?.trim() || undefined,
      })
      setForm(EMPTY_FORM)
      toast.success('Редірект створено.')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося створити редірект.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (row: RedirectRecord) => {
    try {
      await updateBackstageRedirect(row.id, { isActive: !row.isActive })
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося оновити статус.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteBackstageRedirect(deleteTarget.id)
      toast.success('Редірект видалено.')
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося видалити.')
    }
  }

  const invalidateCache = async () => {
    setInvalidating(true)
    try {
      await invalidateBackstageRedirectCache()
      toast.success('Кеш редіректів очищено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося очистити кеш.')
    } finally {
      setInvalidating(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Редіректи</h1>
            <p className="text-muted-foreground">
              Керування перенаправленнями URL. Усього спрацювань у вибірці: {totalHits}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void invalidateCache()} disabled={invalidating}>
              <RefreshCw className={cn('mr-2 h-4 w-4', invalidating && 'animate-spin')} />
              Очистити кеш
            </Button>
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
              Оновити
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Новий редірект</CardTitle>
            <CardDescription>Шляхи без локалі, напр. /old-page → /catalog</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-1.5">
              <Label>Звідки</Label>
              <Input
                value={form.fromPath}
                onChange={(e) => setForm({ ...form, fromPath: e.target.value })}
                placeholder="/old-url"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Куди</Label>
              <Input
                value={form.toPath}
                onChange={(e) => setForm({ ...form, toPath: e.target.value })}
                placeholder="/new-url"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Код</Label>
              <Select
                value={String(form.statusCode)}
                onValueChange={(value) => setForm({ ...form, statusCode: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301</SelectItem>
                  <SelectItem value="302">302</SelectItem>
                  <SelectItem value="307">307</SelectItem>
                  <SelectItem value="308">308</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Префікс (група)</Label>
              <Input
                value={form.prefix ?? ''}
                onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                placeholder="catalog"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" className="w-full" onClick={() => void submit()} disabled={saving}>
                <Plus className="mr-2 h-4 w-4" />
                {saving ? 'Збереження...' : 'Додати'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Список редіректів</CardTitle>
            <Select value={prefixFilter} onValueChange={setPrefixFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Префікс" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі префікси</SelectItem>
                {prefixes.map((prefix) => (
                  <SelectItem key={prefix} value={prefix}>
                    {prefix}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Завантаження...
              </div>
            ) : rows.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                Редіректів поки немає.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Звідки</TableHead>
                    <TableHead>Куди</TableHead>
                    <TableHead>Код</TableHead>
                    <TableHead>Префікс</TableHead>
                    <TableHead>Спрацювань</TableHead>
                    <TableHead>Останнє</TableHead>
                    <TableHead>Активний</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.fromPath}</TableCell>
                      <TableCell className="font-mono text-xs">{row.toPath}</TableCell>
                      <TableCell>{row.statusCode}</TableCell>
                      <TableCell>{row.prefix ?? '—'}</TableCell>
                      <TableCell>{row.hitCount}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(row.lastHitAt)}
                      </TableCell>
                      <TableCell>
                        <Switch checked={row.isActive} onCheckedChange={() => void toggleActive(row)} />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteTarget(row)}
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
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити редірект?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Перенаправлення ${deleteTarget.fromPath} → ${deleteTarget.toPath} буде видалено.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={() => void handleDelete()}>
              Видалити
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
