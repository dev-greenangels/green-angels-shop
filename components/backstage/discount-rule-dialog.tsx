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
import { fetchCategoryTree, type CategoryTreeNode } from '@/lib/backstage/categories'
import { backstageSectionClassName } from '@/lib/backstage/picker-styles'
import { saveDiscountRule, type DiscountRuleItem } from '@/lib/backstage/pricing'

const TARGET_OPTIONS = [
  { value: 'ALL_PRODUCTS', label: 'Усі товари' },
  { value: 'CATEGORY', label: 'Категорії' },
  { value: 'PRODUCT', label: 'Товари' },
  { value: 'VARIANT', label: 'Розміри' },
] as const

const COMBINATION_OPTIONS = [
  { value: 'BEST_PRICE', label: 'Краща ціна (конкурує з іншими знижками)' },
  { value: 'STACK', label: 'Сумується з іншими знижками' },
  { value: 'MAX_OF', label: 'Найбільша серед подібних правил' },
] as const

const COMBINATION_HINTS: Record<(typeof COMBINATION_OPTIONS)[number]['value'], string> = {
  BEST_PRICE:
    'Клієнт отримає меншу з цін: базову/знижку від кількості/контрагента або цю знижку.',
  STACK:
    'Знижка застосовується додатково поверх кращої ціни від кількості чи контрагента.',
  MAX_OF:
    'Серед усіх застосовних правил з цим режимом обирається лише найбільша знижка.',
}

const ROLE_OPTIONS = [
  { value: 'USER', label: 'Роздріб' },
  { value: 'WHOLESALER', label: 'Гурт' },
  { value: 'GUEST', label: 'Гість' },
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

export function DiscountRuleDialog({
  open,
  item,
  groups,
  onClose,
  onSaved,
}: {
  open: boolean
  item: DiscountRuleItem | null
  groups: Array<{ id: string; name: string }>
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'PERCENT' | 'FIXED'>('PERCENT')
  const [value, setValue] = useState('5')
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
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(item?.name ?? '')
    setType(item?.type ?? 'PERCENT')
    setValue(item?.value != null ? String(item.value) : '5')
    setCombinesWithOtherDiscounts(item?.combinesWithOtherDiscounts ?? 'BEST_PRICE')
    setTarget(item?.target ?? 'ALL_PRODUCTS')
    setCategoryIds(item?.target === 'CATEGORY' ? item.targetIds : [])
    setProductItems(
      item?.target === 'PRODUCT'
        ? item.targetIds.map((id) => ({ id, label: item.targetLabels?.[id] ?? id.slice(0, 8) }))
        : [],
    )
    setVariantItems(
      item?.target === 'VARIANT'
        ? item.targetIds.map((id) => ({ id, label: item.targetLabels?.[id] ?? id.slice(0, 8) }))
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
    setStartDate(item?.startDate ? item.startDate.slice(0, 10) : '')
    setEndDate(item?.endDate ? item.endDate.slice(0, 10) : '')
    setOnlyForRoles(item?.onlyForRoles ?? [])
    setGroupIds(item?.groupIds ?? [])
    setUserIds(item?.userIds ?? [])
    setSelectedUsers(item?.users ?? [])
    setIsActive(item?.isActive ?? true)
  }, [open, item])

  useEffect(() => {
    if (!open) return
    setCategoriesLoading(true)
    fetchCategoryTree()
      .then((tree) => setCategoryOptions(flattenCategoryOptions(tree)))
      .catch(() => setCategoryOptions([]))
      .finally(() => setCategoriesLoading(false))
  }, [open])

  const toggleGroup = (id: string) => {
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  const toggleRole = (role: string) => {
    setOnlyForRoles((prev) => (prev.includes(role) ? prev.filter((v) => v !== role) : [...prev, role]))
  }

  const resolveTargetIds = () => {
    if (target === 'CATEGORY') return categoryIds
    if (target === 'PRODUCT') return productItems.map((p) => p.id)
    if (target === 'VARIANT') return variantItems.map((v) => v.id)
    return []
  }

  const handleSave = async () => {
    if (!value.trim() || Number(value) <= 0) {
      toast.error('Вкажіть значення знижки.')
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
      await saveDiscountRule(
        {
          name,
          type,
          value: Number(value),
          target,
          targetIds: resolveTargetIds(),
          excludeProductIds: excludeProducts.map((p) => p.id),
          excludeVariantIds: excludeVariants.map((v) => v.id),
          excludeCategoryIds,
          combinesWithOtherDiscounts,
          onlyForRoles,
          minCartSubtotal: minCartSubtotal ? Number(minCartSubtotal) : undefined,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          groupIds: userIds.length > 0 ? [] : groupIds,
          allowedUserIds: userIds,
          isActive,
        },
        item?.id,
      )
      toast.success(item ? 'Правило оновлено.' : 'Правило створено.')
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
      <DialogContent
        className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-base">
            {item ? 'Редагувати правило' : 'Нове правило знижки'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Налаштування автоматичного правила знижки, виключень та умов застосування.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-7rem)] space-y-3 overflow-y-auto px-4 py-3">
          <Section title="Основне">
            <div className="space-y-1">
              <Label className="text-xs">Назва</Label>
              <Input className="h-8 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Select value={type} onValueChange={(v) => setType(v as 'PERCENT' | 'FIXED')}>
                <SelectTrigger className="h-8 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[80]">
                  <SelectItem value="PERCENT">Відсоток %</SelectItem>
                  <SelectItem value="FIXED">Сума (₴/од.)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                className="h-8 text-sm"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
              <Label className="text-xs font-medium">Поєднання з іншими знижками</Label>
              <Select
                value={combinesWithOtherDiscounts}
                onValueChange={(v) => setCombinesWithOtherDiscounts(v as 'BEST_PRICE' | 'STACK' | 'MAX_OF')}
              >
                <SelectTrigger className="h-8 w-full bg-background text-sm shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[80]">
                  {COMBINATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {COMBINATION_HINTS[combinesWithOtherDiscounts]}
              </p>
            </div>
          </Section>

          <Section title="Область застосування">
            <div className="space-y-1">
              <Label className="text-xs">Тип</Label>
              <Select value={target} onValueChange={(v) => setTarget(v as DiscountRuleItem['target'])}>
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
              <PromoProductVariantPicker
                mode="products"
                label="Товари"
                selected={productItems}
                onChange={setProductItems}
              />
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
              Правило не діятиме на виключені категорії (з підкатегоріями), товари або розміри.
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
              <>
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
                <div className="space-y-1.5">
                  <Label className="text-xs">Ролі (порожньо = усі)</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLE_OPTIONS.map((role) => (
                      <Button
                        key={role.value}
                        type="button"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        variant={onlyForRoles.includes(role.value) ? 'default' : 'outline'}
                        onClick={() => toggleRole(role.value)}
                      >
                        {role.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Обрано конкретних користувачів — групи та ролі ігноруються.
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
                <Label className="text-xs">Діє з</Label>
                <Input
                  type="date"
                  className="h-8 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Діє до</Label>
                <Input
                  type="date"
                  className="h-8 text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label className="text-sm">Активне</Label>
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
