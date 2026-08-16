'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { FileUp, Loader2, Square, Upload } from 'lucide-react'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  cancelBlogImagesImport,
  cancelProductImagesImport,
  cancelReviewImagesImport,
  fetchBlogImagesStatus,
  fetchProductImagesStatus,
  fetchReviewImagesStatus,
  importCsvFile,
  startBlogImagesImport,
  startProductImagesImport,
  startReviewImagesImport,
  type ImageJobStatus,
  type ImportKind,
  type ImportStatsResult,
} from '@/lib/backstage/import'
import {
  CATALOG_EXCEL_SHEETS,
  downloadCatalogExcelTemplate,
  importCatalogExcelFile,
  type CatalogExcelSheetKey,
  type CatalogExcelStats,
  type CatalogExcelTemplateMode,
} from '@/lib/backstage/catalog-excel'
import { cn } from '@/lib/utils'

type ImportCard = {
  kind: ImportKind
  title: string
  description: string
  fileHint: string
}

const CARDS: ImportCard[] = [
  {
    kind: 'categories',
    title: '1. Категорії',
    description: 'categories.csv — дерево категорій зі slug id-link_rewrite',
    fileHint: 'categories.csv',
  },
  {
    kind: 'attributes',
    title: '2. Атрибути (довідник розмірів)',
    description: 'attributes.csv — групи та значення з Presta id_attribute',
    fileHint: 'attributes.csv',
  },
  {
    kind: 'features',
    title: '3. Характеристики (довідник)',
    description: 'features.csv — довідник features',
    fileHint: 'features.csv',
  },
  {
    kind: 'products',
    title: '4. Товари',
    description: 'products.csv — назва, latin_name, slug, опис',
    fileHint: 'products.csv',
  },
  {
    kind: 'product-features',
    title: '5. Характеристики товарів',
    description: 'product_features.csv — привʼязка id_product → id_feature_value (після товарів)',
    fileHint: 'product_features.csv',
  },
  {
    kind: 'variants',
    title: '6. Варіанти',
    description: 'variants.csv — комбінації з attribute_ids та габаритами',
    fileHint: 'variants.csv',
  },
  {
    kind: 'product-images',
    title: '7. Зображення товарів',
    description:
      'images.csv — фоновий імпорт з URL з Налаштувань. Можна зупинити; прогрес зберігається.',
    fileHint: 'images.csv',
  },
  {
    kind: 'reviews',
    title: '8. Відгуки',
    description: 'reviews.csv — upsert по Comment ID',
    fileHint: 'reviews.csv',
  },
  {
    kind: 'review-images',
    title: '9. Фото відгуків',
    description:
      'review_images.csv — id_product_comment (Comment ID), id_image; фоновий імпорт, URL шаблон у Налаштуваннях',
    fileHint: 'review_images.csv',
  },
  {
    kind: 'users',
    title: '10. Клієнти',
    description:
      'customers.csv — id_customer, firstname, lastname, email, newsletter, optin, date_add',
    fileHint: 'customers.csv',
  },
  {
    kind: 'orders',
    title: '11. Замовлення',
    description:
      'orders.csv — id_order, id_customer, reference, total_paid_tax_incl, payment, osname, date_add',
    fileHint: 'orders.csv',
  },
  {
    kind: 'order-lines',
    title: '12. Позиції замовлень',
    description:
      'order_details.csv — id_order, id_product, id_product_attribute, product_name, quantity, unit_price_tax_incl (після замовлень)',
    fileHint: 'order_details.csv',
  },
  {
    kind: 'blog',
    title: '13. Блог',
    description: 'blog.csv — статті st_blog',
    fileHint: 'blog.csv',
  },
  {
    kind: 'blog-images',
    title: '14. Обкладинки блогу',
    description: 'blog_images.csv — фоновий імпорт; URL шаблон у Налаштуваннях',
    fileHint: 'blog_images.csv',
  },
]

function formatStats(result: ImportStatsResult) {
  const parts = [
    result.created != null ? `створено ${result.created}` : null,
    result.updated != null ? `оновлено ${result.updated}` : null,
    result.deleted != null && result.deleted > 0 ? `видалено битих ${result.deleted}` : null,
    result.skipped != null ? `пропущено ${result.skipped}` : null,
  ].filter(Boolean)
  return parts.join(' · ')
}

function jobFailedCount(status: ImageJobStatus) {
  if (typeof status.failed === 'number') return status.failed
  return status.errors?.length ?? 0
}

