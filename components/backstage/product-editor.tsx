'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import { ContentLocaleBanner, ContentLocaleLabel, TranslationHint } from '@/components/backstage/content-locale-banner'
import { AdditionalCategoriesPicker } from '@/components/backstage/additional-categories-picker'
import { CategoryCombobox, type CategoryOption } from '@/components/backstage/category-combobox'
import {
  ProductPricingModeSwitcher,
  ProductPricingSection,
} from '@/components/backstage/product-pricing-section'
import { RichTextEditor } from '@/components/backstage/rich-text-editor'
import { StickyFormActions } from '@/components/backstage/sticky-form-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchCategoryTree, categoryLabel, type CategoryTreeNode } from '@/lib/backstage/categories'
import {
  buildProductPayload,
  checkProductSlugAvailable,
  createProduct,
  fetchBackstageProduct,
  productDetailToFormState,
  updateProduct,
  updateProductImages,
  type BackstageProductDetail,
} from '@/lib/backstage/products'
import { ProductCharacteristicsFields } from '@/components/backstage/product-characteristics-fields'
import {
  fetchCharacteristicDefinitions,
  type CharacteristicDefinition,
} from '@/lib/backstage/characteristics'
import {
  emptyProductForm,
  isProductFormDirty,
  slugifyProductName,
  type ProductFormState,
  type ProductImageDraft,
} from '@/lib/backstage/product-form'
import { ProductImagesField } from '@/components/backstage/product-images-field'
import { fetchVariantAttributes, type VariantAttribute } from '@/lib/backstage/variant-attributes'
import { cn } from '@/lib/utils'

function flattenCategoryOptions(nodes: CategoryTreeNode[], depth = 0): CategoryOption[] {
  const result: CategoryOption[] = []
  for (const node of nodes) {
    if (node.isActive) {
      result.push({ id: node.id, name: categoryLabel(node), depth })
      result.push(...flattenCategoryOptions(node.children, depth + 1))
    }
  }
  return result
}

function countVariantSelections(selections: Record<string, string>) {
  return Object.values(selections).filter(Boolean).length
}

function validateForm(
  form: ProductFormState,
  attributes: VariantAttribute[],
  tv: (key: string, values?: { n: number }) => string,
): string | null {
  if (!form.name.trim()) return tv('productNameRequired')
  if (!form.primaryCategoryId) return tv('primaryCategoryRequired')
  if (!form.slug.trim()) return tv('productSlugRequired')

  if (form.pricingMode === 'simple') {
    if (!form.simplePrice.trim()) return tv('priceRequired')
    if (!form.simpleStock.trim()) return tv('stockRequired')
  } else {
    if (attributes.length === 0) {
      return tv('attributesRequired')
    }
    if (form.variants.length === 0) return tv('variantRequired')
    for (let i = 0; i < form.variants.length; i++) {
      const v = form.variants[i]
      const n = i + 1
      if (countVariantSelections(v.selections) === 0) {
        return tv('variantAttributes', { n })
      }
      if (!v.price.trim()) return tv('variantPrice', { n })
      if (!v.stock.trim()) return tv('variantStock', { n })
    }
  }

  return null
}

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'

function resolveProductsReturnTo(returnTo?: string): string {
  if (!returnTo) return '/backstage/products'
  if (returnTo === '/backstage/products' || returnTo.startsWith('/backstage/products?')) {
    return returnTo
  }
  return '/backstage/products'
}

