'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { AdminLayout } from '@/components/admin/admin-layout'
import { PromoCodeDialog } from '@/components/backstage/promo-code-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  deleteCustomerGroup,
  deleteDiscountRule,
  deletePromoCode,
  fetchCustomerGroups,
  fetchDiscountRules,
  fetchPromoCodes,
  saveCustomerGroup,
  saveDiscountRule,
  type CustomerGroupItem,
  type DiscountRuleItem,
  type PromoCodeItem,
} from '@/lib/backstage/pricing'

const TARGET_OPTIONS = [
  { value: 'ALL_PRODUCTS', label: 'Усі товари' },
  { value: 'CATEGORY', label: 'Категорія' },
  { value: 'PRODUCT', label: 'Товар' },
  { value: 'VARIANT', label: 'Розмір / варіант' },
] as const

function targetLabel(value: string) {
  return TARGET_OPTIONS.find((item) => item.value === value)?.label ?? value
}

function promoBenefitLabel(promo: PromoCodeItem) {
  const parts: string[] = []
  if (promo.discountType === 'PERCENT' && promo.value != null) {
    const scope =
      promo.discountApplicationScope === 'CART_TOTAL' ? 'на кошик' : 'на товари'
    parts.push(`${promo.value}% ${scope}`)
  }
  if (promo.discountType === 'FIXED' && promo.value != null) parts.push(`${promo.value} ₴ на кошик`)
  if (promo.giftVariantId) parts.push('подарунок')
  return parts.length ? parts.join(' + ') : '—'
}

