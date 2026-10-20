'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import type { CategoryOption } from '@/components/backstage/category-combobox'
import {
  DiscountRuleFiltersEditor,
  filtersFromCriteria,
  filtersToPayload,
  type AttrGroupDraft,
  type CharGroupDraft,
} from '@/components/backstage/discount-rule-filters'
import {
  DiscountRuleQuantityTiersEditor,
  tiersFromRule,
  tiersToPayload,
  type QuantityTierDraft,
} from '@/components/backstage/discount-rule-quantity-tiers'
import { PromoMultiCategoryPicker } from '@/components/backstage/promo-multi-category-picker'
import { PromoProductVariantPicker } from '@/components/backstage/promo-product-variant-picker'
import { PromoUserPicker } from '@/components/backstage/promo-user-picker'
import { PromotionsUnsavedGuard } from '@/components/backstage/promotions-unsaved-guard'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
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
import { fetchCategoryTree } from '@/lib/backstage/categories'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import {
  hasFieldErrors,
  validateDiscountRuleDraft,
  type DiscountFormFieldErrors,
} from '@/lib/backstage/promotions-form'
import { isFormDirty, stableStringify } from '@/lib/backstage/promotions-list'
import {
  buildScopePayload,
  flattenCategoryTreeForPicker,
  pruneRedundantCategoryIds,
} from '@/lib/backstage/promo-scope-selection'
import {
  previewDiscountRule,
  saveDiscountRule,
  type BuyerRegistrationScope,
  type DiscountRuleItem,
  type DiscountRulePreviewResult,
  type PromoEligibleAudience,
} from '@/lib/backstage/pricing'

const DEFAULT_OPEN_SECTIONS = ['main', 'audience', 'scope', 'tiers', 'exclusions'] as const

type CommercialOffer = 'RETAIL' | 'WHOLESALER' | 'BOTH'

function audiencesToOffer(audiences: PromoEligibleAudience[]): CommercialOffer {
  const retail = audiences.includes('RETAIL')
  const wholesale = audiences.includes('WHOLESALER')
  if (retail && wholesale) return 'BOTH'
  if (wholesale && !retail) return 'WHOLESALER'
  return 'RETAIL'
}

function offerToAudiences(offer: CommercialOffer): PromoEligibleAudience[] {
  if (offer === 'BOTH') return ['RETAIL', 'WHOLESALER']
  if (offer === 'WHOLESALER') return ['WHOLESALER']
  return ['RETAIL']
}

function sameIdList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i])
}

function resolveFieldErrorMessage(
  errorKey: string | undefined,
  t: ReturnType<typeof useTranslations<'discountRules'>>,
  tElig: ReturnType<typeof useTranslations<'promoEligibility'>>,
): string | null {
  if (!errorKey) return null
  if (
    errorKey === 'needOneAudience' ||
    errorKey === 'errGuestOnlyNeedsRetail' ||
    errorKey === 'errGuestOnlyNoAllowlist'
  ) {
    return tElig(errorKey)
  }
  return t(errorKey as Parameters<typeof t>[0])
}

function buildDraftPayload(input: {
  name: string
  target: DiscountRuleItem['target']
  categoryIds: string[]
  categoryOptions: CategoryOption[]
  productItems: Array<{ id: string; label: string }>
  variantItems: Array<{ id: string; label: string }>
  excludeProducts: Array<{ id: string; label: string }>
  excludeVariants: Array<{ id: string; label: string }>
  excludeCategoryIds: string[]
  eligibleAudiences: PromoEligibleAudience[]
  buyerRegistrationScope: BuyerRegistrationScope
  filterCriteria: ReturnType<typeof filtersToPayload>
  quantityTiers: ReturnType<typeof tiersToPayload>
  combinesWithOtherDiscounts: DiscountRuleItem['combinesWithOtherDiscounts']
  onlyForRoles: string[]
  groupIds: string[]
  allowedUserIds: string[]
  minCartSubtotal: string
  startDate: string
  endDate: string
  isActive: boolean
}) {
  const scope = buildScopePayload({
    target: input.target,
    categoryIds: input.categoryIds,
    categoryOptions: input.categoryOptions,
    productItems: input.productItems,
    variantItems: input.variantItems,
    excludeCategoryIds: input.excludeCategoryIds,
    excludeProducts: input.excludeProducts,
    excludeVariants: input.excludeVariants,
  })
  return {
    name: input.name,
    target: input.target,
    targetIds: scope.targetIds,
    excludeProductIds: scope.excludeProductIds,
    excludeVariantIds: scope.excludeVariantIds,
    excludeCategoryIds: scope.excludeCategoryIds,
    eligibleAudiences: input.eligibleAudiences,
    buyerRegistrationScope: input.buyerRegistrationScope,
    filterCriteria: input.filterCriteria,
    quantityTiers: input.quantityTiers,
    combinesWithOtherDiscounts: input.combinesWithOtherDiscounts,
    onlyForRoles: input.onlyForRoles,
    groupIds: input.allowedUserIds.length > 0 ? [] : input.groupIds,
    allowedUserIds: input.allowedUserIds,
    minCartSubtotal: input.minCartSubtotal ? Number(input.minCartSubtotal) : null,
    startDate: input.startDate ? new Date(input.startDate).toISOString() : undefined,
    endDate: input.endDate ? new Date(input.endDate).toISOString() : undefined,
    isActive: input.isActive,
  }
}

