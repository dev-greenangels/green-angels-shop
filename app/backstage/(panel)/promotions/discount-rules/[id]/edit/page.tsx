'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AdminLayout } from '@/components/admin/admin-layout'
import { DiscountRuleEditor } from '@/components/backstage/discount-rule-form'
import {
  fetchCustomerGroups,
  fetchDiscountRules,
  type DiscountRuleItem,
} from '@/lib/backstage/pricing'

function Loading() {
  const t = useTranslations('discountRules')
  return (
    <AdminLayout>
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t('loading')}
      </div>
    </AdminLayout>
  )
}

function EditDiscountRuleInner() {
  const t = useTranslations('discountRules')
  const params = useParams()
  const searchParams = useSearchParams()
  const ruleId = typeof params.id === 'string' ? params.id : ''
  const returnTo = searchParams.get('returnTo') ?? '/backstage/promotions'
  const lockedVariantId = searchParams.get('lockedVariantId')
  const lockedVariantLabel = searchParams.get('lockedVariantLabel')

  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([])
  const [item, setItem] = useState<DiscountRuleItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!ruleId) {
      setError(t('loadError'))
      setReady(true)
      return
    }
    let cancelled = false
    setReady(false)
    setError(null)
    void Promise.all([fetchDiscountRules(), fetchCustomerGroups()])
      .then(([rules, groupRows]) => {
        if (cancelled) return
        const found = rules.find((rule) => rule.id === ruleId) ?? null
        if (!found) {
          setItem(null)
          setError(t('loadError'))
          return
        }
        setItem(found)
        setGroups(groupRows.filter((g) => g.isActive).map((g) => ({ id: g.id, name: g.name })))
      })
      .catch(() => {
        if (!cancelled) {
          setItem(null)
          setError(t('loadError'))
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per ruleId
  }, [ruleId])

  return (
    <AdminLayout>
      {!ready ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t('loading')}
        </div>
      ) : error || !item ? (
        <div className="mx-auto max-w-5xl py-16 text-center text-sm text-muted-foreground">
          {error ?? t('loadError')}
        </div>
      ) : (
        <DiscountRuleEditor
          item={item}
          groups={groups}
          returnTo={returnTo}
          lockedVariant={
            lockedVariantId
              ? {
                  id: lockedVariantId,
                  label: lockedVariantLabel?.trim() || lockedVariantId.slice(0, 8),
                }
              : null
          }
        />
      )}
    </AdminLayout>
  )
}

export default function EditDiscountRulePage() {
  return (
    <Suspense fallback={<Loading />}>
      <EditDiscountRuleInner />
    </Suspense>
  )
}