function JobProgress({
  label,
  status,
  onCancel,
  cancelling,
}: {
  label: string
  status: ImageJobStatus | null
  onCancel: () => void
  cancelling: boolean
}) {
  if (!status || status.status === 'idle') return null
  const pct =
    status.total > 0 ? Math.min(100, Math.round((status.processed / status.total) * 100)) : 0
  const failed = jobFailedCount(status)
  const statsSuffix = [
    status.imported > 0 ? `нових ${status.imported}` : null,
    status.skipped > 0 ? `пропущено ${status.skipped}` : null,
    failed > 0 ? `помилок ${failed}` : null,
  ]
    .filter(Boolean)
    .map((part) => ` · ${part}`)
    .join('')

  return (
    <div className="mt-3 w-full rounded-lg border border-border/80 bg-muted/30 px-4 py-3 text-sm">
      {status.status === 'running' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">
              {label}: {status.processed} / {status.total}
              {statsSuffix}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Square className="mr-2 h-3.5 w-3.5" />
              )}
              Зупинити
            </Button>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          {status.currentImageId ? (
            <p className="mt-1 text-xs text-muted-foreground">Зараз: {status.currentImageId}</p>
          ) : null}
        </>
      ) : (
        <p className="font-medium">
          {label}: {status.status}
          {' · '}
          {status.processed}/{status.total}
          {statsSuffix}
        </p>
      )}
      {status.errors?.length ? (
        <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2">
          <p className="mb-1.5 text-xs font-medium text-destructive">
            Помилки ({status.errors.length}
            {failed > status.errors.length ? ` з ${failed}` : ''})
          </p>
          <ul className="list-inside list-disc space-y-1 text-xs text-destructive">
            {status.errors.map((err, index) => (
              <li key={`${err.sourceId}-${index}`} className="break-all">
                {err.sourceId}: {err.error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function ExcelImportCard() {
  const [busy, setBusy] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [result, setResult] = useState<CatalogExcelStats | null>(null)
  const [mode, setMode] = useState<CatalogExcelTemplateMode>('empty')
  const [sheets, setSheets] = useState<CatalogExcelSheetKey[]>([...CATALOG_EXCEL_SHEETS])
  const inputRef = useRef<HTMLInputElement | null>(null)

  const toggleSheet = (sheet: CatalogExcelSheetKey, checked: boolean) => {
    setSheets((prev) => {
      if (checked) {
        return CATALOG_EXCEL_SHEETS.filter((s) => prev.includes(s) || s === sheet)
      }
      return prev.filter((s) => s !== sheet)
    })
  }

  const downloadTemplate = async () => {
    if (sheets.length === 0) {
      toast.error('Оберіть хоча б один лист')
      return
    }
    setDownloading(true)
    try {
      const { blob, filename } = await downloadCatalogExcelTemplate({ mode, sheets })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити шаблон')
    } finally {
      setDownloading(false)
    }
  }

  const runImport = async (file: File) => {
    setBusy(true)
    setResult(null)
    try {
      const stats = await importCatalogExcelFile(file)
      setResult(stats)
      toast.success('Excel-імпорт завершено', {
        description: `створено ${stats.created} · оновлено ${stats.updated}${
          stats.errors.length ? ` · помилок ${stats.errors.length}` : ''
        }`,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка Excel-імпорту')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Excel (.xlsx) — без фото</CardTitle>
        <CardDescription>
          Категорії, атрибути, значення, характеристики, товари та варіанти. У файлі завжди всі
          листи; галочки в режимі «Дані з каталогу» — які листи заповнити даними (решта порожні).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Листи з даними каталогу</p>
          <p className="text-xs text-muted-foreground">
            У Excel завжди всі листи. Відмічені в режимі «Дані з каталогу» — з даними; інші (і весь
            «Порожній») — з сірим курсивним прикладом.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {CATALOG_EXCEL_SHEETS.map((sheet) => {
              const id = `excel-sheet-${sheet}`
              const checked = sheets.includes(sheet)
              return (
                <label key={sheet} htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(value) => toggleSheet(sheet, value === true)}
                  />
                  <span>{sheet}</span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Режим шаблону</p>
          <RadioGroup
            value={mode}
            onValueChange={(value) => setMode(value as CatalogExcelTemplateMode)}
            className="flex flex-wrap gap-3"
          >
            <label
              htmlFor="excel-mode-empty"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5"
            >
              <RadioGroupItem value="empty" id="excel-mode-empty" />
              <div>
                <Label htmlFor="excel-mode-empty" className="cursor-pointer font-medium">
                  Порожній
                </Label>
                <p className="text-xs text-muted-foreground">Усі листи з прикладом заповнення</p>
              </div>
            </label>
            <label
              htmlFor="excel-mode-export"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5"
            >
              <RadioGroupItem value="export" id="excel-mode-export" />
              <div>
                <Label htmlFor="excel-mode-export" className="cursor-pointer font-medium">
                  Дані з каталогу
                </Label>
                <p className="text-xs text-muted-foreground">
                  Відмічені — дані; інші — приклад
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={downloading || sheets.length === 0}
            onClick={() => void downloadTemplate()}
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="mr-2 h-4 w-4" />
            )}
            {downloading
              ? 'Завантаження…'
              : mode === 'export'
                ? 'Завантажити з даними'
                : 'Завантажити шаблон'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void runImport(file)
            }}
          />
          <Button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {busy ? 'Імпорт…' : 'Імпортувати Excel'}
          </Button>
        </div>
        {result ? (
          <div className="text-sm text-muted-foreground">
            Створено {result.created} · оновлено {result.updated}
            {result.errors.length > 0 ? (
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-destructive">
                {result.errors.slice(0, 20).map((err, index) => (
                  <li key={`${err.sheet}-${err.row}-${index}`}>
                    [{err.sheet} · рядок {err.row}] {err.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default function ImportPage() {
  const [busyKind, setBusyKind] = useState<ImportKind | null>(null)
  const [results, setResults] = useState<Partial<Record<ImportKind, ImportStatsResult>>>({})
  const [productJob, setProductJob] = useState<ImageJobStatus | null>(null)
  const [blogJob, setBlogJob] = useState<ImageJobStatus | null>(null)
  const [reviewJob, setReviewJob] = useState<ImageJobStatus | null>(null)
  const [cancellingProduct, setCancellingProduct] = useState(false)
  const [cancellingBlog, setCancellingBlog] = useState(false)
  const [cancellingReview, setCancellingReview] = useState(false)
  const inputRefs = useRef<Partial<Record<ImportKind, HTMLInputElement | null>>>({})
  const prevProductStatus = useRef<string | null>(null)
  const prevBlogStatus = useRef<string | null>(null)
  const prevReviewStatus = useRef<string | null>(null)

  const loadProductStatus = useCallback(async () => {
    try {
      const status = await fetchProductImagesStatus()
      setProductJob(status)
      return status
    } catch {
      return null
    }
  }, [])

  const loadBlogStatus = useCallback(async () => {
    try {
      const status = await fetchBlogImagesStatus()
      setBlogJob(status)
      return status
    } catch {
      return null
    }
  }, [])

  const loadReviewStatus = useCallback(async () => {
    try {
      const status = await fetchReviewImagesStatus()
      setReviewJob(status)
      return status
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    void loadProductStatus()
    void loadBlogStatus()
    void loadReviewStatus()
  }, [loadProductStatus, loadBlogStatus, loadReviewStatus])

  useEffect(() => {
    if (productJob?.status !== 'running') return
    const timer = window.setInterval(() => {
      void loadProductStatus()
    }, 1500)
    return () => window.clearInterval(timer)
  }, [productJob?.status, loadProductStatus])

  useEffect(() => {
    if (blogJob?.status !== 'running') return
    const timer = window.setInterval(() => {
      void loadBlogStatus()
    }, 1500)
    return () => window.clearInterval(timer)
  }, [blogJob?.status, loadBlogStatus])

  useEffect(() => {
    if (reviewJob?.status !== 'running') return
    const timer = window.setInterval(() => {
      void loadReviewStatus()
    }, 1500)
    return () => window.clearInterval(timer)
  }, [reviewJob?.status, loadReviewStatus])

  useEffect(() => {
    const prev = prevProductStatus.current
    const next = productJob?.status ?? null
    if (prev === 'running' && next && next !== 'running') {
      if (next === 'completed') toast.success('Імпорт зображень товарів завершено')
      if (next === 'cancelled') toast.message('Імпорт зображень товарів зупинено')
      if (next === 'error') toast.error('Помилка імпорту зображень товарів')
    }
    prevProductStatus.current = next
  }, [productJob?.status])

  useEffect(() => {
    const prev = prevBlogStatus.current
    const next = blogJob?.status ?? null
    if (prev === 'running' && next && next !== 'running') {
      if (next === 'completed') toast.success('Імпорт обкладинок блогу завершено')
      if (next === 'cancelled') toast.message('Імпорт обкладинок блогу зупинено')
      if (next === 'error') toast.error('Помилка імпорту обкладинок блогу')
    }
    prevBlogStatus.current = next
  }, [blogJob?.status])

  useEffect(() => {
    const prev = prevReviewStatus.current
    const next = reviewJob?.status ?? null
    if (prev === 'running' && next && next !== 'running') {
      if (next === 'completed') toast.success('Імпорт фото відгуків завершено')
      if (next === 'cancelled') toast.message('Імпорт фото відгуків зупинено')
      if (next === 'error') toast.error('Помилка імпорту фото відгуків')
    }
    prevReviewStatus.current = next
  }, [reviewJob?.status])

  async function runImport(kind: ImportKind, file: File) {
    setBusyKind(kind)
    try {
      if (kind === 'product-images') {
        const status = await startProductImagesImport(file)
        setProductJob(status)
        toast.success('Імпорт зображень запущено')
        return
      }
      if (kind === 'blog-images') {
        const status = await startBlogImagesImport(file)
        setBlogJob(status)
        toast.success('Імпорт обкладинок запущено')
        return
      }
      if (kind === 'review-images') {
        const status = await startReviewImagesImport(file)
        setReviewJob(status)
        toast.success('Імпорт фото відгуків запущено')
        return
      }
      const result = await importCsvFile(kind, file)
      setResults((prev) => ({ ...prev, [kind]: result }))
      toast.success(`Імпорт «${kind}» завершено`, { description: formatStats(result) })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка імпорту')
    } finally {
      setBusyKind(null)
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Імпорт каталогу</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Excel (нативний формат GA) або PrestaShop CSV. Повторний імпорт оновлює існуючі записи.{' '}
            <Link href="/backstage/settings" className="underline underline-offset-2">
              URL шаблони зображень Presta — у Налаштуваннях
            </Link>
            .
          </p>
        </div>

        <ExcelImportCard />

        <div>
          <h2 className="text-lg font-semibold tracking-tight">PrestaShop (CSV)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Завантажуйте файли в порядку карток. Повторний імпорт оновлює за legacyId.
          </p>
        </div>

        <div className="grid gap-4">
          {CARDS.map((card) => {
            const result = results[card.kind]
            const busy = busyKind === card.kind
            const imageRunning =
              (card.kind === 'product-images' && productJob?.status === 'running') ||
              (card.kind === 'blog-images' && blogJob?.status === 'running') ||
              (card.kind === 'review-images' && reviewJob?.status === 'running')

            return (
              <Card key={card.kind}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={(el) => {
                        inputRefs.current[card.kind] = el
                      }}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (file) void runImport(card.kind, file)
                      }}
                    />
                    <Button
                      type="button"
                      disabled={busyKind != null || imageRunning}
                      onClick={() => inputRefs.current[card.kind]?.click()}
                    >
                      {busy || imageRunning ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      {busy || imageRunning ? 'Імпорт…' : 'Обрати CSV'}
                    </Button>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <FileUp className="h-3.5 w-3.5" />
                      {card.fileHint}
                    </span>
                  </div>

                  {card.kind === 'product-images' ? (
                    <JobProgress
                      label="Зображення товарів"
                      status={productJob}
                      cancelling={cancellingProduct}
                      onCancel={() => {
                        setCancellingProduct(true)
                        void cancelProductImagesImport()
                          .then(setProductJob)
                          .catch((err) =>
                            toast.error(err instanceof Error ? err.message : 'Помилка зупинки'),
                          )
                          .finally(() => setCancellingProduct(false))
                      }}
                    />
                  ) : null}

                  {card.kind === 'blog-images' ? (
                    <JobProgress
                      label="Обкладинки блогу"
                      status={blogJob}
                      cancelling={cancellingBlog}
                      onCancel={() => {
                        setCancellingBlog(true)
                        void cancelBlogImagesImport()
                          .then(setBlogJob)
                          .catch((err) =>
                            toast.error(err instanceof Error ? err.message : 'Помилка зупинки'),
                          )
                          .finally(() => setCancellingBlog(false))
                      }}
                    />
                  ) : null}

                  {card.kind === 'review-images' ? (
                    <JobProgress
                      label="Фото відгуків"
                      status={reviewJob}
                      cancelling={cancellingReview}
                      onCancel={() => {
                        setCancellingReview(true)
                        void cancelReviewImagesImport()
                          .then(setReviewJob)
                          .catch((err) =>
                            toast.error(err instanceof Error ? err.message : 'Помилка зупинки'),
                          )
                          .finally(() => setCancellingReview(false))
                      }}
                    />
                  ) : null}

                  {result &&
                  card.kind !== 'product-images' &&
                  card.kind !== 'blog-images' &&
                  card.kind !== 'review-images' ? (
                    <div className={cn('mt-3 w-full text-sm text-muted-foreground')}>
                      <p>{formatStats(result)}</p>
                      {result.errors && result.errors.length > 0 ? (
                        <ul className="mt-1 list-inside list-disc text-xs text-destructive">
                          {result.errors.slice(0, 5).map((err) => (
                            <li key={err}>{err}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
