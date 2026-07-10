'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, Loader2, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  fetchAccountStockNotifications,
  removeAccountStockNotification,
  type AccountStockNotificationItem,
} from '@/lib/account/api'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-GB' : locale === 'sk' ? 'sk-SK' : 'uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function AccountNotificationsContent() {
  const t = useTranslations('account')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [items, setItems] = useState<AccountStockNotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    void fetchAccountStockNotifications()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : t('loadError')))
      .finally(() => setLoading(false))
  }, [t])

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
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {tc('loading')}
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  const active = items.filter((item) => !item.notifiedAt)
  const notified = items.filter((item) => item.notifiedAt)

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">{t('notificationsTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('notificationsHint')}</p>
        {!active.length ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Bell className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t('noActiveSubscriptions')}</p>
          </div>
        ) : (
          active.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm"
            >
              <div className="min-w-0">
                <Link
                  href={`/product/${item.productSlug}`}
                  className="pressable font-medium text-primary hover:underline"
                >
                  {item.productName}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('subscribedAt', { date: formatDate(item.createdAt, locale) })}
                  {item.email ? ` · ${item.email}` : ''}
                  {item.phone ? ` · ${item.phone}` : ''}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
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
              <Link href={`/product/${item.productSlug}`} className="pressable font-medium text-foreground">
                {item.productName}
              </Link>
              <p className="mt-1">
                {item.notifiedAt
                  ? t('notifiedAt', { date: formatDate(item.notifiedAt, locale) })
                  : '—'}
              </p>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  )
}
