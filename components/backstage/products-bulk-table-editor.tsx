'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, ChevronRight, Loader2, Plus, Save, Upload } from 'lucide-react'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CategoryCombobox, type CategoryOption } from '@/components/backstage/category-combobox'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import { VariantAttributePicker } from '@/components/backstage/product-pricing-section'
import {
  buildProductPayload,
  fetchBackstageProduct,
  fetchBackstageProductsPage,
  productDetailToFormState,
  updateProduct,
  updateProductImages,
  type BackstageProductListItem,
} from '@/lib/backstage/products'
import { fetchCategoryTree, type CategoryTreeNode } from '@/lib/backstage/categories'
import {
  buildVariantLabel,
  fetchVariantAttributes,
  type VariantAttribute,
} from '@/lib/backstage/variant-attributes'
import { fetchCharacteristicDefinitions } from '@/lib/backstage/characteristics'
import { createVariantDraft, type ProductVariantDraft } from '@/lib/backstage/product-form'

const DRAFT_STORAGE_KEY = 'ga-products-bulk-drafts'
const PAGE_SIZE = 50

type DraftRow = {
  id: string
  nameUk: string
  nameEn: string
  nameSk: string
  slug: string
  latinName: string
  categoryId: string
  isPublished: boolean
  imageUrl: string | null
  baseline: string
}

type VariantDraft = {
  clientId: string
  variantId?: string
  label: string
  selections: Record<string, string>
  price: string
  stock: string
  weight: string
  lengthCm: string
  widthCm: string
  heightCm: string
  sku: string
  ean: string
}

type AddSizeForm = {
  selections: Record<string, string>
  price: string
  stock: string
  weight: string
  lengthCm: string
  widthCm: string
  heightCm: string
  sku: string
  ean: string
}

function emptyAddSizeForm(): AddSizeForm {
  return {
    selections: {},
    price: '',
    stock: '0',
    weight: '',
    lengthCm: '',
    widthCm: '',
    heightCm: '',
    sku: '',
    ean: '',
  }
}

type PersistedDraft = Omit<DraftRow, 'baseline' | 'imageUrl'> & { imageUrl?: string | null }

function rowKey(row: Pick<DraftRow, 'nameUk' | 'nameEn' | 'nameSk' | 'slug' | 'latinName' | 'categoryId' | 'isPublished'>) {
  return JSON.stringify({
    nameUk: row.nameUk,
    nameEn: row.nameEn,
    nameSk: row.nameSk,
    slug: row.slug,
    latinName: row.latinName,
    categoryId: row.categoryId,
    isPublished: row.isPublished,
  })
}

function readPersistedDrafts(): Record<string, PersistedDraft> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, PersistedDraft>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writePersistedDrafts(drafts: Record<string, PersistedDraft>) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts))
}

function clearPersistedIds(ids: string[]) {
  const drafts = readPersistedDrafts()
  let changed = false
  for (const id of ids) {
    if (drafts[id]) {
      delete drafts[id]
      changed = true
    }
  }
  if (changed) writePersistedDrafts(drafts)
}

function persistRow(row: DraftRow) {
  const drafts = readPersistedDrafts()
  if (rowKey(row) === row.baseline) {
    if (drafts[row.id]) {
      delete drafts[row.id]
      writePersistedDrafts(drafts)
    }
    return
  }
  drafts[row.id] = {
    id: row.id,
    nameUk: row.nameUk,
    nameEn: row.nameEn,
    nameSk: row.nameSk,
    slug: row.slug,
    latinName: row.latinName,
    categoryId: row.categoryId,
    isPublished: row.isPublished,
    imageUrl: row.imageUrl,
  }
  writePersistedDrafts(drafts)
}

function flattenCategoryOptions(nodes: CategoryTreeNode[], depth = 0): CategoryOption[] {
  const result: CategoryOption[] = []
  for (const node of nodes) {
    if (node.isActive) {
      result.push({ id: node.id, name: node.name, depth })
      result.push(...flattenCategoryOptions(node.children, depth + 1))
    }
  }
  return result
}