export function ProductEditor({
  productId,
  returnTo,
}: {
  productId?: string
  returnTo?: string
}) {
  const router = useRouter()
  const { locale: contentLocale, ready: contentLocaleReady } = useBackstageContentLocale()
  const tp = useTranslations('pages.products')
  const tv = useTranslations('validation')
  const tt = useTranslations('toast')
  const th = useTranslations('hints')
  const tl = useTranslations('labels')
  const tBanner = useTranslations('contentBanner')
  const isEditing = Boolean(productId)
  const productsListHref = resolveProductsReturnTo(returnTo)
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditing)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [attributesLoading, setAttributesLoading] = useState(true)
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [attributes, setAttributes] = useState<VariantAttribute[]>([])
  const [characteristicDefinitions, setCharacteristicDefinitions] = useState<
    CharacteristicDefinition[]
  >([])
  const [legacyCharacteristics, setLegacyCharacteristics] = useState<
    BackstageProductDetail['characteristics'] | null
  >(null)
  const [form, setForm] = useState<ProductFormState>(emptyProductForm)
  const [baseline, setBaseline] = useState<ProductFormState>(emptyProductForm)
  const [translationHints, setTranslationHints] = useState<{
    name?: { locale: string; text: string } | null
    description?: { locale: string; text: string } | null
    metaTitle?: { locale: string; text: string } | null
    metaDesc?: { locale: string; text: string } | null
  }>({})
  const [slugTouched, setSlugTouched] = useState(false)
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [activeTab, setActiveTab] = useState('content')

  const loadCategories = useCallback(async () => {
    if (!contentLocaleReady) return
    setCategoriesLoading(true)
    try {
      const tree = await fetchCategoryTree(contentLocale, { edit: false })
      setCategoryOptions(flattenCategoryOptions(tree))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('loadFailed'))
    } finally {
      setCategoriesLoading(false)
    }
  }, [contentLocale, contentLocaleReady, tt])

  const loadAttributes = useCallback(async () => {
    if (!contentLocaleReady) return
    setAttributesLoading(true)
    try {
      setAttributes(await fetchVariantAttributes({ locale: contentLocale, edit: false }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('loadFailed'))
    } finally {
      setAttributesLoading(false)
    }
  }, [contentLocale, contentLocaleReady, tt])

  useEffect(() => {
    if (!contentLocaleReady) return
    void loadCategories()
    void loadAttributes()
    void fetchCharacteristicDefinitions({ locale: contentLocale, edit: false })
      .then(setCharacteristicDefinitions)
      .catch(() => undefined)
  }, [loadCategories, loadAttributes, contentLocale, contentLocaleReady])

  useEffect(() => {
    if (!productId || !contentLocaleReady) return

    let cancelled = false
    setInitialLoading(true)

    void Promise.all([
      fetchBackstageProduct(productId, contentLocale),
      fetchVariantAttributes({ locale: contentLocale, edit: false }),
      fetchCharacteristicDefinitions({ locale: contentLocale, edit: false }),
    ])
      .then(([detail, variantAttributes, definitions]) => {
        if (cancelled) return
        setAttributes(variantAttributes)
        setCharacteristicDefinitions(definitions)
        setLegacyCharacteristics(detail.characteristics)
        const loaded = productDetailToFormState(detail, variantAttributes, definitions)
        setForm(loaded)
        setBaseline(loaded)
        setTranslationHints({
          name: detail.nameHint,
          description: detail.descriptionHint,
          metaTitle: detail.metaTitleHint,
          metaDesc: detail.metaDescHint,
        })
        setSlugTouched(true)
        setSlugStatus('available')
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : tt('loadFailed'))
          router.push(productsListHref)
        }
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [productId, router, contentLocale, contentLocaleReady, productsListHref, tt])

  const patch = useCallback(
    (patchValues: Partial<ProductFormState>) => {
      setForm((prev) => {
        const next = { ...prev, ...patchValues }
        if (patchValues.name !== undefined && !slugTouched && !isEditing) {
          next.slug = slugifyProductName(patchValues.name)
        }
        if (patchValues.primaryCategoryId !== undefined) {
          next.additionalCategoryIds = next.additionalCategoryIds.filter(
            (id) => id !== patchValues.primaryCategoryId,
          )
        }
        return next
      })
      if (patchValues.slug !== undefined) setSlugStatus('idle')
    },
    [slugTouched, isEditing],
  )

  const checkSlug = useCallback(
    async (slug: string, productIdToExclude?: string) => {
      const normalized = slug.trim().toLowerCase()
      if (!normalized) {
        setSlugStatus('idle')
        return false
      }
      setSlugStatus('checking')
      try {
        const result = await checkProductSlugAvailable(normalized, productIdToExclude)
        setSlugStatus(result.available ? 'available' : 'taken')
        return result.available
      } catch {
        setSlugStatus('error')
        return false
      }
    },
    [],
  )

  useEffect(() => {
    if (!form.slug.trim() || !slugTouched) return
    const timer = setTimeout(() => {
      void checkSlug(form.slug, form.id)
    }, 400)
    return () => clearTimeout(timer)
  }, [form.slug, form.id, slugTouched, checkSlug])

  const isDirty = useMemo(() => isProductFormDirty(form, baseline), [form, baseline])

  const persistProductImages = useCallback(
    async (images: ProductImageDraft[]) => {
      if (!productId) return images

      const saved = await updateProductImages(
        productId,
        images.map(({ url, isMain }) => ({ url, isMain })),
      )

      const next = saved.map((image, index) => ({
        clientId: images[index]?.clientId ?? crypto.randomUUID(),
        url: image.url,
        isMain: image.isMain,
      }))

      setBaseline((prev) => ({ ...prev, images: next }))
      return next
    },
    [productId],
  )

  const editorTitle = isEditing
    ? form.name.trim()
      ? tp('editTitleNamed', { name: form.name.trim() })
      : tp('editTitle')
    : tp('addTitle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const error = validateForm(form, attributes, tv)
    if (error) {
      toast.error(error)
      return
    }

    const slugOk =
      slugStatus === 'available' ? true : await checkSlug(form.slug, form.id)
    if (!slugOk) {
      toast.error(tt('slugTaken'))
      return
    }

    setIsLoading(true)
    try {
      const payload = buildProductPayload(form, attributes, characteristicDefinitions, contentLocale)
      if (isEditing && productId) {
        await updateProduct(productId, payload)
        toast.success(tt('productSaved'))
      } else {
        await createProduct(payload)
        toast.success(tt('productCreated'))
      }
      router.push(productsListHref)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('saveFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {tp('loadingProduct')}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout addClassName="pt-0 lg:pt-0">
      <form onSubmit={handleSubmit} className="space-y-4" data-backstage-form>
        <ContentLocaleBanner />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <StickyFormActions
            title={editorTitle}
            subtitle={tp('formSubtitle')}
            onCancel={() => router.push(productsListHref)}
            isLoading={isLoading}
            isDirty={isDirty}
            isPublished={form.isPublished}
            onPublishedChange={(isPublished) => patch({ isPublished })}
            tabs={
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-5">
                <TabsTrigger value="content">{tp('tabContent')}</TabsTrigger>
                <TabsTrigger value="seo">{tp('tabSeo')}</TabsTrigger>
                <TabsTrigger value="pricing">{tp('tabPricing')}</TabsTrigger>
                <TabsTrigger value="attrs">{tp('tabAttrs')}</TabsTrigger>
                <TabsTrigger value="photos">{tp('tabPhotos')}</TabsTrigger>
              </TabsList>
            }
          />

              {activeTab === 'content' ? (
              <TabsContent value="content" className="mt-4 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{tp('mainTitle')}</CardTitle>
                    <CardDescription>{tp('mainDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <ContentLocaleLabel htmlFor="name">{tp('productName')}</ContentLocaleLabel>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) => patch({ name: e.target.value })}
                          placeholder={tBanner('missingPlaceholder')}
                          required
                        />
                        <TranslationHint hint={translationHints.name} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="latinName">{tp('latinName')}</Label>
                        <Input
                          id="latinName"
                          value={form.latinName}
                          onChange={(e) => patch({ latinName: e.target.value })}
                          placeholder="Thuja occidentalis Smaragd"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 sm:max-w-md">
                      <Label htmlFor="cnCode">{tp('cnCode')}</Label>
                      <Input
                        id="cnCode"
                        value={form.cnCode}
                        onChange={(e) => patch({ cnCode: e.target.value })}
                        placeholder="060290"
                        inputMode="numeric"
                        autoComplete="off"
                      />
                      <p className="text-xs text-amber-800 dark:text-amber-200/90">
                        {tp('cnCodeWarning')}
                      </p>
                    </div>

                    <div className="space-y-2 sm:max-w-md">
                      <Label htmlFor="legacyId">{tl('legacyId')}</Label>
                      <Input
                        id="legacyId"
                        value={form.legacyId}
                        onChange={(e) => patch({ legacyId: e.target.value })}
                        placeholder={th('optionalLegacyId')}
                      />
                    </div>

                    <CategoryCombobox
                      label={tp('primaryCategory')}
                      options={categoryOptions}
                      value={form.primaryCategoryId}
                      onChange={(primaryCategoryId) => patch({ primaryCategoryId })}
                      loading={categoriesLoading}
                      required
                    />

                    <AdditionalCategoriesPicker
                      options={categoryOptions}
                      primaryCategoryId={form.primaryCategoryId}
                      selectedIds={form.additionalCategoryIds}
                      onChange={(additionalCategoryIds) => patch({ additionalCategoryIds })}
                      loading={categoriesLoading}
                    />

                    <RichTextEditor
                      label={tp('fullDescription')}
                      value={form.description}
                      onChange={(description) => patch({ description })}
                    />
                    <TranslationHint hint={translationHints.description} />
                  </CardContent>
                </Card>
              </TabsContent>
              ) : null}

              {activeTab === 'seo' ? (
              <TabsContent value="seo" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{tp('seoTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="slug">{tl('slug')}</Label>
                      <div className="flex gap-2">
                        <Input
                          id="slug"
                          value={form.slug}
                          onChange={(e) => {
                            setSlugTouched(true)
                            patch({ slug: e.target.value.toLowerCase() })
                          }}
                          onBlur={() => void checkSlug(form.slug, form.id)}
                          placeholder="tuia-zahidna-smarahd"
                          className="flex-1"
                        />
                        <SlugStatusBadge status={slugStatus} />
                      </div>
                      <p className="text-xs text-muted-foreground">/{form.slug || '…'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metaTitle">Meta title</Label>
                      <Input
                        id="metaTitle"
                        value={form.metaTitle}
                        onChange={(e) => patch({ metaTitle: e.target.value })}
                        maxLength={120}
                      />
                      <TranslationHint hint={translationHints.metaTitle} />
                      <p className="text-xs text-muted-foreground">{form.metaTitle.length}/120</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metaDesc">Meta description</Label>
                      <Textarea
                        id="metaDesc"
                        value={form.metaDesc}
                        onChange={(e) => patch({ metaDesc: e.target.value })}
                        maxLength={300}
                        rows={4}
                        className="min-h-[100px] text-sm"
                      />
                      <TranslationHint hint={translationHints.metaDesc} />
                      <p className="text-xs text-muted-foreground">{form.metaDesc.length}/300</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              ) : null}

              {activeTab === 'pricing' ? (
              <div className="mt-4" role="tabpanel" aria-label={tp('pricingTabAria')}>
                <Card className="overflow-hidden">
                  <CardHeader className="gap-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-1">
                        <CardTitle>{tp('pricingTitle')}</CardTitle>
                        <CardDescription>
                          {tp('pricingDescPrefix')}{' '}
                          <a href="/backstage/attributes" className="text-primary underline">
                            {tp('pricingDescLink')}
                          </a>
                        </CardDescription>
                      </div>
                      <ProductPricingModeSwitcher
                        value={form.pricingMode}
                        onChange={(pricingMode) => patch({ pricingMode })}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-hidden pb-2">
                    <ProductPricingSection
                      pricingMode={form.pricingMode}
                      simpleSku={form.simpleSku}
                      simpleEan={form.simpleEan}
                      simpleStock={form.simpleStock}
                      simplePrice={form.simplePrice}
                      onSimpleChange={(field, value) => patch({ [field]: value })}
                      variants={form.variants}
                      onVariantsChange={(variants) => patch({ variants })}
                      attributes={attributes}
                      attributesLoading={attributesLoading}
                    />
                  </CardContent>
                </Card>
              </div>
              ) : null}

              {activeTab === 'photos' ? (
              <TabsContent value="photos" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{tp('photosTitle')}</CardTitle>
                    <CardDescription>{tp('photosDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProductImagesField
                      images={form.images}
                      productId={form.id}
                      onChange={(images) => setForm((prev) => ({ ...prev, images }))}
                      onPersist={productId ? persistProductImages : undefined}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              ) : null}

              {activeTab === 'attrs' ? (
              <TabsContent value="attrs" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{tp('attrsTitle')}</CardTitle>
                    <CardDescription>{tp('attrsDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProductCharacteristicsFields
                      value={form.characteristics}
                      legacy={legacyCharacteristics ?? undefined}
                      onChange={(characteristics) => setForm((prev) => ({ ...prev, characteristics }))}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              ) : null}
        </Tabs>
      </form>
    </AdminLayout>
  )
}

function SlugStatusBadge({ status }: { status: SlugStatus }) {
  const tp = useTranslations('pages.products')

  if (status === 'idle') return null

  const config = {
    checking: { icon: Loader2, text: '…', className: 'text-muted-foreground', spin: true },
    available: { icon: CheckCircle2, text: tp('slugFree'), className: 'text-primary', spin: false },
    taken: { icon: XCircle, text: tp('slugTaken'), className: 'text-destructive', spin: false },
    error: { icon: XCircle, text: tp('slugError'), className: 'text-destructive', spin: false },
  }[status]

  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-1.5 self-center px-2 text-xs font-medium',
        config.className,
      )}
    >
      <Icon className={cn('h-4 w-4', config.spin && 'animate-spin')} />
      <span className="hidden sm:inline">{config.text}</span>
    </div>
  )
}
