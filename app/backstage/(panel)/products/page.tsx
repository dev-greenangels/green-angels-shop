'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, Edit, Filter, Loader2, Plus, Search, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import { ContentLocaleBanner } from '@/components/backstage/content-locale-banner'
import { CategoryThumbnail } from '@/components/backstage/category-thumbnail'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { fetchCategoryTree, type CategoryTreeNode, categoryLabel } from '@/lib/backstage/categories'
import {
  bulkBackstageProducts,
  fetchBackstageProductsPage,
  setProductPublished,
  type BackstageProductListItem,
} from '@/lib/backstage/products'
import { useDebouncedUrlSearch } from '@/lib/backstage/use-debounced-url-search'
const PAGE_SIZE = 100

type PublishedFilter = 'all' | 'true' | 'false'
type StockFilter = 'all' | 'in_stock' | 'out_of_stock'

function flattenCategories(nodes: CategoryTreeNode[]): Array<{ id: string; name: string }> {
  const result: Array<{ id: string; name: string }> = []
  for (const node of nodes) {
    result.push({ id: node.id, name: categoryLabel(node) })
    result.push(...flattenCategories(node.children))
  }
  return result
}

function parsePublished(value: string | null): PublishedFilter {
  if (value === 'true' || value === 'false') return value
  return 'all'
}

function parseStock(value: string | null): StockFilter {
  if (value === 'in_stock' || value === 'out_of_stock') return value
  return 'all'
}

function buildProductsListQuery(opts: {
  search: string
  category: string
  published: PublishedFilter
  stock: StockFilter
  page: number
}): string {
  const params = new URLSearchParams()
  if (opts.search.trim()) params.set('q', opts.search.trim())
  if (opts.category !== 'all') params.set('category', opts.category)
  if (opts.published !== 'all') params.set('published', opts.published)
  if (opts.stock !== 'all') params.set('stock', opts.stock)
  if (opts.page > 1) params.set('page', String(opts.page))
  return params.toString()
}

function ProductsPageFallback() {
  const tc = useTranslations('common')
  return (
    <AdminLayout>
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {tc('loading')}
      </div>
    </AdminLayout>
  )
}

