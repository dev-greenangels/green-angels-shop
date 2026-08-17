'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'

import type { CategoryOption } from '@/components/backstage/category-combobox'
import { PromoMultiCategoryPicker } from '@/components/backstage/promo-multi-category-picker'
import { PromoProductVariantPicker } from '@/components/backstage/promo-product-variant-picker'
import { PromoUserPicker } from '@/components/backstage/promo-user-picker'
import { Button } from '@/components/ui/button'
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
import { fetchCategoryTree, type CategoryTreeNode } from '@/lib/backstage/categories'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import { backstageSectionClassName } from '@/lib/backstage/picker-styles'
import { savePromoCode, type PromoCodeItem } from '@/lib/backstage/pricing'

const TARGET_OPTIONS = [
  { value: 'ALL_PRODUCTS', label: 'Усі товари' },
  { value: 'CATEGORY', label: 'Категорії' },
  { value: 'PRODUCT', label: 'Товари' },
  { value: 'VARIANT', label: 'Розміри' },
] as const

function flattenCategoryOptions(nodes: CategoryTreeNode[], depth = 0): CategoryOption[] {
  const result: CategoryOption[] = []
  for (const node of nodes) {
    result.push({ id: node.id, name: node.name, depth })
    if (node.children?.length) {
      result.push(...flattenCategoryOptions(node.children, depth + 1))
    }
  }
  return result
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={backstageSectionClassName}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
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
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [discountEnabled, setDiscountEnabled] = useState(true)
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT')
  const [discountApplicationScope, setDiscountApplicationScope] = useState<'LINE_ITEMS' | 'CART_TOTAL'>('LINE_ITEMS')
  const [combinesWithOtherDiscounts, setCombinesWithOtherDiscounts] = useState<'STACK' | 'BEST_PRICE'>('BEST_PRICE')
  const [stackingMode, setStackingMode] = useState<'NONE' | 'ALL' | 'ALLOWLIST' | 'DENYLIST'>('NONE')
  const [compatiblePromoCodeIds, setCompatiblePromoCodeIds] = useState<string[]>([])
  const [value, setValue] = useState('5')
  const [giftEnabled, setGiftEnabled] = useState(false)
  const [giftVariant, setGiftVariant] = useState<{ id: string; label: string }[]>([])
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
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setCode(item?.code ?? '')
    setName(item?.name ?? '')
    setDescription(item?.description ?? '')
    setDiscountEnabled(item ? item.discountType != null : true)
    setDiscountType(item?.discountType === 'FIXED' ? 'FIXED' : 'PERCENT')
    setDiscountApplicationScope(
      item?.discountApplicationScope === 'CART_TOTAL' ? 'CART_TOTAL' : 'LINE_ITEMS',
    )
    setCombinesWithOtherDiscounts(item?.combinesWithOtherDiscounts ?? 'BEST_PRICE')
    setStackingMode(item?.stackingMode ?? 'NONE')
    setCompatiblePromoCodeIds(item?.compatiblePromoCodeIds ?? [])
    setValue(item?.value != null ? String(item.value) : '5')
    setGiftEnabled(Boolean(item?.giftVariantId))
    setGiftVariant(
      item?.giftVariantId
        ? [{ id: item.giftVariantId, label: item.giftVariantLabel ?? 'Подарунок' }]
        : [],
    )
    setGiftQuantity(item?.giftQuantity ? String(item.giftQuantity) : '1')
    setTarget(item?.target ?? 'ALL_PRODUCTS')
    setCategoryIds(item?.target === 'CATEGORY' ? item.targetIds : [])
    setProductItems(
      item?.target === 'PRODUCT'
        ? item.targetIds.map((id) => ({
            id,
            label: item.targetLabels?.[id] ?? id.slice(0, 8),
          }))
        : [],
    )
    setVariantItems(
      item?.target === 'VARIANT'
        ? item.targetIds.map((id) => ({
            id,
            label: item.targetLabels?.[id] ?? id.slice(0, 8),
          }))
        : [],
    )
    setExcludeProducts(
      (item?.excludeProductIds ?? []).map((id) => ({
        id,
        label: item?.excludeLabels?.[id] ?? id.slice(0, 8),
      })),
    )
    setExcludeVariants(
      (item?.excludeVariantIds ?? []).map((id) => ({
        id,
        label: item?.excludeLabels?.[id] ?? id.slice(0, 8),
      })),
    )
    setExcludeCategoryIds(item?.excludeCategoryIds ?? [])
    setMinCartSubtotal(item?.minCartSubtotal ? String(item.minCartSubtotal) : '')
    setUsageLimitTotal(item?.usageLimitTotal ? String(item.usageLimitTotal) : '')
    setUsageLimitPerUser(item?.usageLimitPerUser ? String(item.usageLimitPerUser) : '')
    setValidFrom(item?.validFrom ? item.validFrom.slice(0, 10) : '')
    setValidTo(item?.validTo ? item.validTo.slice(0, 10) : '')
    setGroupIds(item?.groupIds ?? [])
    setUserIds(item?.userIds ?? [])
    setSelectedUsers(item?.users ?? [])
    setIsActive(item?.isActive ?? true)
  }, [open, item])

  useEffect(() => {
    if (!open) return
    setCategoriesLoading(true)
    fetchCategoryTree(contentLocale, { edit: false })
      .then((tree) => setCategoryOptions(flattenCategoryOptions(tree)))
      .catch(() => setCategoryOptions([]))
      .finally(() => setCategoriesLoading(false))
  }, [open, contentLocale])

  const toggleGroup = (id: string) => {
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  const resolveTargetIds = () => {
    if (target === 'CATEGORY') return categoryIds
    if (target === 'PRODUCT') return productItems.map((p) => p.id)
    if (target === 'VARIANT') return variantItems.map((v) => v.id)
    return []
  }

  const handleSave = async () => {
    if (!discountEnabled && !giftEnabled) {
      toast.error('Увімкніть знижку або подарунок.')
      return
    }
    if (discountEnabled && !value.trim()) {
      toast.error('Вкажіть значення знижки.')
      return
    }
    if (giftEnabled && giftVariant.length === 0) {
      toast.error('Оберіть подарунковий товар.')
      return
    }
    if (
      (stackingMode === 'ALLOWLIST' || stackingMode === 'DENYLIST') &&
      compatiblePromoCodeIds.length === 0
    ) {
      toast.error(
        stackingMode === 'DENYLIST'
          ? 'Оберіть промокоди-виключення.'
          : 'Оберіть промокоди для сумісності.',
      )
      return
    }
    if (target === 'CATEGORY' && categoryIds.length === 0) {
      toast.error('Оберіть хоча б одну категорію.')
      return
    }
    if (target === 'PRODUCT' && productItems.length === 0) {
      toast.error('Оберіть хоча б один товар.')
      return
    }
    if (target === 'VARIANT' && variantItems.length === 0) {
      toast.error('Оберіть хоча б один розмір.')
      return
    }

    setSaving(true)
    try {
      await savePromoCode(
        {
          code,
          name,
          description: description || undefined,
          discountType: discountEnabled ? discountType : undefined,
          value: discountEnabled ? Number(value) : undefined,
          discountApplicationScope: discountEnabled ? discountApplicationScope : undefined,
          combinesWithOtherDiscounts: discountEnabled ? combinesWithOtherDiscounts : undefined,
          stackingMode,
          compatiblePromoCodeIds:
            stackingMode === 'ALLOWLIST' || stackingMode === 'DENYLIST'
              ? compatiblePromoCodeIds
              : [],
          giftVariantId: giftEnabled ? giftVariant[0]?.id : undefined,
          giftQuantity: giftEnabled ? Number(giftQuantity) || 1 : undefined,
          target,
          targetIds: resolveTargetIds(),
          excludeProductIds: excludeProducts.map((p) => p.id),
          excludeVariantIds: excludeVariants.map((v) => v.id),
          excludeCategoryIds,
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
      toast.success(item ? 'Промокод оновлено.' : 'Промокод створено.')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка збереження.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-base">{item ? 'Редагувати промокод' : 'Новий промокод'}</DialogTitle>
          <DialogDescription className="sr-only">
            Налаштування промокоду, знижки, подарунка та умов застосування.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-7rem)] space-y-3 overflow-y-auto px-4 py-3">
          <Section title="Основне">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Код</Label>
                <Input
                  className="h-8 text-sm"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Назва</Label>
                <Input className="h-8 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Опис</Label>
              <Textarea
                className="min-h-[52px] text-sm"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </Section>

          <div className="grid gap-3 sm:grid-cols-2">
            <Section title="Знижка">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Застосувати знижку</Label>
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
                        <SelectItem value="PERCENT">Відсоток %</SelectItem>
                        <SelectItem value="FIXED">Сума ₴ на кошик</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      className="h-8 text-sm"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  </div>
                  {discountType === 'PERCENT' ? (
                    <Select
                      value={discountApplicationScope}
                      onValueChange={(v) =>
                        setDiscountApplicationScope(v as 'LINE_ITEMS' | 'CART_TOTAL')
                      }
                    >
                      <SelectTrigger className="h-8 w-full text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[80]">
                        <SelectItem value="LINE_ITEMS">Застосувати на товари</SelectItem>
                        <SelectItem value="CART_TOTAL">Застосувати на суму кошика</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Фіксована сума завжди застосовується до загальної суми кошика.
                    </p>
                  )}
                  <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                    <Label className="text-xs font-medium">Поєднання з іншими знижками</Label>
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
                        <SelectItem value="BEST_PRICE">Краща ціна (промо або авто-знижка)</SelectItem>
                        <SelectItem value="STACK">Сумується з іншими знижками</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {combinesWithOtherDiscounts === 'STACK'
                        ? 'Промокод додається поверх знижок від кількості, контрагента та правил.'
                        : 'Клієнт отримає меншу з цін: після авто-знижок або за промокодом.'}
                    </p>
                  </div>
                </div>
              ) : null}
            </Section>

            <Section title="Подарунок">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Додати подарунок</Label>
                <Switch checked={giftEnabled} onCheckedChange={setGiftEnabled} />
              </div>
              {giftEnabled ? (
                <div className="space-y-2">
                  <PromoProductVariantPicker
                    mode="gift"
                    label="Товар-подарунок"
                    selected={giftVariant}
                    onChange={setGiftVariant}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs">Кількість</Label>
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
            </Section>
          </div>

          <Section title="Сумісність з іншими промокодами">
            <div className="space-y-2">
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
                  <SelectItem value="NONE">Несумісний з іншими</SelectItem>
                  <SelectItem value="ALL">Сумісний з усіма</SelectItem>
                  <SelectItem value="ALLOWLIST">Сумісний лише з обраними</SelectItem>
                  <SelectItem value="DENYLIST">Сумісний з усіма, крім обраних</SelectItem>
                </SelectContent>
              </Select>
              {stackingMode === 'ALLOWLIST' || stackingMode === 'DENYLIST' ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {stackingMode === 'ALLOWLIST'
                      ? 'Промокод можна поєднати лише з відміченими нижче. Обидва промокоди мають дозволяти сумісність.'
                      : 'Промокод можна поєднати з будь-яким, окрім відмічених нижче.'}
                  </p>
                  <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-border/60 bg-background p-2 shadow-sm">
                    {allPromoCodes.filter((promo) => promo.isActive).length === 0 ? (
                      <p className="text-xs text-muted-foreground">Немає інших активних промокодів.</p>
                    ) : (
                      allPromoCodes
                        .filter((promo) => promo.isActive)
                        .map((promo) => (
                          <label
                            key={promo.id}
                            className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1.5 text-sm hover:bg-muted/60"
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={compatiblePromoCodeIds.includes(promo.id)}
                              onChange={(e) => {
                                setCompatiblePromoCodeIds((prev) =>
                                  e.target.checked
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
            </div>
          </Section>

          <Section title="Область застосування">
            <div className="space-y-1">
              <Label className="text-xs">Тип</Label>
              <Select value={target} onValueChange={(v) => setTarget(v as PromoCodeItem['target'])}>
                <SelectTrigger className="h-9 w-full bg-background text-sm shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[80]">
                  {TARGET_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {target === 'CATEGORY' ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Застосовується до товарів у вибраних категоріях та їх підкатегоріях.
                </p>
                <PromoMultiCategoryPicker
                  options={categoryOptions}
                  selectedIds={categoryIds}
                  onChange={setCategoryIds}
                  loading={categoriesLoading}
                />
              </>
            ) : null}
            {target === 'PRODUCT' ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Застосовується до всіх розмірів кожного обраного товару.
                </p>
                <PromoProductVariantPicker
                  mode="products"
                  label="Товари"
                  selected={productItems}
                  onChange={setProductItems}
                />
              </>
            ) : null}
            {target === 'VARIANT' ? (
              <PromoProductVariantPicker
                mode="variants"
                label="Розміри / варіанти"
                selected={variantItems}
                onChange={setVariantItems}
              />
            ) : null}
          </Section>

          <Section title="Виключення">
            <p className="text-xs text-muted-foreground">
              Промокод не діятиме на виключені категорії (з підкатегоріями), товари або розміри.
            </p>
            <PromoMultiCategoryPicker
              options={categoryOptions}
              selectedIds={excludeCategoryIds}
              onChange={setExcludeCategoryIds}
              loading={categoriesLoading}
              label="Категорії-виключення"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <PromoProductVariantPicker
                mode="products"
                label="Товари-виключення"
                selected={excludeProducts}
                onChange={setExcludeProducts}
              />
              <PromoProductVariantPicker
                mode="variants"
                label="Розміри-виключення"
                selected={excludeVariants}
                onChange={setExcludeVariants}
              />
            </div>
          </Section>

          <Section title="Аудиторія">
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
                <Label className="text-xs">Групи клієнтів (порожньо = усі)</Label>
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
              <p className="text-xs text-muted-foreground">
                Обрано конкретних користувачів — групи клієнтів ігноруються.
              </p>
            )}
          </Section>

          <Section title="Обмеження">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Мін. сума кошика</Label>
                <Input
                  type="number"
                  className="h-8 text-sm"
                  value={minCartSubtotal}
                  onChange={(e) => setMinCartSubtotal(e.target.value)}
                  placeholder="—"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ліміт використань</Label>
                <Input
                  type="number"
                  className="h-8 text-sm"
                  value={usageLimitTotal}
                  onChange={(e) => setUsageLimitTotal(e.target.value)}
                  placeholder="—"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">На користувача</Label>
                <Input
                  type="number"
                  className="h-8 text-sm"
                  value={usageLimitPerUser}
                  onChange={(e) => setUsageLimitPerUser(e.target.value)}
                  placeholder="—"
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Дійсний від</Label>
                <Input
                  type="date"
                  className="h-8 text-sm"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Дійсний до</Label>
                <Input
                  type="date"
                  className="h-8 text-sm"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label className="text-sm">Активний</Label>
            </div>
          </Section>
        </div>

        <DialogFooter className="border-t px-4 py-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Скасувати
          </Button>
          <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Зберегти
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
