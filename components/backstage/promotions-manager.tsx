'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { DiscountRuleDialog } from '@/components/backstage/discount-rule-dialog'
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

const COMBINATION_LABELS: Record<string, string> = {
  BEST_PRICE: 'Краща ціна',
  STACK: 'Сумується',
  MAX_OF: 'Максимум серед подібних',
}

function ruleExclusionsCount(rule: DiscountRuleItem) {
  return (
    rule.excludeProductIds.length + rule.excludeVariantIds.length + rule.excludeCategoryIds.length
  )
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
                          {targetLabel(rule.target)} ·{' '}
                          {COMBINATION_LABELS[rule.combinesWithOtherDiscounts] ?? rule.combinesWithOtherDiscounts}
                          {rule.minCartSubtotal ? ` · від ${rule.minCartSubtotal} ₴ у кошику` : ''}
                          {ruleExclusionsCount(rule) ? ` · виключень: ${ruleExclusionsCount(rule)}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rule.userIds.length
                            ? `Користувачів: ${rule.userIds.length}`
                            : `Групи: ${rule.groups.length ? rule.groups.map((group) => group.name).join(', ') : 'усі клієнти'}`}
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
      <DiscountRuleDialog
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