export function DiscountRuleEditor({
  item,
  groups,
  lockedVariant = null,
  returnTo = '/backstage/promotions',
}: {
  item: DiscountRuleItem | null
  groups: Array<{ id: string; name: string }>
  /** When opened from product editor — lock scope to this variant. */
  lockedVariant?: { id: string; label: string } | null
  returnTo?: string
}) {
  const t = useTranslations('discountRules')
  const tElig = useTranslations('promoEligibility')
  const router = useRouter()
  const { locale: contentLocale } = useBackstageContentLocale()

  const [name, setName] = useState('')
  const [combinesWithOtherDiscounts, setCombinesWithOtherDiscounts] =
    useState<'BEST_PRICE' | 'STACK' | 'MAX_OF'>('BEST_PRICE')
  const [target, setTarget] = useState<DiscountRuleItem['target']>('ALL_PRODUCTS')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [productItems, setProductItems] = useState<Array<{ id: string; label: string }>>([])
  const [variantItems, setVariantItems] = useState<Array<{ id: string; label: string }>>([])
  const [excludeProducts, setExcludeProducts] = useState<Array<{ id: string; label: string }>>([])
  const [excludeVariants, setExcludeVariants] = useState<Array<{ id: string; label: string }>>([])
  const [excludeCategoryIds, setExcludeCategoryIds] = useState<string[]>([])
  const [minCartSubtotal, setMinCartSubtotal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [onlyForRoles, setOnlyForRoles] = useState<string[]>([])
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [userIds, setUserIds] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<DiscountRuleItem['users']>([])
  const [eligibleAudiences, setEligibleAudiences] = useState<PromoEligibleAudience[]>(['RETAIL'])
  const [buyerRegistrationScope, setBuyerRegistrationScope] =
    useState<BuyerRegistrationScope>('ANY')
  const [tiers, setTiers] = useState<QuantityTierDraft[]>([])
  const [attributeGroups, setAttributeGroups] = useState<AttrGroupDraft[]>([])
  const [characteristicGroups, setCharacteristicGroups] = useState<CharGroupDraft[]>([])
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<DiscountFormFieldErrors>({})
  const [baseline, setBaseline] = useState<string | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [previewQty, setPreviewQty] = useState('1')
  const [previewAudience, setPreviewAudience] = useState<PromoEligibleAudience>('RETAIL')
  const [previewRegistration, setPreviewRegistration] = useState<'GUEST' | 'REGISTERED'>('GUEST')
  const [previewVariant, setPreviewVariant] = useState<Array<{ id: string; label: string }>>([])
  const [previewUserIds, setPreviewUserIds] = useState<string[]>([])
  const [previewUsers, setPreviewUsers] = useState<
    Array<{
      id: string
      firstName: string | null
      lastName: string | null
      phone: string | null
      email: string | null
    }>
  >([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewResult, setPreviewResult] = useState<DiscountRulePreviewResult | null>(null)

  const formSnapshot = useMemo(
    () => ({
      name,
      combinesWithOtherDiscounts,
      target,
      categoryIds,
      productItems,
      variantItems,
      excludeProducts,
      excludeVariants,
      excludeCategoryIds,
      minCartSubtotal,
      startDate,
      endDate,
      onlyForRoles,
      groupIds,
      userIds,
      eligibleAudiences,
      buyerRegistrationScope,
      tiers,
      attributeGroups,
      characteristicGroups,
      isActive,
    }),
    [
      name,
      combinesWithOtherDiscounts,
      target,
      categoryIds,
      productItems,
      variantItems,
      excludeProducts,
      excludeVariants,
      excludeCategoryIds,
      minCartSubtotal,
      startDate,
      endDate,
      onlyForRoles,
      groupIds,
      userIds,
      eligibleAudiences,
      buyerRegistrationScope,
      tiers,
      attributeGroups,
      characteristicGroups,
      isActive,
    ],
  )

  const dirty = isFormDirty(baseline, formSnapshot)

  useEffect(() => {
    const nextName =
      item?.name ??
      (lockedVariant ? t('defaultVariantRuleName', { label: lockedVariant.label }) : '')
    const nextCombines = item?.combinesWithOtherDiscounts ?? 'BEST_PRICE'
    const nextTarget = lockedVariant ? 'VARIANT' : (item?.target ?? 'ALL_PRODUCTS')
    const nextCategoryIds = item?.target === 'CATEGORY' ? item.targetIds : []
    const nextProductItems =
      item?.target === 'PRODUCT'
        ? item.targetIds.map((id) => ({
            id,
            label: item.targetLabels?.[id] ?? id.slice(0, 8),
          }))
        : []
    const nextVariantItems = lockedVariant
      ? [lockedVariant]
      : item?.target === 'VARIANT'
        ? item.targetIds.map((id) => ({
            id,
            label: item.targetLabels?.[id] ?? id.slice(0, 8),
          }))
        : []
    const nextExcludeProducts = (item?.excludeProductIds ?? []).map((id) => ({
      id,
      label: item?.excludeLabels?.[id] ?? id.slice(0, 8),
    }))
    const nextExcludeVariants = (item?.excludeVariantIds ?? []).map((id) => ({
      id,
      label: item?.excludeLabels?.[id] ?? id.slice(0, 8),
    }))
    const nextExcludeCategoryIds = item?.excludeCategoryIds ?? []
    const nextMinCart = item?.minCartSubtotal ? String(item.minCartSubtotal) : ''
    const nextStartDate = item?.startDate ? item.startDate.slice(0, 10) : ''
    const nextEndDate = item?.endDate ? item.endDate.slice(0, 10) : ''
    const nextOnlyForRoles = item?.onlyForRoles ?? []
    const nextGroupIds = item?.groupIds ?? []
    const nextUserIds = item?.userIds ?? []
    const nextEligibleAudiences: PromoEligibleAudience[] = item?.eligibleAudiences?.length
      ? item.eligibleAudiences
      : ['RETAIL']
    const nextBuyerRegistrationScope = item?.buyerRegistrationScope ?? 'ANY'
    const nextTiers = tiersFromRule(item?.quantityTiers)
    const filters = filtersFromCriteria(item?.filterCriteria)
    const nextAttributeGroups = filters.attributeGroups
    const nextCharacteristicGroups = filters.characteristicGroups
    const nextIsActive = item?.isActive ?? true

    setName(nextName)
    setCombinesWithOtherDiscounts(nextCombines)
    setTarget(nextTarget)
    setCategoryIds(nextCategoryIds)
    setProductItems(nextProductItems)
    setVariantItems(nextVariantItems)
    setExcludeProducts(nextExcludeProducts)
    setExcludeVariants(nextExcludeVariants)
    setExcludeCategoryIds(nextExcludeCategoryIds)
    setMinCartSubtotal(nextMinCart)
    setStartDate(nextStartDate)
    setEndDate(nextEndDate)
    setOnlyForRoles(nextOnlyForRoles)
    setGroupIds(nextGroupIds)
    setUserIds(nextUserIds)
    setSelectedUsers(item?.users ?? [])
    setEligibleAudiences(nextEligibleAudiences)
    setBuyerRegistrationScope(nextBuyerRegistrationScope)
    setTiers(nextTiers)
    setAttributeGroups(nextAttributeGroups)
    setCharacteristicGroups(nextCharacteristicGroups)
    setIsActive(nextIsActive)
    setFieldErrors({})
    setPreviewResult(null)
    setPreviewVariant(lockedVariant ? [lockedVariant] : [])
    setPreviewQty('1')
    setPreviewAudience('RETAIL')
    setPreviewRegistration('GUEST')
    setPreviewUserIds([])
    setPreviewUsers([])

    setBaseline(
      stableStringify({
        name: nextName,
        combinesWithOtherDiscounts: nextCombines,
        target: nextTarget,
        categoryIds: nextCategoryIds,
        productItems: nextProductItems,
        variantItems: nextVariantItems,
        excludeProducts: nextExcludeProducts,
        excludeVariants: nextExcludeVariants,
        excludeCategoryIds: nextExcludeCategoryIds,
        minCartSubtotal: nextMinCart,
        startDate: nextStartDate,
        endDate: nextEndDate,
        onlyForRoles: nextOnlyForRoles,
        groupIds: nextGroupIds,
        userIds: nextUserIds,
        eligibleAudiences: nextEligibleAudiences,
        buyerRegistrationScope: nextBuyerRegistrationScope,
        tiers: nextTiers,
        attributeGroups: nextAttributeGroups,
        characteristicGroups: nextCharacteristicGroups,
        isActive: nextIsActive,
      }),
    )
    // Intentionally omit `t` — next-intl function identity can churn and reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lockedVariant fields, not object identity
  }, [item, lockedVariant?.id, lockedVariant?.label])

  useEffect(() => {
    setCategoriesLoading(true)
    fetchCategoryTree(contentLocale, { edit: false })
      .then((tree) => setCategoryOptions(flattenCategoryTreeForPicker(tree)))
      .catch(() => setCategoryOptions([]))
      .finally(() => setCategoriesLoading(false))
  }, [contentLocale])

  useEffect(() => {
    if (!categoryOptions.length) return
    setCategoryIds((prev) => {
      const next = pruneRedundantCategoryIds(prev, categoryOptions)
      return sameIdList(prev, next) ? prev : next
    })
    setExcludeCategoryIds((prev) => {
      const next = pruneRedundantCategoryIds(prev, categoryOptions)
      return sameIdList(prev, next) ? prev : next
    })
  }, [item, categoryOptions])

  const makeDraftPayload = () => {
    return buildDraftPayload({
      name,
      target,
      categoryIds,
      categoryOptions,
      productItems,
      variantItems,
      excludeProducts,
      excludeVariants,
      excludeCategoryIds,
      eligibleAudiences,
      buyerRegistrationScope,
      filterCriteria: filtersToPayload(attributeGroups, characteristicGroups),
      quantityTiers: tiersToPayload(tiers),
      combinesWithOtherDiscounts,
      onlyForRoles,
      groupIds,
      allowedUserIds: userIds,
      minCartSubtotal,
      startDate,
      endDate,
      isActive,
    })
  }

  const navigateBack = () => {
    router.push(returnTo)
  }

  const requestClose = () => {
    if (saving) return
    if (dirty) setDiscardOpen(true)
    else navigateBack()
  }

  const handleSave = async () => {
    if (saving) return
    const quantityTiers = tiersToPayload(tiers)

    const errors = validateDiscountRuleDraft({
      name,
      quantityTiers,
      target,
      categoryIds,
      productItems,
      variantItems,
      eligibleAudiences,
      buyerRegistrationScope,
      userIds,
    })
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    setSaving(true)
    try {
      await saveDiscountRule(makeDraftPayload(), item?.id)
      toast.success(item ? t('updated') : t('created'))
      setBaseline(stableStringify(formSnapshot))
      navigateBack()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    const variantId = previewVariant[0]?.id ?? lockedVariant?.id
    if (!variantId) {
      toast.error(t('errPreviewVariant'))
      return
    }
    setPreviewLoading(true)
    try {
      const result = await previewDiscountRule({
        productVariantId: variantId,
        quantity: Math.max(1, Number(previewQty) || 1),
        audience: previewAudience,
        registrationPreview:
          previewAudience === 'WHOLESALER' ? 'REGISTERED' : previewRegistration,
        previewUserId:
          previewAudience === 'WHOLESALER' ? previewUserIds[0] : undefined,
        draftRule: makeDraftPayload(),
      })
      setPreviewResult(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('previewError'))
    } finally {
      setPreviewLoading(false)
    }
  }

  const fieldError = (key: keyof DiscountFormFieldErrors) =>
    resolveFieldErrorMessage(fieldErrors[key], t, tElig)

  return (
    <>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-8">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3">
          <div className="min-w-0 space-y-1">
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={requestClose}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {t('backToList')}
            </Button>
            <h1 className="text-xl font-semibold tracking-tight">
              {item ? t('editTitle') : t('createTitle')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('pageDescription')}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={requestClose}>
              {t('cancel')}
            </Button>
            <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('save')}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 sm:px-5">
            <Accordion type="multiple" defaultValue={[...DEFAULT_OPEN_SECTIONS]} className="w-full">
              <AccordionItem value="main" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionMain')}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3 pt-0">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('name')}</Label>
                    <Input
                      className="h-8 text-sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    {fieldErrors.name ? (
                      <p className="text-xs text-destructive">{fieldError('name')}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                    <Label className="text-sm">{t('active')}</Label>
                  </div>
                  {fieldErrors.value ? (
                    <p className="text-xs text-destructive">{fieldError('value')}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">{t('mainTiersPointer')}</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="audience" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionAudience')}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3 pt-0">
                  <p className="text-xs text-muted-foreground">{tElig('commercialOfferHint')}</p>
                  <Select
                    value={audiencesToOffer(eligibleAudiences)}
                    onValueChange={(v) => setEligibleAudiences(offerToAudiences(v as CommercialOffer))}
                  >
                    <SelectTrigger className="h-9 w-full bg-background text-sm shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[80]">
                      <SelectItem value="RETAIL">{tElig('offerRetail')}</SelectItem>
                      <SelectItem value="WHOLESALER">{tElig('offerWholesale')}</SelectItem>
                      <SelectItem value="BOTH">{tElig('offerBoth')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.audience ? (
                    <p className="text-xs text-destructive">{fieldError('audience')}</p>
                  ) : null}
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs">{tElig('registrationTitle')}</Label>
                    <p className="text-xs text-muted-foreground">{tElig('registrationHint')}</p>
                    <Select
                      value={buyerRegistrationScope}
                      onValueChange={(v) => setBuyerRegistrationScope(v as BuyerRegistrationScope)}
                    >
                      <SelectTrigger className="h-9 w-full bg-background text-sm shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[80]">
                        <SelectItem value="ANY">{tElig('registrationAny')}</SelectItem>
                        <SelectItem value="GUEST_ONLY">{tElig('registrationGuest')}</SelectItem>
                        <SelectItem value="REGISTERED_ONLY">
                          {tElig('registrationSignedIn')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors.registration ? (
                      <p className="text-xs text-destructive">{fieldError('registration')}</p>
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="scope" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionScope')}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3 pt-0">
                  {!lockedVariant ? (
                    <div className="space-y-1">
                      <Label className="text-xs">{t('scopeType')}</Label>
                      <Select
                        value={target}
                        onValueChange={(v) => setTarget(v as DiscountRuleItem['target'])}
                      >
                        <SelectTrigger className="h-9 w-full bg-background text-sm shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper" className="z-[80]">
                          <SelectItem value="ALL_PRODUCTS">{t('scopeAll')}</SelectItem>
                          <SelectItem value="CATEGORY">{t('scopeCategory')}</SelectItem>
                          <SelectItem value="PRODUCT">{t('scopeProduct')}</SelectItem>
                          <SelectItem value="VARIANT">{t('scopeVariant')}</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldErrors.target ? (
                        <p className="text-xs text-destructive">{fieldError('target')}</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t('lockedVariantHint', { label: lockedVariant.label })}
                    </p>
                  )}
                  {target === 'CATEGORY' ? (
                    <PromoMultiCategoryPicker
                      options={categoryOptions}
                      selectedIds={categoryIds}
                      onChange={setCategoryIds}
                      loading={categoriesLoading}
                    />
                  ) : null}
                  {target === 'PRODUCT' ? (
                    <PromoProductVariantPicker
                      mode="products"
                      label={t('products')}
                      selected={productItems}
                      onChange={setProductItems}
                      categoryOptions={categoryOptions}
                      selectionLayout="list"
                    />
                  ) : null}
                  {target === 'VARIANT' && !lockedVariant ? (
                    <PromoProductVariantPicker
                      mode="variants"
                      label={t('variants')}
                      selected={variantItems}
                      onChange={setVariantItems}
                      categoryOptions={categoryOptions}
                      selectionLayout="list"
                    />
                  ) : null}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="exclusions" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionExclusions')}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3 pt-0">
                  <p className="text-xs text-muted-foreground">{t('exclusionsHint')}</p>
                  <PromoMultiCategoryPicker
                    options={categoryOptions}
                    selectedIds={excludeCategoryIds}
                    onChange={setExcludeCategoryIds}
                    loading={categoriesLoading}
                    label={t('excludeCategories')}
                  />
                  <div className="grid gap-3 lg:grid-cols-2">
                    <PromoProductVariantPicker
                      mode="products"
                      label={t('excludeProducts')}
                      selected={excludeProducts}
                      onChange={setExcludeProducts}
                      categoryOptions={categoryOptions}
                      selectionLayout="list"
                    />
                    <PromoProductVariantPicker
                      mode="variants"
                      label={t('excludeVariants')}
                      selected={excludeVariants}
                      onChange={setExcludeVariants}
                      categoryOptions={categoryOptions}
                      selectionLayout="list"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tiers" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionTiers')}
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-0">
                  <DiscountRuleQuantityTiersEditor tiers={tiers} onChange={setTiers} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="conditions" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionConditions')}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3 pt-0">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('minCart')}</Label>
                      <Input
                        type="number"
                        className="h-8 text-sm"
                        value={minCartSubtotal}
                        onChange={(e) => setMinCartSubtotal(e.target.value)}
                        placeholder="—"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('validFrom')}</Label>
                      <Input
                        type="date"
                        className="h-8 text-sm"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('validTo')}</Label>
                      <Input
                        type="date"
                        className="h-8 text-sm"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                    <Label className="text-xs font-medium">{t('combination')}</Label>
                    <Select
                      value={combinesWithOtherDiscounts}
                      onValueChange={(v) =>
                        setCombinesWithOtherDiscounts(v as 'BEST_PRICE' | 'STACK' | 'MAX_OF')
                      }
                    >
                      <SelectTrigger className="h-8 w-full bg-background text-sm shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[80]">
                        <SelectItem value="BEST_PRICE">{t('combinationBestPrice')}</SelectItem>
                        <SelectItem value="STACK">{t('combinationStack')}</SelectItem>
                        <SelectItem value="MAX_OF">{t('combinationMaxOf')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {t(`combinationHint_${combinesWithOtherDiscounts}`)}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="preview" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionPreview')}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3 pt-0">
                  <p className="text-xs text-muted-foreground">{t('previewHint')}</p>
                  {!lockedVariant ? (
                    <PromoProductVariantPicker
                      mode="variants"
                      label={t('previewVariant')}
                      selected={previewVariant}
                      onChange={(rows) => setPreviewVariant(rows.slice(0, 1))}
                      categoryOptions={categoryOptions}
                    />
                  ) : null}
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('previewQty')}</Label>
                      <Input
                        type="number"
                        min={1}
                        className="h-8 text-sm"
                        value={previewQty}
                        onChange={(e) => setPreviewQty(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('previewAudience')}</Label>
                      <Select
                        value={previewAudience}
                        onValueChange={(v) => {
                          const next = v as PromoEligibleAudience
                          setPreviewAudience(next)
                          if (next === 'WHOLESALER') {
                            setPreviewRegistration('REGISTERED')
                          } else {
                            setPreviewUserIds([])
                            setPreviewUsers([])
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper" className="z-[80]">
                          <SelectItem value="RETAIL">{tElig('offerRetail')}</SelectItem>
                          <SelectItem value="WHOLESALER">{tElig('offerWholesale')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{tElig('previewRegistration')}</Label>
                      <Select
                        value={previewRegistration}
                        disabled={previewAudience === 'WHOLESALER'}
                        onValueChange={(v) => setPreviewRegistration(v as 'GUEST' | 'REGISTERED')}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper" className="z-[80]">
                          <SelectItem value="GUEST">{tElig('registrationGuest')}</SelectItem>
                          <SelectItem value="REGISTERED">{tElig('registrationSignedIn')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 w-full"
                        disabled={previewLoading}
                        onClick={() => void handlePreview()}
                      >
                        {previewLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t('runPreview')}
                      </Button>
                    </div>
                  </div>
                  {previewAudience === 'WHOLESALER' ? (
                    <div className="space-y-1">
                      <PromoUserPicker
                        label={t('previewWholesalerClient')}
                        roleFilter="WHOLESALER"
                        maxSelected={1}
                        selectedIds={previewUserIds}
                        selectedUsers={previewUsers}
                        onChange={(ids, users) => {
                          setPreviewUserIds(ids.slice(0, 1))
                          setPreviewUsers(users.slice(0, 1))
                        }}
                      />
                      {!previewUserIds[0] ? (
                        <p className="text-xs text-muted-foreground">{t('previewNoCompanyHint')}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {previewResult ? (
                    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
                      <p className="font-medium">
                        {t('previewCustomerSees', {
                          price: String(previewResult.finalUnitPrice),
                          qty: String(Math.max(1, Number(previewQty) || 1)),
                        })}
                      </p>
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer select-none text-foreground/80">
                          {t('previewShowCalc')}
                        </summary>
                        <div className="mt-2 space-y-1.5">
                          <p>
                            <span className="text-muted-foreground">{t('previewBase')}: </span>
                            {previewResult.productCardUnitPrice ?? '—'}
                          </p>
                          {previewResult.salesPrice ? (
                            <p>
                              <span className="text-muted-foreground">{t('previewSales')}: </span>
                              {previewResult.salesPrice.unitPrice} ({previewResult.salesPrice.scope}
                              {previewResult.companyPriceExact
                                ? ''
                                : ` · ${t('previewNotCompanyExact')}`}
                              )
                            </p>
                          ) : null}
                          {previewResult.retailOffer ? (
                            <p>
                              <span className="text-muted-foreground">{t('previewRetailOffer')}: </span>
                              {previewResult.retailOffer.unitPrice}
                            </p>
                          ) : null}
                          {previewResult.wholesaleOffer ? (
                            <p>
                              <span className="text-muted-foreground">
                                {t('previewWholesaleOffer')}:{' '}
                              </span>
                              {previewResult.wholesaleOffer.unitPrice}
                            </p>
                          ) : null}
                          <p>
                            {t('previewFinal')}: {previewResult.finalUnitPrice} ({previewResult.winner})
                          </p>
                          {previewResult.candidateRules.length ? (
                            <ul className="list-inside list-disc">
                              {previewResult.candidateRules.map((rule) => (
                                <li key={`${rule.side}-${rule.id}`}>
                                  {rule.name}: {rule.unitPrice} ({rule.side})
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>{t('previewNoCandidates')}</p>
                          )}
                        </div>
                      </details>
                    </div>
                  ) : null}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="advanced" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionAdvanced')}
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-3 pt-0">
                  <DiscountRuleFiltersEditor
                    attributeGroups={attributeGroups}
                    characteristicGroups={characteristicGroups}
                    onAttributeGroupsChange={setAttributeGroups}
                    onCharacteristicGroupsChange={setCharacteristicGroups}
                  />
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('onlyForRoles')}</Label>
                    <p className="text-xs text-muted-foreground">{t('onlyForRolesHint')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          { id: 'USER', label: t('roleUser') },
                          { id: 'WHOLESALER', label: t('roleWholesaler') },
                        ] as const
                      ).map((row) => (
                        <Button
                          key={row.id}
                          type="button"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          variant={onlyForRoles.includes(row.id) ? 'default' : 'outline'}
                          onClick={() =>
                            setOnlyForRoles((prev) =>
                              prev.includes(row.id)
                                ? prev.filter((r) => r !== row.id)
                                : [...prev, row.id],
                            )
                          }
                        >
                          {row.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <PromoUserPicker
                    selectedIds={userIds}
                    selectedUsers={selectedUsers}
                    onChange={(ids, users) => {
                      setUserIds(ids)
                      setSelectedUsers(users)
                    }}
                  />
                  {userIds.length === 0 ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('customerGroups')}</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {groups.map((group) => (
                          <Button
                            key={group.id}
                            type="button"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            variant={groupIds.includes(group.id) ? 'default' : 'outline'}
                            onClick={() =>
                              setGroupIds((prev) =>
                                prev.includes(group.id)
                                  ? prev.filter((v) => v !== group.id)
                                  : [...prev, group.id],
                              )
                            }
                          >
                            {group.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t('usersOverrideGroups')}</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

        </div>

        <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
          <Button type="button" variant="outline" size="sm" onClick={requestClose}>
            {t('cancel')}
          </Button>
          <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('save')}
          </Button>
        </div>
      </div>

      <PromotionsUnsavedGuard
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        onDiscard={() => {
          setDiscardOpen(false)
          navigateBack()
        }}
      />
    </>
  )
}