export function PromotionsManager() {
  const [groups, setGroups] = useState<CustomerGroupItem[]>([])
  const [rules, setRules] = useState<DiscountRuleItem[]>([])
  const [promos, setPromos] = useState<PromoCodeItem[]>([])
  const [loading, setLoading] = useState(true)

  const [groupDialog, setGroupDialog] = useState<CustomerGroupItem | 'new' | null>(null)
  const [ruleDialog, setRuleDialog] = useState<DiscountRuleItem | 'new' | null>(null)
  const [promoDialog, setPromoDialog] = useState<PromoCodeItem | 'new' | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [groupsData, rulesData, promosData] = await Promise.all([
        fetchCustomerGroups(),
        fetchDiscountRules(),
        fetchPromoCodes(),
      ])
      setGroups(groupsData)
      setRules(rulesData)
      setPromos(promosData)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити дані.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const groupOptions = useMemo(
    () => groups.filter((group) => group.isActive).map((group) => ({ id: group.id, name: group.name })),
    [groups],
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">Знижки та промокоди</h1>
          <p className="mt-1 text-muted-foreground">
            Групи клієнтів, автоматичні правила та промокоди. Промокоди можна поєднувати, якщо
            налаштована сумісність. Знижки від кількості налаштовуються у картці товару.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="rules">
            <TabsList>
              <TabsTrigger value="groups">Групи ({groups.length})</TabsTrigger>
              <TabsTrigger value="rules">Правила знижок ({rules.length})</TabsTrigger>
              <TabsTrigger value="promos">Промокоди ({promos.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="groups" className="space-y-4 pt-4">
              <Button type="button" onClick={() => setGroupDialog('new')}>
                <Plus className="mr-2 h-4 w-4" />
                Нова група
              </Button>
              <div className="grid gap-4 md:grid-cols-2">
                {groups.map((group) => (
                  <Card key={group.id}>
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{group.name}</p>
                            <Badge variant={group.isActive ? 'default' : 'secondary'}>
                              {group.isActive ? 'Активна' : 'Вимкнена'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{group.slug}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button type="button" size="icon" variant="ghost" onClick={() => setGroupDialog(group)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              void deleteCustomerGroup(group.id)
                                .then(loadAll)
                                .then(() => toast.success('Групу видалено.'))
                                .catch((err) => toast.error(err instanceof Error ? err.message : 'Помилка.'))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {group.description ? (
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Користувачів: {group.usersCount} · Правил: {group.discountRulesCount} · Промокодів:{' '}
                        {group.promoCodesCount}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="rules" className="space-y-4 pt-4">
              <Button type="button" onClick={() => setRuleDialog('new')}>
                <Plus className="mr-2 h-4 w-4" />
                Нове правило
              </Button>
              <div className="space-y-3">
                {rules.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{rule.name}</p>
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'Активне' : 'Вимкнене'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rule.type === 'PERCENT' ? `${rule.value}%` : `${rule.value} ₴`} ·{' '}
                          {targetLabel(rule.target)}
                          {rule.minCartSubtotal ? ` · від ${rule.minCartSubtotal} ₴ у кошику` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Групи:{' '}
                          {rule.groups.length
                            ? rule.groups.map((group) => group.name).join(', ')
                            : 'усі клієнти'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button type="button" size="icon" variant="ghost" onClick={() => setRuleDialog(rule)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            void deleteDiscountRule(rule.id)
                              .then(loadAll)
                              .then(() => toast.success('Правило видалено.'))
                              .catch((err) => toast.error(err instanceof Error ? err.message : 'Помилка.'))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="promos" className="space-y-4 pt-4">
              <Button type="button" onClick={() => setPromoDialog('new')}>
                <Plus className="mr-2 h-4 w-4" />
                Новий промокод
              </Button>
              <div className="space-y-3">
                {promos.map((promo) => (
                  <Card key={promo.id}>
                    <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono font-semibold">{promo.code}</p>
                          <Badge variant={promo.isActive ? 'default' : 'secondary'}>
                            {promo.isActive ? 'Активний' : 'Вимкнений'}
                          </Badge>
                        </div>
                        <p className="font-medium">{promo.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {promoBenefitLabel(promo)} · {targetLabel(promo.target)}
                          {promo.userIds.length
                            ? ` · ${promo.userIds.length} корист.`
                            : promo.groups.length
                              ? ` · ${promo.groups.map((g) => g.name).join(', ')}`
                              : ''}
                          {promo.validFrom || promo.validTo
                            ? ` · ${promo.validFrom?.slice(0, 10) ?? '…'} — ${promo.validTo?.slice(0, 10) ?? '…'}`
                            : ''}
                          {' · '}використань: {promo.usagesCount}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button type="button" size="icon" variant="ghost" onClick={() => setPromoDialog(promo)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            void deletePromoCode(promo.id)
                              .then(loadAll)
                              .then(() => toast.success('Промокод видалено.'))
                              .catch((err) => toast.error(err instanceof Error ? err.message : 'Помилка.'))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <GroupDialog
        open={groupDialog !== null}
        item={groupDialog === 'new' ? null : groupDialog}
        onClose={() => setGroupDialog(null)}
        onSaved={() => void loadAll()}
      />
      <RuleDialog
        open={ruleDialog !== null}
        item={ruleDialog === 'new' ? null : ruleDialog}
        groups={groupOptions}
        onClose={() => setRuleDialog(null)}
        onSaved={() => void loadAll()}
      />
      <PromoCodeDialog
        open={promoDialog !== null}
        item={promoDialog === 'new' ? null : promoDialog}
        groups={groupOptions}
        allPromoCodes={promos.filter((promo) => promo.id !== (promoDialog !== 'new' ? promoDialog?.id : undefined))}
        onClose={() => setPromoDialog(null)}
        onSaved={() => void loadAll()}
      />
    </AdminLayout>
  )
}

function GroupDialog({
  open,
  item,
  onClose,
  onSaved,
}: {
  open: boolean
  item: CustomerGroupItem | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(item?.name ?? '')
    setSlug(item?.slug ?? '')
    setDescription(item?.description ?? '')
    setIsActive(item?.isActive ?? true)
  }, [open, item])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveCustomerGroup({ name, slug, description, isActive }, item?.id)
      toast.success(item ? 'Групу оновлено.' : 'Групу створено.')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка збереження.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? 'Редагувати групу' : 'Нова група клієнтів'}</DialogTitle>
          <DialogDescription className="sr-only">
            {item ? 'Зміна назви, slug та статусу групи клієнтів.' : 'Створення нової групи клієнтів.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Назва</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Slug (латиниця)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="wholesale" />
          </div>
          <div className="space-y-2">
            <Label>Опис</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Активна</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Скасувати
          </Button>
          <Button type="button" disabled={saving} onClick={() => void handleSave()}>
            Зберегти
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RuleDialog({
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
  const [target, setTarget] = useState<DiscountRuleItem['target']>('ALL_PRODUCTS')
  const [targetId, setTargetId] = useState('')
  const [minCartSubtotal, setMinCartSubtotal] = useState('')
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(item?.name ?? '')
    setType(item?.type ?? 'PERCENT')
    setValue(String(item?.value ?? 5))
    setTarget(item?.target ?? 'ALL_PRODUCTS')
    setTargetId(item?.targetId ?? '')
    setMinCartSubtotal(item?.minCartSubtotal ? String(item.minCartSubtotal) : '')
    setGroupIds(item?.groupIds ?? [])
    setIsActive(item?.isActive ?? true)
  }, [open, item])

  const toggleGroup = (id: string) => {
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveDiscountRule(
        {
          name,
          type,
          value: Number(value),
          target,
          targetId: target === 'ALL_PRODUCTS' ? undefined : targetId || undefined,
          minCartSubtotal: minCartSubtotal ? Number(minCartSubtotal) : undefined,
          groupIds,
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
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? 'Редагувати правило' : 'Нове правило знижки'}</DialogTitle>
          <DialogDescription className="sr-only">
            {item ? 'Редагування автоматичного правила знижки.' : 'Створення автоматичного правила знижки.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Назва</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'PERCENT' | 'FIXED')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Відсоток %</SelectItem>
                  <SelectItem value="FIXED">Сума (₴/од.)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Значення</Label>
              <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Область застосування</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as DiscountRuleItem['target'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGET_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {target !== 'ALL_PRODUCTS' ? (
            <div className="space-y-2">
              <Label>ID цілі (UUID категорії, товару або варіанту)</Label>
              <Input value={targetId} onChange={(e) => setTargetId(e.target.value)} />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Мін. сума кошика (₴, необовʼязково)</Label>
            <Input
              type="number"
              value={minCartSubtotal}
              onChange={(e) => setMinCartSubtotal(e.target.value)}
              placeholder="Без умови"
            />
          </div>
          <div className="space-y-2">
            <Label>Групи клієнтів (порожньо = для всіх)</Label>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <Button
                  key={group.id}
                  type="button"
                  size="sm"
                  variant={groupIds.includes(group.id) ? 'default' : 'outline'}
                  onClick={() => toggleGroup(group.id)}
                >
                  {group.name}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Активне</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Скасувати
          </Button>
          <Button type="button" disabled={saving} onClick={() => void handleSave()}>
            Зберегти
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