async function bulkUpdateProductFields(
  updates: Array<{
    id: string
    nameUk: string
    nameEn: string
    nameSk: string
    slug: string
    latinName: string
    primaryCategoryId: string
    isPublished: boolean
  }>,
) {
  const res = await fetch('/api/backstage/products/bulk-fields', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
    throw new Error(
      (Array.isArray(data.message) ? data.message.join(', ') : data.message) ||
        data.error ||
        'Помилка збереження',
    )
  }
  return res.json() as Promise<{ affected: number }>
}

async function uploadProductImage(file: File, productId: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('productId', productId)
  const res = await fetch('/api/backstage/products/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  if (!res.ok) throw new Error('Не вдалося завантажити фото')
  const data = (await res.json()) as { url?: string }
  if (!data.url) throw new Error('Порожня відповідь upload')
  return data.url
}

function draftFromVariant(
  v: ProductVariantDraft,
  label: string,
  id?: string,
): VariantDraft {
  return {
    clientId: v.clientId || crypto.randomUUID(),
    variantId: id,
    label: label || '—',
    selections: { ...v.selections },
    price: v.price,
    stock: v.stock,
    weight: v.weight,
    lengthCm: v.lengthCm,
    widthCm: v.widthCm,
    heightCm: v.heightCm,
    sku: v.sku,
    ean: v.ean,
  }
}

function itemToDraft(item: BackstageProductListItem): DraftRow {
  const draft: DraftRow = {
    id: item.id,
    nameUk: item.nameUk ?? (item.name || ''),
    nameEn: item.nameEn ?? '',
    nameSk: item.nameSk ?? '',
    slug: item.slug,
    latinName: item.latinName ?? '',
    categoryId: item.categoryId,
    isPublished: item.isPublished,
    imageUrl: item.imageUrl,
    baseline: '',
  }
  draft.baseline = rowKey(draft)
  return draft
}

function applyPersisted(draft: DraftRow, persisted: PersistedDraft | undefined): DraftRow {
  if (!persisted) return draft
  return {
    ...draft,
    nameUk: persisted.nameUk,
    nameEn: persisted.nameEn,
    nameSk: persisted.nameSk,
    slug: persisted.slug,
    latinName: persisted.latinName,
    categoryId: persisted.categoryId,
    isPublished: persisted.isPublished,
  }
}

export function ProductsBulkTableEditor() {
  const { locale: contentLocale } = useBackstageContentLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const urlQ = searchParams.get('q') ?? ''
  const urlPage = Math.max(1, Number(searchParams.get('page') || '1') || 1)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(urlPage)
  const [totalPages, setTotalPages] = useState(1)
  const [rows, setRows] = useState<DraftRow[]>([])
  const [searchInput, setSearchInput] = useState(urlQ)
  const [search, setSearch] = useState(urlQ)
  const [busyPhotoId, setBusyPhotoId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [variantDrafts, setVariantDrafts] = useState<Record<string, VariantDraft[]>>({})
  const [variantLoadingId, setVariantLoadingId] = useState<string | null>(null)
  const [variantSavingId, setVariantSavingId] = useState<string | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [attributes, setAttributes] = useState<VariantAttribute[]>([])
  const [addSizeProductId, setAddSizeProductId] = useState<string | null>(null)
  const [addSizeForm, setAddSizeForm] = useState<AddSizeForm>(emptyAddSizeForm)
  const [addSizeSaving, setAddSizeSaving] = useState(false)

  const syncUrl = useCallback(
    (nextPage: number, nextSearch: string) => {
      const params = new URLSearchParams()
      if (nextSearch.trim()) params.set('q', nextSearch.trim())
      if (nextPage > 1) params.set('page', String(nextPage))
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router],
  )

  const load = useCallback(async (nextPage: number, q: string) => {
    setLoading(true)
    try {
      const data = await fetchBackstageProductsPage({
        page: nextPage,
        pageSize: PAGE_SIZE,
        search: q.trim() || undefined,
        locale: contentLocale,
      })
      const persisted = readPersistedDrafts()
      const nextRows = data.items.map((item) =>
        applyPersisted(itemToDraft(item), persisted[item.id]),
      )
      setRows(nextRows)
      setPage(data.page)
      setTotalPages(Math.max(1, data.totalPages))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити товари')
    } finally {
      setLoading(false)
    }
  }, [contentLocale])

  useEffect(() => {
    void Promise.all([
      fetchCategoryTree(contentLocale, { edit: false }),
      fetchVariantAttributes({ locale: contentLocale, edit: false }),
    ])
      .then(([tree, attrs]) => {
        setCategoryOptions(flattenCategoryOptions(tree))
        setAttributes(attrs)
      })
      .catch(() => toast.error('Не вдалося завантажити довідники'))
      .finally(() => setCategoriesLoading(false))
  }, [contentLocale])

  useEffect(() => {
    setSearchInput(urlQ)
    setSearch(urlQ)
    setPage(urlPage)
  }, [urlQ, urlPage])

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim()
      if (next === search.trim()) return
      setSearch(next)
      setPage(1)
      syncUrl(1, next)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, search, syncUrl])

  useEffect(() => {
    void load(page, search)
  }, [load, page, search])

  const dirtyCount = useMemo(
    () => rows.filter((row) => rowKey(row) !== row.baseline).length,
    [rows],
  )

  const patchRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        const next = { ...row, ...patch }
        persistRow(next)
        return next
      }),
    )
  }

  const handleSave = async () => {
    const dirty = rows.filter((row) => rowKey(row) !== row.baseline)
    if (!dirty.length) return
    setSaving(true)
    try {
      await bulkUpdateProductFields(
        dirty.map((row) => ({
          id: row.id,
          nameUk: row.nameUk,
          nameEn: row.nameEn,
          nameSk: row.nameSk,
          slug: row.slug,
          latinName: row.latinName,
          primaryCategoryId: row.categoryId,
          isPublished: row.isPublished,
        })),
      )
      clearPersistedIds(dirty.map((row) => row.id))
      toast.success(`Збережено змін: ${dirty.length}`)
      await load(page, search)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти')
    } finally {
      setSaving(false)
    }
  }

  const onUpload = async (productId: string, file: File) => {
    setBusyPhotoId(productId)
    try {
      const url = await uploadProductImage(file, productId)
      await updateProductImages(productId, [{ url, isMain: true }])
      patchRow(productId, { imageUrl: url })
      toast.success('Фото оновлено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка upload')
    } finally {
      setBusyPhotoId(null)
    }
  }

  const toggleExpand = async (productId: string) => {
    if (expandedId === productId) {
      setExpandedId(null)
      return
    }
    setExpandedId(productId)
    if (variantDrafts[productId]) return
    setVariantLoadingId(productId)
    try {
      const [detail, definitions] = await Promise.all([
        fetchBackstageProduct(productId, contentLocale, { edit: false }),
        fetchCharacteristicDefinitions({ locale: contentLocale, edit: false }),
      ])
      const form = productDetailToFormState(detail, attributes, definitions)
      const drafts =
        form.variants.length > 0
          ? form.variants.map((variant, index) =>
              draftFromVariant(
                variant,
                detail.variants[index]?.label ??
                  buildVariantLabel(attributes, variant.selections) ??
                  `Варіант ${index + 1}`,
                detail.variants[index]?.id,
              ),
            )
          : [draftFromVariant(createVariantDraft(), 'Основний')]
      setVariantDrafts((prev) => ({ ...prev, [productId]: drafts }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити варіанти')
      setExpandedId(null)
    } finally {
      setVariantLoadingId(null)
    }
  }

  const patchVariant = (productId: string, index: number, patch: Partial<VariantDraft>) => {
    setVariantDrafts((prev) => {
      const list = prev[productId] ?? []
      return {
        ...prev,
        [productId]: list.map((row, i) => (i === index ? { ...row, ...patch } : row)),
      }
    })
  }

  const saveVariantRows = async (productId: string) => {
    const drafts = variantDrafts[productId]
    if (!drafts?.length) return
    setVariantSavingId(productId)
    try {
      const [detail, definitions] = await Promise.all([
        fetchBackstageProduct(productId, contentLocale, { edit: false }),
        fetchCharacteristicDefinitions({ locale: contentLocale, edit: false }),
      ])
      const form = productDetailToFormState(detail, attributes, definitions)
      form.pricingMode = drafts.length > 1 || Object.keys(drafts[0]?.selections ?? {}).length > 0
        ? 'variants'
        : form.pricingMode
      form.variants = drafts.map((draft) => {
        const base =
          form.variants.find((v) => v.id && v.id === draft.variantId) ?? createVariantDraft()
        return {
          ...base,
          id: draft.variantId ?? base.id,
          clientId: draft.clientId || base.clientId,
          selections: draft.selections,
          price: draft.price,
          stock: draft.stock,
          weight: draft.weight,
          lengthCm: draft.lengthCm,
          widthCm: draft.widthCm,
          heightCm: draft.heightCm,
          sku: draft.sku,
          ean: draft.ean,
        }
      })
      if (form.pricingMode === 'simple' && drafts[0]) {
        form.simplePrice = drafts[0].price
        form.simpleStock = drafts[0].stock
        form.simpleSku = drafts[0].sku
        form.simpleEan = drafts[0].ean
      }
      const payload = buildProductPayload(form, attributes, definitions, contentLocale)
      await updateProduct(productId, payload)
      toast.success('Варіанти збережено')
      setVariantDrafts((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      })
      await load(page, search)
      const [refreshed, refreshedDefinitions] = await Promise.all([
        fetchBackstageProduct(productId, contentLocale, { edit: false }),
        fetchCharacteristicDefinitions({ locale: contentLocale, edit: false }),
      ])
      const refreshedForm = productDetailToFormState(refreshed, attributes, refreshedDefinitions)
      setVariantDrafts((prev) => ({
        ...prev,
        [productId]: refreshedForm.variants.map((variant, index) =>
          draftFromVariant(
            variant,
            refreshed.variants[index]?.label ??
              buildVariantLabel(attributes, variant.selections) ??
              `Варіант ${index + 1}`,
            refreshed.variants[index]?.id,
          ),
        ),
      }))
      setExpandedId(productId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти варіанти')
    } finally {
      setVariantSavingId(null)
    }
  }

  const openAddSize = (productId: string) => {
    setAddSizeProductId(productId)
    setAddSizeForm(emptyAddSizeForm())
  }

  const submitAddSize = async () => {
    if (!addSizeProductId) return
    const hasSelection = Object.values(addSizeForm.selections).some(Boolean)
    if (!hasSelection) {
      toast.error('Оберіть хоча б один атрибут розміру')
      return
    }
    if (!addSizeForm.price.trim()) {
      toast.error('Вкажіть ціну')
      return
    }
    setAddSizeSaving(true)
    try {
      const label = buildVariantLabel(attributes, addSizeForm.selections) || 'Новий розмір'
      const newDraft: VariantDraft = {
        clientId: crypto.randomUUID(),
        label,
        selections: { ...addSizeForm.selections },
        price: addSizeForm.price,
        stock: addSizeForm.stock || '0',
        weight: addSizeForm.weight,
        lengthCm: addSizeForm.lengthCm,
        widthCm: addSizeForm.widthCm,
        heightCm: addSizeForm.heightCm,
        sku: addSizeForm.sku,
        ean: addSizeForm.ean,
      }

      let existing = variantDrafts[addSizeProductId]
      if (!existing) {
        const [detail, definitions] = await Promise.all([
          fetchBackstageProduct(addSizeProductId, contentLocale, { edit: false }),
          fetchCharacteristicDefinitions({ locale: contentLocale, edit: false }),
        ])
        const form = productDetailToFormState(detail, attributes, definitions)
        existing =
          form.variants.length > 0
            ? form.variants.map((variant, index) =>
                draftFromVariant(
                  variant,
                  detail.variants[index]?.label ??
                    buildVariantLabel(attributes, variant.selections) ??
                    `Варіант ${index + 1}`,
                  detail.variants[index]?.id,
                ),
              )
            : []
      }

      const nextDrafts = [...existing, newDraft]
      setVariantDrafts((prev) => ({ ...prev, [addSizeProductId]: nextDrafts }))
      setExpandedId(addSizeProductId)
      setAddSizeProductId(null)
      setAddSizeForm(emptyAddSizeForm())

      // Persist immediately so the size exists after reload
      setVariantSavingId(addSizeProductId)
      const [detail, definitions] = await Promise.all([
        fetchBackstageProduct(addSizeProductId, contentLocale, { edit: false }),
        fetchCharacteristicDefinitions({ locale: contentLocale, edit: false }),
      ])
      const form = productDetailToFormState(detail, attributes, definitions)
      form.pricingMode = 'variants'
      form.variants = nextDrafts.map((draft) => {
        const base =
          form.variants.find((v) => v.id && v.id === draft.variantId) ?? createVariantDraft()
        return {
          ...base,
          id: draft.variantId ?? undefined,
          clientId: draft.clientId || base.clientId,
          selections: draft.selections,
          price: draft.price,
          stock: draft.stock,
          weight: draft.weight,
          lengthCm: draft.lengthCm,
          widthCm: draft.widthCm,
          heightCm: draft.heightCm,
          sku: draft.sku,
          ean: draft.ean,
        }
      })
      await updateProduct(addSizeProductId, buildProductPayload(form, attributes, definitions, contentLocale))
      toast.success('Розмір додано')
      setVariantDrafts((prev) => {
        const next = { ...prev }
        delete next[addSizeProductId]
        return next
      })
      await load(page, search)
      // reload expanded variants
      const refreshed = await fetchBackstageProduct(addSizeProductId, contentLocale, { edit: false })
      const refreshedForm = productDetailToFormState(
        refreshed,
        attributes,
        await fetchCharacteristicDefinitions({ locale: contentLocale, edit: false }),
      )
      setVariantDrafts((prev) => ({
        ...prev,
        [addSizeProductId]: refreshedForm.variants.map((variant, index) =>
          draftFromVariant(
            variant,
            refreshed.variants[index]?.label ??
              buildVariantLabel(attributes, variant.selections) ??
              `Варіант ${index + 1}`,
            refreshed.variants[index]?.id,
          ),
        ),
      }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося додати розмір')
    } finally {
      setAddSizeSaving(false)
      setVariantSavingId(null)
    }
  }

  const goPage = (nextPage: number) => {
    setPage(nextPage)
    syncUrl(nextPage, search)
  }

  return (
    <div className="flex min-h-0 flex-col gap-0">
      <div className="sticky top-9 z-30 -mx-4 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md lg:-mx-6 lg:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">Таблиця товарів</h1>
              <p className="text-sm text-muted-foreground">
                Масове редагування. Чернетки полів зберігаються при перезавантаженні.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/backstage/add-plant">
                  <Plus className="mr-2 h-4 w-4" />
                  Додати товар
                </Link>
              </Button>
              <Button type="button" onClick={() => void handleSave()} disabled={saving || dirtyCount === 0}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Зберегти ({dirtyCount})
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const next = searchInput.trim()
                  setSearch(next)
                  setPage(1)
                  syncUrl(1, next)
                }
              }}
              placeholder="Пошук за назвою, slug, SKU…"
              className="max-w-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const next = searchInput.trim()
                setSearch(next)
                setPage(1)
                syncUrl(1, next)
                void load(1, next)
              }}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Оновити'}
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => goPage(page - 1)}
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
                disabled={page >= totalPages || loading}
                onClick={() => goPage(page + 1)}
              >
                Далі
              </Button>
              <Button type="button" variant="ghost" size="sm" asChild>
                <Link href="/backstage/products">До списку</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 max-h-[calc(100vh-11rem)] overflow-auto rounded-lg border border-border">
        <table className="w-full min-w-[1400px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky top-0 z-10 w-8 border-b border-border bg-muted px-2 py-2" />
              <th className="sticky top-0 z-10 border-b border-border bg-muted px-3 py-2 text-left font-medium">
                Фото
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-muted px-3 py-2 text-left font-medium">
                Назва UK
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-muted px-3 py-2 text-left font-medium">
                Назва EN
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-muted px-3 py-2 text-left font-medium">
                Назва SK
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-muted px-3 py-2 text-left font-medium">
                Латина
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-muted px-3 py-2 text-left font-medium">
                Slug
              </th>
              <th className="sticky top-0 z-10 min-w-[220px] border-b border-border bg-muted px-3 py-2 text-left font-medium">
                Категорія
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-muted px-3 py-2 text-left font-medium">
                Опубл.
              </th>
              <th className="sticky top-0 z-10 border-b border-border bg-muted px-3 py-2 text-left font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const expanded = expandedId === row.id
              const variants = variantDrafts[row.id] ?? []
              return (
                <Fragment key={row.id}>
                  <tr>
                    <td className="border-b border-border/60 px-2 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => void toggleExpand(row.id)}
                      >
                        {expanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                    <td className="border-b border-border/60 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="relative h-12 w-12 overflow-hidden rounded border bg-muted">
                          {row.imageUrl ? (
                            <Image
                              src={row.imageUrl}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                              sizes="48px"
                            />
                          ) : null}
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground">
                          {busyPhotoId === row.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={busyPhotoId === row.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              e.target.value = ''
                              if (file) void onUpload(row.id, file)
                            }}
                          />
                        </label>
                      </div>
                    </td>
                    <td className="border-b border-border/60 px-3 py-2">
                      <Input
                        value={row.nameUk}
                        onChange={(e) => patchRow(row.id, { nameUk: e.target.value })}
                      />
                    </td>
                    <td className="border-b border-border/60 px-3 py-2">
                      <Input
                        value={row.nameEn}
                        onChange={(e) => patchRow(row.id, { nameEn: e.target.value })}
                      />
                    </td>
                    <td className="border-b border-border/60 px-3 py-2">
                      <Input
                        value={row.nameSk}
                        onChange={(e) => patchRow(row.id, { nameSk: e.target.value })}
                      />
                    </td>
                    <td className="border-b border-border/60 px-3 py-2">
                      <Input
                        value={row.latinName}
                        onChange={(e) => patchRow(row.id, { latinName: e.target.value })}
                      />
                    </td>
                    <td className="border-b border-border/60 px-3 py-2">
                      <Input
                        value={row.slug}
                        onChange={(e) => patchRow(row.id, { slug: e.target.value })}
                      />
                    </td>
                    <td className="border-b border-border/60 px-3 py-2">
                      <CategoryCombobox
                        options={categoryOptions}
                        value={row.categoryId}
                        onChange={(categoryId) => patchRow(row.id, { categoryId })}
                        loading={categoriesLoading}
                        hideLabel
                      />
                    </td>
                    <td className="border-b border-border/60 px-3 py-2">
                      <Checkbox
                        checked={row.isPublished}
                        onCheckedChange={(checked) =>
                          patchRow(row.id, { isPublished: checked === true })
                        }
                      />
                    </td>
                    <td className="border-b border-border/60 px-3 py-2">
                      <Button type="button" variant="link" size="sm" asChild>
                        <Link href={`/backstage/products/${row.id}/edit`}>Редактор</Link>
                      </Button>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr>
                      <td colSpan={10} className="border-b border-border bg-muted/20 px-4 py-3">
                        {variantLoadingId === row.id ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Завантаження варіантів…
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {variants.map((vd, index) => (
                              <div
                                key={vd.clientId || vd.variantId || index}
                                className="rounded-md border border-border/50 bg-background/60 p-3"
                              >
                                <p className="mb-2 text-sm font-medium text-foreground">
                                  Розмір: {vd.label || '—'}
                                </p>
                                <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">SKU</label>
                                    <Input
                                      value={vd.sku}
                                      onChange={(e) =>
                                        patchVariant(row.id, index, { sku: e.target.value })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">EAN</label>
                                    <Input
                                      value={vd.ean}
                                      onChange={(e) =>
                                        patchVariant(row.id, index, { ean: e.target.value })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Ціна</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={vd.price}
                                      onChange={(e) =>
                                        patchVariant(row.id, index, { price: e.target.value })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Сток</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={vd.stock}
                                      onChange={(e) =>
                                        patchVariant(row.id, index, { stock: e.target.value })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Вага, кг</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={vd.weight}
                                      onChange={(e) =>
                                        patchVariant(row.id, index, { weight: e.target.value })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Д, см</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.1"
                                      value={vd.lengthCm}
                                      onChange={(e) =>
                                        patchVariant(row.id, index, { lengthCm: e.target.value })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Ш, см</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.1"
                                      value={vd.widthCm}
                                      onChange={(e) =>
                                        patchVariant(row.id, index, { widthCm: e.target.value })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">В, см</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.1"
                                      value={vd.heightCm}
                                      onChange={(e) =>
                                        patchVariant(row.id, index, { heightCm: e.target.value })
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openAddSize(row.id)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Додати розмір
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                disabled={variantSavingId === row.id || variants.length === 0}
                                onClick={() => void saveVariantRows(row.id)}
                              >
                                {variantSavingId === row.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Зберегти варіанти
                              </Button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                  Нічого не знайдено
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Dialog
        open={Boolean(addSizeProductId)}
        onOpenChange={(open) => {
          if (!open) {
            setAddSizeProductId(null)
            setAddSizeForm(emptyAddSizeForm())
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Додати розмір</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {attributes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Немає атрибутів розмірів. Створіть їх у розділі «Атрибути».
              </p>
            ) : (
              <VariantAttributePicker
                attributes={attributes}
                selections={addSizeForm.selections}
                onChange={(attributeId, valueId) =>
                  setAddSizeForm((prev) => ({
                    ...prev,
                    selections: { ...prev.selections, [attributeId]: valueId },
                  }))
                }
                onClear={(attributeId) =>
                  setAddSizeForm((prev) => {
                    const selections = { ...prev.selections }
                    delete selections[attributeId]
                    return { ...prev, selections }
                  })
                }
              />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Ціна *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={addSizeForm.price}
                  onChange={(e) => setAddSizeForm((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Сток</Label>
                <Input
                  type="number"
                  min="0"
                  value={addSizeForm.stock}
                  onChange={(e) => setAddSizeForm((prev) => ({ ...prev, stock: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input
                  value={addSizeForm.sku}
                  onChange={(e) => setAddSizeForm((prev) => ({ ...prev, sku: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>EAN</Label>
                <Input
                  value={addSizeForm.ean}
                  onChange={(e) => setAddSizeForm((prev) => ({ ...prev, ean: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Вага, кг</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={addSizeForm.weight}
                  onChange={(e) => setAddSizeForm((prev) => ({ ...prev, weight: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Д, см</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={addSizeForm.lengthCm}
                  onChange={(e) =>
                    setAddSizeForm((prev) => ({ ...prev, lengthCm: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ш, см</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={addSizeForm.widthCm}
                  onChange={(e) => setAddSizeForm((prev) => ({ ...prev, widthCm: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>В, см</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={addSizeForm.heightCm}
                  onChange={(e) =>
                    setAddSizeForm((prev) => ({ ...prev, heightCm: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAddSizeProductId(null)
                setAddSizeForm(emptyAddSizeForm())
              }}
            >
              Скасувати
            </Button>
            <Button
              type="button"
              disabled={addSizeSaving || attributes.length === 0}
              onClick={() => void submitAddSize()}
            >
              {addSizeSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Додати
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
