'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, Loader2, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import {
  AccountPageEmpty,
  AccountPageError,
  AccountPageLoading,
} from '@/components/account/account-page-state'
import { AccountListPagination } from '@/components/account/account-list-pagination'
import { Button } from '@/components/ui/button'
import {
  fetchAccountStockNotifications,
  removeAccountStockNotification,
  type AccountStockNotificationItem,
} from '@/lib/account/api'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
const PAGE_SIZE = 20

export function AccountNotificationsContent() {
  const t = useTranslations('account')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [items, setItems] = useState<AccountStockNotificationItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    void fetchAccountStockNotifications({ page, pageSize: PAGE_SIZE })
      .then((data) => {
        setItems(data.items)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('loadError')))
      .finally(() => setLoading(false))
  }, [page, t])

  useEffect(() => {
    load()
  }, [load])

  const handleRemove = async (id: string) => {
    setRemovingId(id)
    try {
      await removeAccountStockNotification(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      toast.success(t('subscriptionCancelled'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('cancelFailed'))
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return <AccountPageLoading />
  }

  if (error) {
    return <AccountPageError message={error} onRetry={load} />
  }

  const active = items.filter((item) => !item.notifiedAt)
  const notified = items.filter((item) => item.notifiedAt)

  if (total === 0 && !active.length && !notified.length) {
    return (
      <AccountPageEmpty
        icon={Bell}
        title={t('noActiveSubscriptions')}
        body={t('notificationsHint')}
      />
    )
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">{t('notificationsTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('notificationsHint')}</p>
        {!active.length ? (
          <AccountPageEmpty icon={Bell} title={t('noActiveSubscriptions')} />
        ) : (
          active.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm"
            >
              <div className="min-w-0">
                <Link
                  href={`/product/${item.productSlug}`}
                  className="pressable break-words font-medium text-primary hover:underline"
                >
                  {item.productName}
                </Link>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {t('subscribedAt', {
                    date: formatDateTime(item.createdAt, locale, 'dateLong'),
                  })}
                  {item.email ? ` · ${item.email}` : ''}
                  {item.phone ? ` · ${item.phone}` : ''}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 w-full shrink-0 sm:w-auto"
                disabled={removingId === item.id}
                onClick={() => void handleRemove(item.id)}
              >
                {removingId === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    {tc('cancel')}
                  </>
                )}
              </Button>
            </article>
          ))
        )}
      </section>

      {notified.length ? (
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-semibold text-muted-foreground">
            {t('sentNotifications')}
          </h2>
          {notified.map((item) => (
            <article
              key={item.id}
              className={cn(
                'rounded-xl border border-border/40 bg-muted/30 p-4 text-sm text-muted-foreground',
              )}
            >
              <Link href={`/product/${item.productSlug}`} className="pressable break-words font-medium text-foreground">
                {item.productName}
              </Link>
              {item.notifiedAt ? (
                <p className="mt-1">
                  {t('notifiedAt', {
                    date: formatDateTime(item.notifiedAt, locale, 'dateLong'),
                  })}
                </p>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
      <AccountListPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
        onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
      />
    </div>
  )
}
