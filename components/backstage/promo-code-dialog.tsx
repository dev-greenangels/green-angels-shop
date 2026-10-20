'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import type { CategoryOption } from '@/components/backstage/category-combobox'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea'
import { fetchCategoryTree } from '@/lib/backstage/categories'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import {
  hasFieldErrors,
  validatePromoCodeDraft,
  type PromoFormFieldErrors,
} from '@/lib/backstage/promotions-form'
import { isFormDirty, stableStringify } from '@/lib/backstage/promotions-list'
import {
  buildScopePayload,
  flattenCategoryTreeForPicker,
  pruneRedundantCategoryIds,
} from '@/lib/backstage/promo-scope-selection'
import {
  savePromoCode,
  type BuyerRegistrationScope,
  type PromoApplicationScope,
  type PromoCodeItem,
  type PromoEligibleAudience,
  type PromoEligiblePriceSource,
} from '@/lib/backstage/pricing'

const DEFAULT_AUDIENCES: PromoEligibleAudience[] = ['RETAIL', 'WHOLESALER']
const DEFAULT_SOURCES: PromoEligiblePriceSource[] = ['ALL', 'GROUP', 'COMPANY']
const DEFAULT_APP_SCOPE: PromoApplicationScope = 'PRODUCTS'

const DEFAULT_OPEN_SECTIONS = ['main', 'benefit', 'audience', 'targeting'] as const

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
  t: ReturnType<typeof useTranslations<'promoCodes'>>,
  tElig: ReturnType<typeof useTranslations<'promoEligibility'>>,
): string | null {
  if (!errorKey) return null
  if (
    errorKey === 'needOneAudience' ||
    errorKey === 'needOneSource' ||
    errorKey === 'errGuestOnlyNeedsRetail' ||
    errorKey === 'errGuestOnlyNoAllowlist'
  ) {
    return tElig(errorKey)
  }
  return t(errorKey as Parameters<typeof t>[0])
}

