'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Paperclip } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import {
  fetchBackstageUserCommunications,
  type BackstageUserCommunication,
} from '@/lib/backstage/users'
import { formatDateTime } from '@/lib/i18n/format-datetime'

export function UserCommunicationsPanel({ userId }: { userId: string }) {
  const t = useTranslations('orderCommunications')
  const { locale } = useBackstageUiLocale()
  const [items, setItems] = useState<BackstageUserCommunication[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (nextPage: number) => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchBackstageUserCommunications(userId, {
          page: nextPage,
          pageSize: 20,
        })
        setItems(data.items)
        setPage(data.page)
        setTotalPages(data.totalPages)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('loadError'))
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [userId, t],
  )

  useEffect(() => {
    void load(1)
  }, [load])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('userTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loading')}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((row) => (
              <li
                key={row.id}
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">
                    {formatDateTime(row.sentAt ?? row.createdAt, locale, 'datetime')}
                  </span>
                  {row.orderNumber ? (
                    <a
                      href={`/backstage/orders/${row.orderId}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {row.orderNumber}
                    </a>
                  ) : null}
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {row.audience === 'STAFF' ? t('audienceStaff') : t('audienceCustomer')}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {row.status}
                  </span>
                  {row.hasAttachment ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Paperclip className="h-3 w-3" />
                      PDF
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 font-medium">
                  {row.subjectSnapshot?.trim() || row.type}
                </p>
                <p className="text-muted-foreground">{row.toEmail ?? '—'}</p>
              </li>
            ))}
          </ul>
        )}
        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || page <= 1}
              onClick={() => void load(page - 1)}
            >
              {t('prev')}
            </Button>
            <span className="text-xs text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || page >= totalPages}
              onClick={() => void load(page + 1)}
            >
              {t('next')}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
