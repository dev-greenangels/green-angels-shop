'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AdminLayout } from '@/components/admin/admin-layout'
import { DiscountRuleEditor } from '@/components/backstage/discount-rule-form'
import { fetchCustomerGroups } from '@/lib/backstage/pricing'

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

function NewDiscountRuleInner() {
  const t = useTranslations('discountRules')
  const searchParams = useSearchParams()
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([])
  const [ready, setReady] = useState(false)

  const lockedVariantId = searchParams.get('lockedVariantId')
  const lockedVariantLabel = searchParams.get('lockedVariantLabel')
  const returnTo = searchParams.get('returnTo') ?? '/backstage/promotions'

  useEffect(() => {
    let cancelled = false
    void fetchCustomerGroups()
      .then((rows) => {
        if (cancelled) return
        setGroups(rows.filter((g) => g.isActive).map((g) => ({ id: g.id, name: g.name })))
      })
      .catch(() => {
        if (!cancelled) setGroups([])
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AdminLayout>
      {!ready ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t('loading')}
        </div>
      ) : (
        <DiscountRuleEditor
          item={null}
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

export default function NewDiscountRulePage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewDiscountRuleInner />
    </Suspense>
  )
}
