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
import { ProductCoverImage } from '@/components/product/product-cover-image'
import { ProductLatinName } from '@/components/product/product-latin-name'
import { Button } from '@/components/ui/button'
import {
  fetchAccountStockNotifications,
  removeAccountStockNotification,
  type AccountStockNotificationItem,
} from '@/lib/account/api'
import { ACCOUNT_ACTION_BUTTON_CLASS } from '@/lib/account/account-ui'
import { mapAccountError } from '@/lib/account/map-account-error'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
const PAGE_SIZE = 20

function NotificationProductLink({ item }: { item: AccountStockNotificationItem }) {
  return (
    <Link href={`/product/${item.productSlug}`} className="pressable flex min-w-0 items-start gap-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        <ProductCoverImage
          src={item.imageUrl}
          alt={item.productName}
          className="h-full w-full"
          imageClassName="object-cover"
          logoClassName="h-6 w-6"
          sizes="56px"
        />
      </div>
      <div className="min-w-0">
        <p className="break-words font-medium text-primary hover:underline">{item.productName}</p>
        <ProductLatinName latinName={item.latinName} />
      </div>
    </Link>
  )
}

export function AccountNotificationsContent() {
  const t = useTranslations('account')
  const tc = useTranslations('common')
  const tApi = useTranslations('apiErrors')
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
    void fetchAccountStockNotifications({ page, pageSize: PAGE_SIZE, locale })
      .then((data) => {
        setItems(data.items)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      })
      .catch((e) => setError(mapAccountError(e, tApi) || t('loadError')))
      .finally(() => setLoading(false))
  }, [locale, page, t, tApi])

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
      toast.error(mapAccountError(e, tApi) || t('cancelFailed'))
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
                <NotificationProductLink item={item} />
                <p className="mt-2 break-words text-sm text-muted-foreground">
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
                className={cn(
                  'min-h-11 w-full shrink-0 sm:w-auto',
                  ACCOUNT_ACTION_BUTTON_CLASS,
                )}
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
              <NotificationProductLink item={item} />
              {item.notifiedAt ? (
                <p className="mt-2">
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
