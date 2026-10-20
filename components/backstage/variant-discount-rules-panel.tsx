'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  deleteDiscountRule,
  fetchDiscountRulesForVariant,
  type DiscountRuleItem,
} from '@/lib/backstage/pricing'
import { ruleValueLabel } from '@/lib/backstage/promotions-list'

function RuleRow({
  rule,
  editHref,
  onDelete,
}: {
  rule: DiscountRuleItem
  editHref: string
  onDelete: () => void
}) {
  const t = useTranslations('discountRules')
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
      <div className="min-w-0 space-y-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium">{rule.name}</span>
          {!rule.isActive ? <Badge variant="secondary">{t('inactive')}</Badge> : null}
          {(rule.eligibleAudiences ?? []).map((a) => (
            <Badge key={a} variant="outline" className="text-[10px]">
              {a === 'RETAIL' ? t('audienceRetailShort') : t('audienceWholesaleShort')}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{ruleValueLabel(rule)}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        <a
          href={editHref}
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'inline-flex h-8 w-8')}
          aria-label={t('editTitle')}
        >
          <Pencil className="h-4 w-4" />
        </a>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function VariantDiscountRulesPanel({
  variantId,
  variantLabel,
}: {
  variantId: string | null | undefined
  variantLabel: string
}) {
  const t = useTranslations('discountRules')
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [directRules, setDirectRules] = useState<DiscountRuleItem[]>([])
  const [massRules, setMassRules] = useState<DiscountRuleItem[]>([])

  const lockedQuery = useMemo(() => {
    const params = new URLSearchParams({
      lockedVariantId: variantId ?? '',
      lockedVariantLabel: variantLabel,
      returnTo: pathname || '/backstage/products',
    })
    return params.toString()
  }, [variantId, variantLabel, pathname])

  const load = useCallback(async () => {
    if (!variantId) {
      setDirectRules([])
      setMassRules([])
      return
    }
    setLoading(true)
    try {
      const rules = await fetchDiscountRulesForVariant(variantId)
      setDirectRules(rules.directRules)
      setMassRules(rules.massRules)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [variantId, t])

  useEffect(() => {
    void load()
  }, [load])

  if (!variantId) {
    return (
      <div className="space-y-2 border-t border-border/60 pt-4">
        <Label>{t('variantPanelTitle')}</Label>
        <p className="text-xs text-muted-foreground">{t('saveProductFirst')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 border-t border-border/60 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Label>{t('variantPanelTitle')}</Label>
          <p className="text-xs text-muted-foreground">{t('variantPanelHint')}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" className="h-8" asChild>
            <Link href="/backstage/promotions" className="inline-flex items-center">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              {t('openPromotionsPage')}
            </Link>
          </Button>
          <a
            href={`/backstage/promotions/discount-rules/new?${lockedQuery}`}
            className={cn(buttonVariants({ size: 'sm' }), 'inline-flex h-8 items-center')}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t('addVariantRule')}
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t('loading')}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t('directRules')}</p>
            {directRules.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('noDirectRules')}</p>
            ) : (
              directRules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  editHref={`/backstage/promotions/discount-rules/${rule.id}/edit?${lockedQuery}`}
                  onDelete={() => {
                    void (async () => {
                      try {
                        await deleteDiscountRule(rule.id)
                        toast.success(t('deleted'))
                        await load()
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : t('deleteError'))
                      }
                    })()
                  }}
                />
              ))
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t('massRules')}</p>
            {massRules.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('noMassRules')}</p>
            ) : (
              massRules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  editHref={`/backstage/promotions/discount-rules/${rule.id}/edit?returnTo=${encodeURIComponent('/backstage/promotions')}`}
                  onDelete={() => {
                    void (async () => {
                      try {
                        await deleteDiscountRule(rule.id)
                        toast.success(t('deleted'))
                        await load()
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : t('deleteError'))
                      }
                    })()
                  }}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