export function PromoCodeDialog({
  open,
  item,
  groups,
  allPromoCodes = [],
  onClose,
  onSaved,
}: {
  open: boolean
  item: PromoCodeItem | null
  groups: Array<{ id: string; name: string }>
  allPromoCodes?: PromoCodeItem[]
  onClose: () => void
  onSaved: () => void
}) {
  const { locale: contentLocale } = useBackstageContentLocale()
  const t = useTranslations('promoCodes')
  const tElig = useTranslations('promoEligibility')
  const tScope = useTranslations('discountRules')

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [eligibleAudiences, setEligibleAudiences] =
    useState<PromoEligibleAudience[]>(DEFAULT_AUDIENCES)
  const [buyerRegistrationScope, setBuyerRegistrationScope] =
    useState<BuyerRegistrationScope>('ANY')
  const [eligiblePriceSources, setEligiblePriceSources] =
    useState<PromoEligiblePriceSource[]>(DEFAULT_SOURCES)
  const [discountEnabled, setDiscountEnabled] = useState(true)
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT')
  const [applicationScope, setApplicationScope] =
    useState<PromoApplicationScope>(DEFAULT_APP_SCOPE)
  const [combinesWithOtherDiscounts, setCombinesWithOtherDiscounts] = useState<
    'STACK' | 'BEST_PRICE'
  >('BEST_PRICE')
  const [stackingMode, setStackingMode] = useState<'NONE' | 'ALL' | 'ALLOWLIST' | 'DENYLIST'>(
    'NONE',
  )
  const [compatiblePromoCodeIds, setCompatiblePromoCodeIds] = useState<string[]>([])
  const [value, setValue] = useState('5')
  const [giftEnabled, setGiftEnabled] = useState(false)
  const [giftVariant, setGiftVariant] = useState<Array<{ id: string; label: string }>>([])
  const [giftQuantity, setGiftQuantity] = useState('1')
  const [target, setTarget] = useState<PromoCodeItem['target']>('ALL_PRODUCTS')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [productItems, setProductItems] = useState<Array<{ id: string; label: string }>>([])
  const [variantItems, setVariantItems] = useState<Array<{ id: string; label: string }>>([])
  const [excludeProducts, setExcludeProducts] = useState<Array<{ id: string; label: string }>>([])
  const [excludeVariants, setExcludeVariants] = useState<Array<{ id: string; label: string }>>([])
  const [excludeCategoryIds, setExcludeCategoryIds] = useState<string[]>([])
  const [minCartSubtotal, setMinCartSubtotal] = useState('')
  const [usageLimitTotal, setUsageLimitTotal] = useState('')
  const [usageLimitPerUser, setUsageLimitPerUser] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [userIds, setUserIds] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<PromoCodeItem['users']>([])
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<PromoFormFieldErrors>({})
  const [baseline, setBaseline] = useState<string | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  const formSnapshot = useMemo(
    () => ({
      code,
      name,
      description,
      eligibleAudiences,
      buyerRegistrationScope,
      eligiblePriceSources,
      discountEnabled,
      discountType,
      applicationScope,
      combinesWithOtherDiscounts,
      stackingMode,
      compatiblePromoCodeIds,
      value,
      giftEnabled,
      giftVariant,
      giftQuantity,
      target,
      categoryIds,
      productItems,
      variantItems,
      excludeProducts,
      excludeVariants,
      excludeCategoryIds,
      minCartSubtotal,
      usageLimitTotal,
      usageLimitPerUser,
      validFrom,
      validTo,
      groupIds,
      userIds,
      isActive,
    }),
    [
      code,
      name,
      description,
      eligibleAudiences,
      buyerRegistrationScope,
      eligiblePriceSources,
      discountEnabled,
      discountType,
      applicationScope,
      combinesWithOtherDiscounts,
      stackingMode,
      compatiblePromoCodeIds,
      value,
      giftEnabled,
      giftVariant,
      giftQuantity,
      target,
      categoryIds,
      productItems,
      variantItems,
      excludeProducts,
      excludeVariants,
      excludeCategoryIds,
      minCartSubtotal,
      usageLimitTotal,
      usageLimitPerUser,
      validFrom,
      validTo,
      groupIds,
      userIds,
      isActive,
    ],
  )

  const dirty = isFormDirty(baseline, formSnapshot)

  const otherActivePromos = useMemo(
    () =>
      allPromoCodes.filter(
        (promo) => promo.isActive && promo.id !== item?.id,
      ),
    [allPromoCodes, item?.id],
  )

  useEffect(() => {
    if (!open) return
    const nextCode = item?.code ?? ''
    const nextName = item?.name ?? ''
    const nextDescription = item?.description ?? ''
    const nextEligibleAudiences = item?.eligibleAudiences?.length
      ? item.eligibleAudiences
      : DEFAULT_AUDIENCES
    const nextBuyerRegistrationScope = item?.buyerRegistrationScope ?? 'ANY'
    const nextEligiblePriceSources = item?.eligiblePriceSources?.length
      ? item.eligiblePriceSources
      : DEFAULT_SOURCES
    const nextDiscountEnabled = item ? item.discountType != null : true
    const nextDiscountType = item?.discountType === 'FIXED' ? 'FIXED' : 'PERCENT'
    const nextApplicationScope =
      item?.applicationScope === 'PRODUCTS_AND_SHIPPING' ||
      item?.applicationScope === 'SHIPPING_ONLY'
        ? item.applicationScope
        : 'PRODUCTS'
    const nextCombines = item?.combinesWithOtherDiscounts ?? 'BEST_PRICE'
    const nextStackingMode = item?.stackingMode ?? 'NONE'
    const nextCompatible = item?.compatiblePromoCodeIds ?? []
    const nextValue = item?.value != null ? String(item.value) : '5'
    const nextGiftEnabled = Boolean(item?.giftVariantId)
    const nextGiftVariant = item?.giftVariantId
      ? [
          {
            id: item.giftVariantId,
            label: item.giftVariantLabel ?? item.giftVariantId.slice(0, 8),
          },
        ]
      : []
    const nextGiftQuantity = item?.giftQuantity ? String(item.giftQuantity) : '1'
    const nextTarget = item?.target ?? 'ALL_PRODUCTS'
    const nextCategoryIds = item?.target === 'CATEGORY' ? item.targetIds : []
    const nextProductItems =
      item?.target === 'PRODUCT'
        ? item.targetIds.map((id) => ({
            id,
            label: item.targetLabels?.[id] ?? id.slice(0, 8),
          }))
        : []
    const nextVariantItems =
      item?.target === 'VARIANT'
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
    const nextUsageTotal = item?.usageLimitTotal ? String(item.usageLimitTotal) : ''
    const nextUsagePerUser = item?.usageLimitPerUser ? String(item.usageLimitPerUser) : ''
    const nextValidFrom = item?.validFrom ? item.validFrom.slice(0, 10) : ''
    const nextValidTo = item?.validTo ? item.validTo.slice(0, 10) : ''
    const nextGroupIds = item?.groupIds ?? []
    const nextUserIds = item?.userIds ?? []
    const nextIsActive = item?.isActive ?? true

    setCode(nextCode)
    setName(nextName)
    setDescription(nextDescription)
    setEligibleAudiences(nextEligibleAudiences)
    setBuyerRegistrationScope(nextBuyerRegistrationScope)
    setEligiblePriceSources(nextEligiblePriceSources)
    setDiscountEnabled(nextDiscountEnabled)
    setDiscountType(nextDiscountType)
    setApplicationScope(nextApplicationScope)
    setCombinesWithOtherDiscounts(nextCombines)
    setStackingMode(nextStackingMode)
    setCompatiblePromoCodeIds(nextCompatible)
    setValue(nextValue)
    setGiftEnabled(nextGiftEnabled)
    setGiftVariant(nextGiftVariant)
    setGiftQuantity(nextGiftQuantity)
    setTarget(nextTarget)
    setCategoryIds(nextCategoryIds)
    setProductItems(nextProductItems)
    setVariantItems(nextVariantItems)
    setExcludeProducts(nextExcludeProducts)
    setExcludeVariants(nextExcludeVariants)
    setExcludeCategoryIds(nextExcludeCategoryIds)
    setMinCartSubtotal(nextMinCart)
    setUsageLimitTotal(nextUsageTotal)
    setUsageLimitPerUser(nextUsagePerUser)
    setValidFrom(nextValidFrom)
    setValidTo(nextValidTo)
    setGroupIds(nextGroupIds)
    setUserIds(nextUserIds)
    setSelectedUsers(item?.users ?? [])
    setIsActive(nextIsActive)
    setFieldErrors({})

    setBaseline(
      stableStringify({
        code: nextCode,
        name: nextName,
        description: nextDescription,
        eligibleAudiences: nextEligibleAudiences,
        buyerRegistrationScope: nextBuyerRegistrationScope,
        eligiblePriceSources: nextEligiblePriceSources,
        discountEnabled: nextDiscountEnabled,
        discountType: nextDiscountType,
        applicationScope: nextApplicationScope,
        combinesWithOtherDiscounts: nextCombines,
        stackingMode: nextStackingMode,
        compatiblePromoCodeIds: nextCompatible,
        value: nextValue,
        giftEnabled: nextGiftEnabled,
        giftVariant: nextGiftVariant,
        giftQuantity: nextGiftQuantity,
        target: nextTarget,
        categoryIds: nextCategoryIds,
        productItems: nextProductItems,
        variantItems: nextVariantItems,
        excludeProducts: nextExcludeProducts,
        excludeVariants: nextExcludeVariants,
        excludeCategoryIds: nextExcludeCategoryIds,
        minCartSubtotal: nextMinCart,
        usageLimitTotal: nextUsageTotal,
        usageLimitPerUser: nextUsagePerUser,
        validFrom: nextValidFrom,
        validTo: nextValidTo,
        groupIds: nextGroupIds,
        userIds: nextUserIds,
        isActive: nextIsActive,
      }),
    )
  }, [open, item])

  useEffect(() => {
    if (!open) return
    setCategoriesLoading(true)
    fetchCategoryTree(contentLocale, { edit: false })
      .then((tree) => setCategoryOptions(flattenCategoryTreeForPicker(tree)))
      .catch(() => setCategoryOptions([]))
      .finally(() => setCategoriesLoading(false))
  }, [open, contentLocale])

  useEffect(() => {
    if (!open || !categoryOptions.length) return
    setCategoryIds((prev) => {
      const next = pruneRedundantCategoryIds(prev, categoryOptions)
      return sameIdList(prev, next) ? prev : next
    })
    setExcludeCategoryIds((prev) => {
      const next = pruneRedundantCategoryIds(prev, categoryOptions)
      return sameIdList(prev, next) ? prev : next
    })
  }, [open, item, categoryOptions])

  const toggleGroup = (id: string) => {
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  const resolveScopePayload = () =>
    buildScopePayload({
      target,
      categoryIds,
      categoryOptions,
      productItems,
      variantItems,
      excludeCategoryIds,
      excludeProducts,
      excludeVariants,
    })

  const requestClose = () => {
    if (saving) return
    if (dirty) setDiscardOpen(true)
    else onClose()
  }

  const handleSave = async () => {
    if (saving) return

    const errors = validatePromoCodeDraft({
      code,
      name,
      discountEnabled,
      giftEnabled,
      value,
      giftVariantCount: giftVariant.length,
      stackingMode,
      compatiblePromoCodeIds,
      target,
      categoryIds,
      productItems,
      variantItems,
      eligibleAudiences,
      eligiblePriceSources,
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
      await savePromoCode(
        {
          code,
          name,
          description: description || undefined,
          discountType: discountEnabled ? discountType : undefined,
          value: discountEnabled ? Number(value) : undefined,
          applicationScope: discountEnabled ? applicationScope : undefined,
          combinesWithOtherDiscounts: discountEnabled ? combinesWithOtherDiscounts : undefined,
          stackingMode,
          compatiblePromoCodeIds:
            stackingMode === 'ALLOWLIST' || stackingMode === 'DENYLIST'
              ? compatiblePromoCodeIds
              : [],
          giftVariantId: giftEnabled ? giftVariant[0]?.id : undefined,
          giftQuantity: giftEnabled ? Number(giftQuantity) || 1 : undefined,
          target,
          ...(() => {
            const scope = resolveScopePayload()
            return {
              targetIds: scope.targetIds,
              excludeProductIds: scope.excludeProductIds,
              excludeVariantIds: scope.excludeVariantIds,
              excludeCategoryIds: scope.excludeCategoryIds,
            }
          })(),
          eligibleAudiences,
          buyerRegistrationScope,
          eligiblePriceSources,
          minCartSubtotal: minCartSubtotal ? Number(minCartSubtotal) : undefined,
          usageLimitTotal: usageLimitTotal ? Number(usageLimitTotal) : undefined,
          usageLimitPerUser: usageLimitPerUser ? Number(usageLimitPerUser) : undefined,
          validFrom: validFrom ? new Date(validFrom).toISOString() : undefined,
          validTo: validTo ? new Date(validTo).toISOString() : undefined,
          groupIds: userIds.length > 0 ? [] : groupIds,
          userIds,
          isActive,
        },
        item?.id,
      )
      toast.success(item ? t('updated') : t('created'))
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  const fieldError = (key: keyof PromoFormFieldErrors) =>
    resolveFieldErrorMessage(fieldErrors[key], t, tElig)

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && requestClose()}>
        <DialogContent
          className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="text-base">
              {item ? t('editTitle') : t('createTitle')}
            </DialogTitle>
            <DialogDescription className="sr-only">{t('dialogDescription')}</DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(92vh-7rem)] overflow-y-auto px-4 py-3">
            <Accordion type="multiple" defaultValue={[...DEFAULT_OPEN_SECTIONS]} className="w-full">
              <AccordionItem value="main" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionMain')}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3 pt-0">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('code')}</Label>
                      <Input
                        className="h-8 text-sm"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                      />
                      {fieldErrors.code ? (
                        <p className="text-xs text-destructive">{fieldError('code')}</p>
                      ) : null}
                    </div>
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
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('description')}</Label>
                    <Textarea
                      className="min-h-[52px] text-sm"
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                    <Label className="text-sm">{t('active')}</Label>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="benefit" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionBenefit')}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3 pt-0">
                  {fieldErrors.benefit ? (
                    <p className="text-xs text-destructive">{fieldError('benefit')}</p>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('applyDiscount')}</Label>
                    <Switch checked={discountEnabled} onCheckedChange={setDiscountEnabled} />
                  </div>
                  {discountEnabled ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={discountType}
                          onValueChange={(v) => setDiscountType(v as 'PERCENT' | 'FIXED')}
                        >
                          <SelectTrigger className="h-8 w-full text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper" className="z-[80]">
                            <SelectItem value="PERCENT">{tElig('discountTypePercent')}</SelectItem>
                            <SelectItem value="FIXED">{tElig('discountTypeFixed')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          className="h-8 text-sm"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                        />
                      </div>
                      {fieldErrors.value ? (
                        <p className="text-xs text-destructive">{fieldError('value')}</p>
                      ) : null}
                      {discountType === 'FIXED' ? (
                        <p className="text-xs text-muted-foreground">{t('fixedCartHint')}</p>
                      ) : null}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">{tElig('scopeTitle')}</Label>
                        <Select
                          value={applicationScope}
                          onValueChange={(v) => setApplicationScope(v as PromoApplicationScope)}
                        >
                          <SelectTrigger className="h-8 w-full text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper" className="z-[80]">
                            <SelectItem value="PRODUCTS">{tElig('scopeProducts')}</SelectItem>
                            <SelectItem value="PRODUCTS_AND_SHIPPING">
                              {tElig('scopeProductsAndShipping')}
                            </SelectItem>
                            <SelectItem value="SHIPPING_ONLY">{tElig('scopeShippingOnly')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">{tElig('scopeHint')}</p>
                        <p className="text-xs text-muted-foreground">
                          {applicationScope === 'PRODUCTS_AND_SHIPPING'
                            ? tElig('effectBoth')
                            : applicationScope === 'SHIPPING_ONLY'
                              ? tElig('effectShipping')
                              : tElig('effectProducts')}
                        </p>
                      </div>
                      <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                        <Label className="text-xs font-medium">{t('combination')}</Label>
                        <Select
                          value={combinesWithOtherDiscounts}
                          onValueChange={(v) =>
                            setCombinesWithOtherDiscounts(v as 'STACK' | 'BEST_PRICE')
                          }
                        >
                          <SelectTrigger className="h-8 w-full bg-background text-sm shadow-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper" className="z-[80]">
                            <SelectItem value="BEST_PRICE">{t('combinationBestPrice')}</SelectItem>
                            <SelectItem value="STACK">{t('combinationStack')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {combinesWithOtherDiscounts === 'STACK'
                            ? t('combinationHintStack')
                            : t('combinationHintBest')}
                        </p>
                      </div>
                    </div>
                  ) : null}
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
                      <SelectValue placeholder={tElig('commercialOfferTitle')} />
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

              <AccordionItem value="targeting" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionTargeting')}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3 pt-0">
                  <div className="space-y-1">
                    <Label className="text-xs">{tScope('scopeType')}</Label>
                    <Select value={target} onValueChange={(v) => setTarget(v as PromoCodeItem['target'])}>
                      <SelectTrigger className="h-9 w-full bg-background text-sm shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[80]">
                        <SelectItem value="ALL_PRODUCTS">{tScope('scopeAll')}</SelectItem>
                        <SelectItem value="CATEGORY">{tScope('scopeCategory')}</SelectItem>
                        <SelectItem value="PRODUCT">{tScope('scopeProduct')}</SelectItem>
                        <SelectItem value="VARIANT">{tScope('scopeVariant')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors.target ? (
                      <p className="text-xs text-destructive">{fieldError('target')}</p>
                    ) : null}
                  </div>
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
                      label={tScope('products')}
                      selected={productItems}
                      onChange={setProductItems}
                      categoryOptions={categoryOptions}
                    />
                  ) : null}
                  {target === 'VARIANT' ? (
                    <PromoProductVariantPicker
                      mode="variants"
                      label={tScope('variants')}
                      selected={variantItems}
                      onChange={setVariantItems}
                      categoryOptions={categoryOptions}
                    />
                  ) : null}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="exclusions" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionExclusions')}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3 pt-0">
                  <p className="text-xs text-muted-foreground">{tScope('exclusionsHint')}</p>
                  <PromoMultiCategoryPicker
                    options={categoryOptions}
                    selectedIds={excludeCategoryIds}
                    onChange={setExcludeCategoryIds}
                    loading={categoriesLoading}
                    label={tScope('excludeCategories')}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <PromoProductVariantPicker
                      mode="products"
                      label={tScope('excludeProducts')}
                      selected={excludeProducts}
                      onChange={setExcludeProducts}
                      categoryOptions={categoryOptions}
                    />
                    <PromoProductVariantPicker
                      mode="variants"
                      label={tScope('excludeVariants')}
                      selected={excludeVariants}
                      onChange={setExcludeVariants}
                      categoryOptions={categoryOptions}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="limits" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionLimits')}
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
                      <Label className="text-xs">{t('usageLimitTotal')}</Label>
                      <Input
                        type="number"
                        className="h-8 text-sm"
                        value={usageLimitTotal}
                        onChange={(e) => setUsageLimitTotal(e.target.value)}
                        placeholder="—"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('usageLimitPerUser')}</Label>
                      <Input
                        type="number"
                        className="h-8 text-sm"
                        value={usageLimitPerUser}
                        onChange={(e) => setUsageLimitPerUser(e.target.value)}
                        placeholder="—"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="dates" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionDates')}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3 pt-0">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('validFrom')}</Label>
                      <Input
                        type="date"
                        className="h-8 text-sm"
                        value={validFrom}
                        onChange={(e) => setValidFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('validTo')}</Label>
                      <Input
                        type="date"
                        className="h-8 text-sm"
                        value={validTo}
                        onChange={(e) => setValidTo(e.target.value)}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="stacking" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionStacking')}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3 pt-0">
                  <Select
                    value={stackingMode}
                    onValueChange={(v) => {
                      const mode = v as 'NONE' | 'ALL' | 'ALLOWLIST' | 'DENYLIST'
                      setStackingMode(mode)
                      if (mode !== 'ALLOWLIST' && mode !== 'DENYLIST') setCompatiblePromoCodeIds([])
                    }}
                  >
                    <SelectTrigger className="h-9 w-full bg-background text-sm shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[80]">
                      <SelectItem value="NONE">{t('stackingNone')}</SelectItem>
                      <SelectItem value="ALL">{t('stackingAll')}</SelectItem>
                      <SelectItem value="ALLOWLIST">{t('stackingAllow')}</SelectItem>
                      <SelectItem value="DENYLIST">{t('stackingDeny')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.stacking ? (
                    <p className="text-xs text-destructive">{fieldError('stacking')}</p>
                  ) : null}
                  {stackingMode === 'ALLOWLIST' || stackingMode === 'DENYLIST' ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {stackingMode === 'ALLOWLIST'
                          ? t('stackingAllowHint')
                          : t('stackingDenyHint')}
                      </p>
                      <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-border/60 bg-background p-2 shadow-sm">
                        {otherActivePromos.length === 0 ? (
                          <p className="text-xs text-muted-foreground">{t('noOtherPromos')}</p>
                        ) : (
                          otherActivePromos.map((promo) => (
                            <label
                              key={promo.id}
                              className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1.5 text-sm hover:bg-muted/60"
                            >
                              <Checkbox
                                className="mt-0.5"
                                checked={compatiblePromoCodeIds.includes(promo.id)}
                                onCheckedChange={(checked) => {
                                  setCompatiblePromoCodeIds((prev) =>
                                    checked === true
                                      ? [...prev, promo.id]
                                      : prev.filter((id) => id !== promo.id),
                                  )
                                }}
                              />
                              <span>
                                <span className="font-medium">{promo.code}</span>
                                <span className="text-muted-foreground"> — {promo.name}</span>
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </>
                  ) : null}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="gift" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionGift')}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3 pt-0">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('addGift')}</Label>
                    <Switch checked={giftEnabled} onCheckedChange={setGiftEnabled} />
                  </div>
                  {giftEnabled ? (
                    <div className="space-y-2">
                      <PromoProductVariantPicker
                        mode="gift"
                        label={t('giftProduct')}
                        selected={giftVariant}
                        onChange={setGiftVariant}
                        categoryOptions={categoryOptions}
                      />
                      {fieldErrors.gift ? (
                        <p className="text-xs text-destructive">{fieldError('gift')}</p>
                      ) : null}
                      <div className="space-y-1">
                        <Label className="text-xs">{t('giftQty')}</Label>
                        <Input
                          type="number"
                          min={1}
                          className="h-8 w-20 text-sm"
                          value={giftQuantity}
                          onChange={(e) => setGiftQuantity(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : null}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="advanced" className="border-b-0">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                  {t('sectionAdvanced')}
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-3 pt-0">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{tElig('priceHint')}</p>
                    <div className="space-y-2">
                      {(
                        [
                          { id: 'ALL' as const, label: tElig('priceAll') },
                          { id: 'GROUP' as const, label: tElig('priceGroup') },
                          { id: 'COMPANY' as const, label: tElig('priceCompany') },
                        ] as const
                      ).map((row) => {
                        const checked = eligiblePriceSources.includes(row.id)
                        return (
                          <label key={row.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                const on = value === true
                                setEligiblePriceSources((prev) => {
                                  if (on) return prev.includes(row.id) ? prev : [...prev, row.id]
                                  return prev.filter((v) => v !== row.id)
                                })
                              }}
                            />
                            <span>{row.label}</span>
                          </label>
                        )
                      })}
                    </div>
                    {fieldErrors.priceSources ? (
                      <p className="text-xs text-destructive">{fieldError('priceSources')}</p>
                    ) : null}
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
                            onClick={() => toggleGroup(group.id)}
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

          <DialogFooter className="border-t px-4 py-3">
            <Button type="button" variant="outline" size="sm" onClick={requestClose}>
              {t('cancel')}
            </Button>
            <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PromotionsUnsavedGuard
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        onDiscard={() => {
          setDiscardOpen(false)
          onClose()
        }}
      />
    </>
  )
}