function ProductsPageContent() {
  const tp = useTranslations('pages.products')
  const tt = useTranslations('toast')
  const th = useTranslations('hints')
  const ta = useTranslations('actions')
  const tc = useTranslations('common')
  const tAria = useTranslations('aria')
  const tLabels = useTranslations('labels')
  const { locale: contentLocale, ready: contentLocaleReady } = useBackstageContentLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const categoryFilter = searchParams.get('category') ?? 'all'
  const publishedFilter = parsePublished(searchParams.get('published'))
  const stockFilter = parseStock(searchParams.get('stock'))
  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1)

  const { searchInput, setSearchInput, search, writeUrl, reset: resetSearch } =
    useDebouncedUrlSearch({ searchParams, pathname, router })

  const prevCommittedSearchRef = useRef(search)
  useEffect(() => {
    if (prevCommittedSearchRef.current === search) return
    prevCommittedSearchRef.current = search
    writeUrl(search, (params) => {
      params.delete('page')
    })
  }, [search, writeUrl])

  const [loading, setLoading] = useState(true)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [products, setProducts] = useState<BackstageProductListItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [stockValue, setStockValue] = useState('0')

  const syncUrl = useCallback(
    (next: {
      search: string
      category: string
      published: PublishedFilter
      stock: StockFilter
      page: number
    }) => {
      writeUrl(next.search, (params) => {
        if (next.category !== 'all') params.set('category', next.category)
        else params.delete('category')
        if (next.published !== 'all') params.set('published', next.published)
        else params.delete('published')
        if (next.stock !== 'all') params.set('stock', next.stock)
        else params.delete('stock')
        if (next.page > 1) params.set('page', String(next.page))
        else params.delete('page')
      })
    },
    [writeUrl],
  )

  const listQueryString = useMemo(
    () =>
      buildProductsListQuery({
        search,
        category: categoryFilter,
        published: publishedFilter,
        stock: stockFilter,
        page,
      }),
    [search, categoryFilter, publishedFilter, stockFilter, page],
  )

  const listHref = listQueryString ? `${pathname}?${listQueryString}` : pathname
  const returnToParam = encodeURIComponent(listHref)

  const loadProducts = useCallback(async () => {
    if (!contentLocaleReady) return
    setLoading(true)
    try {
      const data = await fetchBackstageProductsPage({
        search: search.trim() || undefined,
        categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
        published: publishedFilter,
        stock: stockFilter,
        page,
        pageSize: PAGE_SIZE,
        locale: contentLocale,
      })
      setProducts(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setSelectedIds((prev) => {
        const next = new Set<string>()
        for (const id of prev) {
          if (data.items.some((item) => item.id === id)) next.add(id)
        }
        return next
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, publishedFilter, stockFilter, page, tt, contentLocale, contentLocaleReady])

  useEffect(() => {
    if (!contentLocaleReady) return
    void fetchCategoryTree(contentLocale, { edit: false })
      .then((tree) => setCategories(flattenCategories(tree)))
      .catch(() => {})
  }, [contentLocale, contentLocaleReady])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  const updateFilters = (patch: {
    category?: string
    published?: PublishedFilter
    stock?: StockFilter
    page?: number
  }) => {
    syncUrl({
      search: search.trim(),
      category: patch.category ?? categoryFilter,
      published: patch.published ?? publishedFilter,
      stock: patch.stock ?? stockFilter,
      page: patch.page ?? 1,
    })
  }

  const resetFilters = () => {
    resetSearch()
    syncUrl({
      search: '',
      category: 'all',
      published: 'all',
      stock: 'all',
      page: 1,
    })
  }

  const hasActiveFilters = useMemo(
    () =>
      Boolean(search.trim()) ||
      categoryFilter !== 'all' ||
      publishedFilter !== 'all' ||
      stockFilter !== 'all',
    [search, categoryFilter, publishedFilter, stockFilter],
  )

  const emptyMessage = useMemo(() => {
    if (loading) return null
    if (hasActiveFilters) return tp('emptyFiltered')
    return tp('empty')
  }, [loading, hasActiveFilters, tp])

  const pageIds = useMemo(() => products.map((p) => p.id), [products])
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const someOnPageSelected = pageIds.some((id) => selectedIds.has(id))
  const selectedCount = selectedIds.size

  const toggleSelectAllOnPage = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        pageIds.forEach((id) => next.add(id))
      } else {
        pageIds.forEach((id) => next.delete(id))
      }
      return next
    })
  }

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleTogglePublished = async (product: BackstageProductListItem, isPublished: boolean) => {
    setProducts((prev) =>
      prev.map((item) => (item.id === product.id ? { ...item, isPublished } : item)),
    )
    setTogglingId(product.id)
    try {
      await setProductPublished(product.id, isPublished)
      toast.success(isPublished ? tt('productPublished') : tt('productHidden'))
    } catch (err) {
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, isPublished: !isPublished } : item,
        ),
      )
      toast.error(err instanceof Error ? err.message : tt('statusUpdateFailed'))
    } finally {
      setTogglingId(null)
    }
  }

  const runBulk = async (
    action: 'delete' | 'publish' | 'unpublish' | 'set_stock',
    stock?: number,
  ) => {
    const ids = [...selectedIds]
    if (!ids.length) return

    setBulkLoading(true)
    try {
      const result = await bulkBackstageProducts({ ids, action, stock })
      if (action === 'delete') {
        toast.success(tt('bulkProductsDeleted', { count: result.affected }))
        setSelectedIds(new Set())
      } else if (action === 'set_stock') {
        toast.success(
          tt('bulkStockUpdated', {
            products: result.affected,
            variants: result.variantsUpdated ?? 0,
          }),
        )
        setProducts((prev) =>
          prev.map((item) =>
            ids.includes(item.id) ? { ...item, stock: stock ?? item.stock } : item,
          ),
        )
      } else {
        const published = action === 'publish'
        toast.success(
          published
            ? tt('bulkPublished', { count: result.affected })
            : tt('bulkHidden', { count: result.affected }),
        )
        setProducts((prev) =>
          prev.map((item) => (ids.includes(item.id) ? { ...item, isPublished: published } : item)),
        )
      }
      if (action === 'delete') {
        await loadProducts()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('actionFailed'))
    } finally {
      setBulkLoading(false)
      setDeleteDialogOpen(false)
      setStockDialogOpen(false)
    }
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, total)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">{tp('title')}</h1>
            <p className="text-muted-foreground">{tp('subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/backstage/products/table">Таблиця</Link>
            </Button>
            <Button asChild>
              <Link href={`/backstage/add-plant?returnTo=${returnToParam}`}>
                <Plus className="mr-2 h-4 w-4" />
                {tp('addProduct')}
              </Link>
            </Button>
          </div>
        </div>

        <ContentLocaleBanner />

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={th('searchProducts')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Select
                  value={categoryFilter}
                  onValueChange={(value) => updateFilters({ category: value })}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder={tp('categoryFilter')} />
                  </SelectTrigger>
                  <SelectContent className="z-[80]">
                    <SelectItem value="all">{tp('allCategories')}</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={publishedFilter}
                  onValueChange={(value) =>
                    updateFilters({ published: value as PublishedFilter })
                  }
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder={tp('statusFilter')} />
                  </SelectTrigger>
                  <SelectContent className="z-[80]">
                    <SelectItem value="all">{tp('allStatuses')}</SelectItem>
                    <SelectItem value="true">{tp('publishedStatus')}</SelectItem>
                    <SelectItem value="false">{tp('draftStatus')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={stockFilter}
                  onValueChange={(value) =>
                    updateFilters({ stock: value as StockFilter })
                  }
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder={tp('stockFilter')} />
                  </SelectTrigger>
                  <SelectContent className="z-[80]">
                    <SelectItem value="all">{tp('anyStock')}</SelectItem>
                    <SelectItem value="in_stock">{tp('inStock')}</SelectItem>
                    <SelectItem value="out_of_stock">{tp('outOfStock')}</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-muted-foreground"
                    onClick={resetFilters}
                  >
                    <X className="mr-1 h-4 w-4" />
                    {tp('resetFilters')}
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedCount > 0 ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex flex-wrap items-center gap-2 py-3">
              <span className="text-sm font-medium">{tc('selected', { count: selectedCount })}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={bulkLoading}
                onClick={() => void runBulk('publish')}
              >
                {tp('publish')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={bulkLoading}
                onClick={() => void runBulk('unpublish')}
              >
                {ta('hide')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={bulkLoading}
                onClick={() => setStockDialogOpen(true)}
              >
                {tp('changeStock')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={bulkLoading}
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {ta('delete')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={bulkLoading}
                onClick={() => setSelectedIds(new Set())}
              >
                {tp('clearSelection')}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle>
              {tp('listTitle', { count: total.toLocaleString() })}
              {total > 0 ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {rangeStart}–{rangeEnd}
                </span>
              ) : null}
            </CardTitle>
            {totalPages > 1 ? (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1 || loading}
                  onClick={() => updateFilters({ page: Math.max(1, page - 1) })}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[5rem] text-center">
                  {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages || loading}
                  onClick={() => updateFilters({ page: Math.min(totalPages, page + 1) })}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                {tc('loading')}
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">{emptyMessage}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-10 px-2 py-3">
                        <Checkbox
                          checked={allOnPageSelected ? true : someOnPageSelected ? 'indeterminate' : false}
                          onCheckedChange={(value) => toggleSelectAllOnPage(value === true)}
                          aria-label={tAria('selectAllOnPage')}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        {tp('colName')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        {tp('colCategory')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        {tp('colSizes')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        {tp('colStock')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        {tp('colStatus')}
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">
                        {tp('colActions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-border last:border-0 hover:bg-muted/50"
                      >
                        <td className="w-10 px-2 py-3">
                          <Checkbox
                            checked={selectedIds.has(product.id)}
                            onCheckedChange={(value) =>
                              toggleSelectOne(product.id, value === true)
                            }
                            aria-label={tAria('selectItem', { name: product.name })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-stretch gap-3">
                            <CategoryThumbnail
                              src={product.imageUrl ?? ''}
                              alt={product.name}
                              className="w-14 shrink-0 self-stretch rounded-md border border-border"
                            />
                            <div className="min-w-0">
                              <p className="font-medium">{product.name}</p>
                              {product.latinName ? (
                                <p className="text-xs italic text-muted-foreground">
                                  {product.latinName}
                                </p>
                              ) : null}
                              <p className="text-xs text-muted-foreground">/{product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{product.categoryName}</td>
                        <td className="px-4 py-3 text-sm">
                          {product.variantCount > 1
                            ? tp('variantsCount', { count: product.variantCount })
                            : (product.variantLabel ?? '—')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              product.stock < 1
                                ? 'bg-red-100 text-red-800'
                                : product.stock < 20
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {product.stock < 1
                              ? tp('stockNone')
                              : tp('stockUnits', { count: product.stock })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={product.isPublished}
                              disabled={togglingId === product.id}
                              onCheckedChange={(checked) =>
                                void handleTogglePublished(product, checked)
                              }
                              aria-label={
                                product.isPublished
                                  ? tAria('disablePublish')
                                  : tAria('enablePublish')
                              }
                            />
                            <span className="text-xs text-muted-foreground">
                              {product.isPublished ? tLabels('published') : tp('draft')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link
                                href={`/backstage/products/${product.id}/edit?returnTo=${returnToParam}`}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">{ta('edit')}</span>
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && !loading ? (
              <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
                <span>
                  {tp('shownRange', {
                    start: rangeStart,
                    end: rangeEnd,
                    total: total.toLocaleString(),
                  })}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => updateFilters({ page: Math.max(1, page - 1) })}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {tp('prev')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => updateFilters({ page: Math.min(totalPages, page + 1) })}
                  >
                    {tp('next')}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tp('deleteTitle', { count: selectedCount })}</AlertDialogTitle>
            <AlertDialogDescription>{tp('deleteBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkLoading}>{ta('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkLoading}
              onClick={(e) => {
                e.preventDefault()
                void runBulk('delete')
              }}
            >
              {bulkLoading ? ta('deleting') : ta('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{tp('stockDialogTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {tp('stockDialogDesc', { count: selectedCount })}
          </p>
          <div className="space-y-2">
            <Label htmlFor="bulk-stock">{tp('stockQuantityLabel')}</Label>
            <Input
              id="bulk-stock"
              type="number"
              min={0}
              value={stockValue}
              onChange={(e) => setStockValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStockDialogOpen(false)}>
              {ta('cancel')}
            </Button>
            <Button
              type="button"
              disabled={bulkLoading}
              onClick={() => void runBulk('set_stock', Math.max(0, Number(stockValue) || 0))}
            >
              {bulkLoading ? ta('saving') : tp('apply')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageFallback />}>
      <ProductsPageContent />
    </Suspense>
  )
}
