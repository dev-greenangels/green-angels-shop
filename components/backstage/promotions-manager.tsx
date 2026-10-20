'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { PromoCodeDialog } from '@/components/backstage/promo-code-dialog'
import {
  PromotionsDeleteConfirm,
  PromotionsUnsavedGuard,
} from '@/components/backstage/promotions-unsaved-guard'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
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
  type CustomerGroupItem,
  type DiscountRuleItem,
  type PromoCodeItem,
} from '@/lib/backstage/pricing'
import {
  hasFieldErrors,
  validateCustomerGroupDraft,
} from '@/lib/backstage/promotions-form'
import {
  filterCustomerGroups,
  filterDiscountRules,
  filterPromoCodes,
  formatDateRange,
  isFormDirty,
  promoBenefitParts,
  promoExclusionsCount,
  ruleExclusionsCount,
  ruleValueLabel,
  stableStringify,
  type AudienceFilter,
  type StatusFilter,
  type TargetFilter,
} from '@/lib/backstage/promotions-list'
import { cn } from '@/lib/utils'

type DeleteTarget =
  | { kind: 'group'; item: CustomerGroupItem }
  | { kind: 'rule'; item: DiscountRuleItem }
  | { kind: 'promo'; item: PromoCodeItem }

function ListToolbar({
  query,
  onQueryChange,
  status,
  onStatusChange,
  audience,
  onAudienceChange,
  target,
  onTargetChange,
  showAudience,
  showTarget,
  searchPlaceholder,
  onCreate,
  createLabel,
  createHref,
}: {
  query: string
  onQueryChange: (v: string) => void
  status: StatusFilter
  onStatusChange: (v: StatusFilter) => void
  audience?: AudienceFilter
  onAudienceChange?: (v: AudienceFilter) => void
  target?: TargetFilter
  onTargetChange?: (v: TargetFilter) => void
  showAudience?: boolean
  showTarget?: boolean
  searchPlaceholder: string
  onCreate?: () => void
  createLabel: string
  createHref?: string
}) {
  const t = useTranslations('promotions')
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 pl-9 text-sm"
            aria-label={searchPlaceholder}
          />
        </div>
        <Select value={status} onValueChange={(v) => onStatusChange(v as StatusFilter)}>
          <SelectTrigger className="h-9 w-full sm:w-[9.5rem] text-sm">
            <SelectValue placeholder={t('filterStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('statusAll')}</SelectItem>
            <SelectItem value="active">{t('statusActive')}</SelectItem>
            <SelectItem value="inactive">{t('statusInactive')}</SelectItem>
          </SelectContent>
        </Select>
        {showAudience && audience && onAudienceChange ? (
          <Select value={audience} onValueChange={(v) => onAudienceChange(v as AudienceFilter)}>
            <SelectTrigger className="h-9 w-full sm:w-[10rem] text-sm">
              <SelectValue placeholder={t('filterAudience')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('audienceAll')}</SelectItem>
              <SelectItem value="RETAIL">{t('audienceRetail')}</SelectItem>
              <SelectItem value="WHOLESALER">{t('audienceWholesale')}</SelectItem>
              <SelectItem value="LEGACY">{t('audienceLegacy')}</SelectItem>
            </SelectContent>
          </Select>
        ) : null}
        {showTarget && target && onTargetChange ? (
          <Select value={target} onValueChange={(v) => onTargetChange(v as TargetFilter)}>
            <SelectTrigger className="h-9 w-full sm:w-[11rem] text-sm">
              <SelectValue placeholder={t('filterTarget')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('targetAll')}</SelectItem>
              <SelectItem value="ALL_PRODUCTS">{t('targetAllProducts')}</SelectItem>
              <SelectItem value="CATEGORY">{t('targetCategory')}</SelectItem>
              <SelectItem value="PRODUCT">{t('targetProduct')}</SelectItem>
              <SelectItem value="VARIANT">{t('targetVariant')}</SelectItem>
            </SelectContent>
          </Select>
        ) : null}
      </div>
      {createHref ? (
        <a href={createHref} className={cn(buttonVariants({ size: 'sm' }), 'h-9 shrink-0')}>
          <Plus className="mr-1.5 h-4 w-4" />
          {createLabel}
        </a>
      ) : (
        <Button type="button" size="sm" className="h-9 shrink-0" onClick={onCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          {createLabel}
        </Button>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export function PromotionsManager() {
  const t = useTranslations('promotions')
  const tRules = useTranslations('discountRules')
  const tPromo = useTranslations('promoCodes')

  const [groups, setGroups] = useState<CustomerGroupItem[]>([])
  const [rules, setRules] = useState<DiscountRuleItem[]>([])
  const [promos, setPromos] = useState<PromoCodeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState('rules')

  const [groupQuery, setGroupQuery] = useState('')
  const [groupStatus, setGroupStatus] = useState<StatusFilter>('all')
  const [ruleQuery, setRuleQuery] = useState('')
  const [ruleStatus, setRuleStatus] = useState<StatusFilter>('all')
  const [ruleAudience, setRuleAudience] = useState<AudienceFilter>('all')
  const [ruleTarget, setRuleTarget] = useState<TargetFilter>('all')
  const [promoQuery, setPromoQuery] = useState('')
  const [promoStatus, setPromoStatus] = useState<StatusFilter>('all')
  const [promoAudience, setPromoAudience] = useState<AudienceFilter>('all')
  const [promoTarget, setPromoTarget] = useState<TargetFilter>('all')

  const [groupDialog, setGroupDialog] = useState<CustomerGroupItem | 'new' | null>(null)
  const [promoDialog, setPromoDialog] = useState<PromoCodeItem | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
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
      const message = err instanceof Error ? err.message : t('loadError')
      setLoadError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const groupOptions = useMemo(
    () => groups.filter((group) => group.isActive).map((group) => ({ id: group.id, name: group.name })),
    [groups],
  )

  const filteredGroups = useMemo(
    () => filterCustomerGroups(groups, { query: groupQuery, status: groupStatus }),
    [groups, groupQuery, groupStatus],
  )
  const filteredRules = useMemo(
    () =>
      filterDiscountRules(rules, {
        query: ruleQuery,
        status: ruleStatus,
        audience: ruleAudience,
        target: ruleTarget,
      }),
    [rules, ruleQuery, ruleStatus, ruleAudience, ruleTarget],
  )
  const filteredPromos = useMemo(
    () =>
      filterPromoCodes(promos, {
        query: promoQuery,
        status: promoStatus,
        audience: promoAudience,
        target: promoTarget,
      }),
    [promos, promoQuery, promoStatus, promoAudience, promoTarget],
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.kind === 'group') {
        await deleteCustomerGroup(deleteTarget.item.id)
        toast.success(t('groupDeleted'))
      } else if (deleteTarget.kind === 'rule') {
        await deleteDiscountRule(deleteTarget.item.id)
        toast.success(tRules('deleted'))
      } else {
        await deletePromoCode(deleteTarget.item.id)
        toast.success(tPromo('deleted'))
      }
      setDeleteTarget(null)
      await loadAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('deleteError'))
    } finally {
      setDeleting(false)
    }
  }

  const targetLabel = (value: string) => {
    switch (value) {
      case 'ALL_PRODUCTS':
        return t('targetAllProducts')
      case 'CATEGORY':
        return t('targetCategory')
      case 'PRODUCT':
        return t('targetProduct')
      case 'VARIANT':
        return t('targetVariant')
      default:
        return value
    }
  }

  const combinationLabel = (value: string) => {
    switch (value) {
      case 'BEST_PRICE':
        return tRules('combinationBestPrice')
      case 'STACK':
        return tRules('combinationStack')
      case 'MAX_OF':
        return tRules('combinationMaxOf')
      default:
        return value
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">{t('pageTitle')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('pageHint')}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : loadError ? (
          <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button type="button" size="sm" variant="outline" onClick={() => void loadAll()}>
              {t('retry')}
            </Button>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="groups" className="text-xs sm:text-sm">
                {t('tabGroups')} ({groups.length})
              </TabsTrigger>
              <TabsTrigger value="rules" className="text-xs sm:text-sm">
                {t('tabRules')} ({rules.length})
              </TabsTrigger>
              <TabsTrigger value="promos" className="text-xs sm:text-sm">
                {t('tabPromos')} ({promos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="groups" className="space-y-3 pt-3">
              <ListToolbar
                query={groupQuery}
                onQueryChange={setGroupQuery}
                status={groupStatus}
                onStatusChange={setGroupStatus}
                searchPlaceholder={t('searchGroups')}
                onCreate={() => setGroupDialog('new')}
                createLabel={t('newGroup')}
              />
              <p className="text-[11px] text-muted-foreground">
                {t('showingOf', { shown: filteredGroups.length, total: groups.length })}
              </p>
              {!filteredGroups.length ? (
                <EmptyState message={groups.length ? t('emptyFiltered') : t('emptyGroups')} />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full min-w-[36rem] text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">{t('colName')}</th>
                        <th className="px-3 py-2 font-medium">{t('colStatus')}</th>
                        <th className="hidden px-3 py-2 font-medium sm:table-cell">{t('colCounts')}</th>
                        <th className="px-3 py-2 font-medium text-right">{t('colActions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGroups.map((group) => (
                        <tr key={group.id} className="border-b border-border/50 last:border-0">
                          <td className="px-3 py-2.5">
                            <p className="font-medium leading-tight">{group.name}</p>
                            <p className="text-xs text-muted-foreground">{group.slug}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant={group.isActive ? 'default' : 'secondary'} className="text-[10px]">
                              {group.isActive ? t('active') : t('inactive')}
                            </Badge>
                          </td>
                          <td className="hidden px-3 py-2.5 text-xs text-muted-foreground sm:table-cell">
                            {t('groupCounts', {
                              users: group.usersCount,
                              rules: group.discountRulesCount,
                              promos: group.promoCodesCount,
                            })}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setGroupDialog(group)}
                              aria-label={t('edit')}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setDeleteTarget({ kind: 'group', item: group })}
                              aria-label={t('delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="rules" className="space-y-3 pt-3">
              <ListToolbar
                query={ruleQuery}
                onQueryChange={setRuleQuery}
                status={ruleStatus}
                onStatusChange={setRuleStatus}
                audience={ruleAudience}
                onAudienceChange={setRuleAudience}
                target={ruleTarget}
                onTargetChange={setRuleTarget}
                showAudience
                showTarget
                searchPlaceholder={t('searchRules')}
                createHref="/backstage/promotions/discount-rules/new"
                createLabel={t('newRule')}
              />
              <p className="text-[11px] text-muted-foreground">
                {t('showingOf', { shown: filteredRules.length, total: rules.length })}
              </p>
              {!filteredRules.length ? (
                <EmptyState message={rules.length ? t('emptyFiltered') : t('emptyRules')} />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full min-w-[44rem] text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">{t('colName')}</th>
                        <th className="px-3 py-2 font-medium">{t('colValue')}</th>
                        <th className="hidden px-3 py-2 font-medium md:table-cell">{t('colScope')}</th>
                        <th className="hidden px-3 py-2 font-medium lg:table-cell">{t('colAudience')}</th>
                        <th className="px-3 py-2 font-medium">{t('colStatus')}</th>
                        <th className="px-3 py-2 font-medium text-right">{t('colActions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRules.map((rule) => (
                        <tr key={rule.id} className="border-b border-border/50 last:border-0">
                          <td className="px-3 py-2.5">
                            <p className="font-medium leading-tight">{rule.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {combinationLabel(rule.combinesWithOtherDiscounts)}
                              {ruleExclusionsCount(rule)
                                ? ` · ${t('exclusionsCount', { count: ruleExclusionsCount(rule) })}`
                                : ''}
                            </p>
                          </td>
                          <td className="max-w-[16rem] px-3 py-2.5 text-xs font-medium leading-snug">
                            {ruleValueLabel(rule)}
                          </td>
                          <td className="hidden px-3 py-2.5 text-xs text-muted-foreground md:table-cell">
                            {targetLabel(rule.target)}
                            {formatDateRange(rule.startDate, rule.endDate)
                              ? ` · ${formatDateRange(rule.startDate, rule.endDate)}`
                              : ''}
                          </td>
                          <td className="hidden px-3 py-2.5 lg:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {(rule.eligibleAudiences?.length
                                ? rule.eligibleAudiences
                                : (['LEGACY'] as const)
                              ).map((audience) => (
                                <Badge key={String(audience)} variant="outline" className="text-[10px]">
                                  {audience === 'RETAIL'
                                    ? t('audienceRetail')
                                    : audience === 'WHOLESALER'
                                      ? t('audienceWholesale')
                                      : t('audienceLegacy')}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant={rule.isActive ? 'default' : 'secondary'} className="text-[10px]">
                              {rule.isActive ? t('active') : t('inactive')}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <a
                              href={`/backstage/promotions/discount-rules/${rule.id}/edit`}
                              className={cn(
                                buttonVariants({ variant: 'ghost', size: 'icon' }),
                                'inline-flex h-8 w-8',
                              )}
                              aria-label={t('edit')}
                            >
                              <Pencil className="h-4 w-4" />
                            </a>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setDeleteTarget({ kind: 'rule', item: rule })}
                              aria-label={t('delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="promos" className="space-y-3 pt-3">
              <ListToolbar
                query={promoQuery}
                onQueryChange={setPromoQuery}
                status={promoStatus}
                onStatusChange={setPromoStatus}
                audience={promoAudience}
                onAudienceChange={setPromoAudience}
                target={promoTarget}
                onTargetChange={setPromoTarget}
                showAudience
                showTarget
                searchPlaceholder={t('searchPromos')}
                onCreate={() => setPromoDialog('new')}
                createLabel={t('newPromo')}
              />
              <p className="text-[11px] text-muted-foreground">
                {t('showingOf', { shown: filteredPromos.length, total: promos.length })}
              </p>
              {!filteredPromos.length ? (
                <EmptyState message={promos.length ? t('emptyFiltered') : t('emptyPromos')} />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full min-w-[44rem] text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">{t('colCode')}</th>
                        <th className="px-3 py-2 font-medium">{t('colValue')}</th>
                        <th className="hidden px-3 py-2 font-medium md:table-cell">{t('colScope')}</th>
                        <th className="hidden px-3 py-2 font-medium lg:table-cell">{t('colUsage')}</th>
                        <th className="px-3 py-2 font-medium">{t('colStatus')}</th>
                        <th className="px-3 py-2 font-medium text-right">{t('colActions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPromos.map((promo) => {
                        const benefit = promoBenefitParts(promo)
                        return (
                          <tr key={promo.id} className="border-b border-border/50 last:border-0">
                            <td className="px-3 py-2.5">
                              <p className="font-mono text-sm font-semibold leading-tight">{promo.code}</p>
                              <p className="text-xs text-muted-foreground">{promo.name}</p>
                            </td>
                            <td className="px-3 py-2.5 text-xs">
                              {benefit.percent != null ? (
                                <span>{tPromo('benefitPercentCart', { value: benefit.percent })}</span>
                              ) : null}
                              {benefit.fixed != null ? (
                                <span>{tPromo('benefitFixedCart', { value: benefit.fixed })}</span>
                              ) : null}
                              {benefit.gift ? (
                                <span className={cn(benefit.percent != null || benefit.fixed != null ? ' · ' : '')}>
                                  {tPromo('benefitGift')}
                                </span>
                              ) : null}
                              {!benefit.percent && !benefit.fixed && !benefit.gift ? '—' : null}
                            </td>
                            <td className="hidden px-3 py-2.5 text-xs text-muted-foreground md:table-cell">
                              {targetLabel(promo.target)}
                              {promoExclusionsCount(promo)
                                ? ` · ${t('exclusionsCount', { count: promoExclusionsCount(promo) })}`
                                : ''}
                              {formatDateRange(promo.validFrom, promo.validTo)
                                ? ` · ${formatDateRange(promo.validFrom, promo.validTo)}`
                                : ''}
                            </td>
                            <td className="hidden px-3 py-2.5 text-xs text-muted-foreground lg:table-cell">
                              {t('usagesCount', { count: promo.usagesCount })}
                            </td>
                            <td className="px-3 py-2.5">
                              <Badge variant={promo.isActive ? 'default' : 'secondary'} className="text-[10px]">
                                {promo.isActive ? t('active') : t('inactive')}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setPromoDialog(promo)}
                                aria-label={t('edit')}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setDeleteTarget({ kind: 'promo', item: promo })}
                                aria-label={t('delete')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
      <PromoCodeDialog
        open={promoDialog !== null}
        item={promoDialog === 'new' ? null : promoDialog}
        groups={groupOptions}
        allPromoCodes={promos.filter(
          (promo) => promo.id !== (promoDialog !== 'new' ? promoDialog?.id : undefined),
        )}
        onClose={() => setPromoDialog(null)}
        onSaved={() => void loadAll()}
      />

      <PromotionsDeleteConfirm
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={
          deleteTarget?.kind === 'group'
            ? t('deleteGroupTitle')
            : deleteTarget?.kind === 'rule'
              ? t('deleteRuleTitle')
              : t('deletePromoTitle')
        }
        description={
          deleteTarget?.kind === 'group'
            ? t('deleteGroupDescription', { name: deleteTarget.item.name })
            : deleteTarget?.kind === 'rule'
              ? t('deleteRuleDescription', { name: deleteTarget.item.name })
              : deleteTarget
                ? t('deletePromoDescription', { code: deleteTarget.item.code })
                : ''
        }
        confirming={deleting}
        onConfirm={() => void handleDelete()}
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
  const t = useTranslations('promotions')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [baseline, setBaseline] = useState<string | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(item?.name ?? '')
    setSlug(item?.slug ?? '')
    setDescription(item?.description ?? '')
    setIsActive(item?.isActive ?? true)
    setFieldErrors({})
    const snap = stableStringify({
      name: item?.name ?? '',
      slug: item?.slug ?? '',
      description: item?.description ?? '',
      isActive: item?.isActive ?? true,
    })
    setBaseline(snap)
  }, [open, item])

  const dirty = isFormDirty(baseline, { name, slug, description, isActive })

  const requestClose = () => {
    if (saving) return
    if (dirty) setDiscardOpen(true)
    else onClose()
  }

  const handleSave = async () => {
    if (saving) return
    const errors = validateCustomerGroupDraft({ name, slug })
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors as Record<string, string>)
      return
    }
    setFieldErrors({})
    setSaving(true)
    try {
      await saveCustomerGroup({ name, slug, description, isActive }, item?.id)
      toast.success(item ? t('groupUpdated') : t('groupCreated'))
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(value) => !value && requestClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{item ? t('editGroupTitle') : t('newGroupTitle')}</DialogTitle>
            <DialogDescription className="sr-only">{t('groupDialogDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('colName')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
              {fieldErrors.name ? (
                <p className="text-xs text-destructive">{t(fieldErrors.name)}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('slug')}</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="wholesale"
                className="h-9 text-sm"
              />
              {fieldErrors.slug ? (
                <p className="text-xs text-destructive">{t(fieldErrors.slug)}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('description')}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label className="text-sm">{t('active')}</Label>
            </div>
          </div>
          <DialogFooter>
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
