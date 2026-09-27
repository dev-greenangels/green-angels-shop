'use client'

import { useEffect, useState } from 'react'
import { Loader2, Paperclip, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import {
  sendBackstageOrderManualEmail,
  type BackstageOrderCommunication,
} from '@/lib/backstage/orders'
import { formatDateTime } from '@/lib/i18n/format-datetime'

function audienceLabel(
  audience: string,
  t: ReturnType<typeof useTranslations<'orderCommunications'>>,
): string {
  return audience === 'STAFF' ? t('audienceStaff') : t('audienceCustomer')
}

function statusLabel(
  status: string,
  t: ReturnType<typeof useTranslations<'orderCommunications'>>,
): string {
  switch (status) {
    case 'SENT':
      return t('statusSent')
    case 'FAILED':
      return t('statusFailed')
    case 'PENDING':
      return t('statusPending')
    case 'SKIPPED':
      return t('statusSkipped')
    default:
      return status
  }
}

function typeLabel(
  type: string,
  t: ReturnType<typeof useTranslations<'orderCommunications'>>,
): string {
  const map: Record<string, string> = {
    ORDER_CONFIRMATION_PDF: t('type_ORDER_CONFIRMATION_PDF'),
    CUSTOMER_AWAITING_PAYMENT: t('type_CUSTOMER_AWAITING_PAYMENT'),
    CUSTOMER_PAYMENT_REMINDER: t('type_CUSTOMER_PAYMENT_REMINDER'),
    CUSTOMER_CANCELLED_UNPAID: t('type_CUSTOMER_CANCELLED_UNPAID'),
    CUSTOMER_LATE_PAY_REFUND: t('type_CUSTOMER_LATE_PAY_REFUND'),
    MANAGER_ORDER_READY: t('type_MANAGER_ORDER_READY'),
    MANAGER_ORDER_CANCELLED_UNPAID: t('type_MANAGER_ORDER_CANCELLED_UNPAID'),
    MANAGER_LATE_PAY_REFUND: t('type_MANAGER_LATE_PAY_REFUND'),
    MANUAL_CUSTOMER_EMAIL: t('type_MANUAL_CUSTOMER_EMAIL'),
  }
  return map[type] ?? type
}

export function OrderCommunicationsPanel({
  orderId,
  defaultRecipient,
  confirmationPdfPresent,
  initialCommunications,
  onSent,
}: {
  orderId: string
  defaultRecipient: string | null
  confirmationPdfPresent: boolean
  initialCommunications: BackstageOrderCommunication[]
  onSent?: (row: BackstageOrderCommunication) => void
}) {
  const t = useTranslations('orderCommunications')
  const { locale } = useBackstageUiLocale()
  const [items, setItems] = useState(initialCommunications)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachPdf, setAttachPdf] = useState(false)
  const [sending, setSending] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )

  useEffect(() => {
    setItems(initialCommunications)
  }, [initialCommunications])

  useEffect(() => {
    setIdempotencyKey(
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    )
  }, [orderId])

  const handleSend = async () => {
    if (sending) return
    setSending(true)
    try {
      const row = await sendBackstageOrderManualEmail(orderId, {
        subject: subject.trim(),
        body: body.trim(),
        attachConfirmationPdf: attachPdf,
        idempotencyKey,
      })
      setItems((prev) => {
        const without = prev.filter((x) => x.id !== row.id)
        return [row, ...without]
      })
      onSent?.(row)
      setSubject('')
      setBody('')
      setAttachPdf(false)
      setIdempotencyKey(
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      )
      toast.success(t('sendSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('sendError'))
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {confirmationPdfPresent ? t('pdfPresent') : t('pdfAbsent')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 rounded-md border border-border p-3">
          <p className="text-sm font-medium">{t('manualTitle')}</p>
          <div className="space-y-1.5">
            <Label htmlFor="order-comm-to">{t('recipient')}</Label>
            <Input
              id="order-comm-to"
              value={defaultRecipient ?? ''}
              disabled
              readOnly
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="order-comm-subject">{t('subject')}</Label>
            <Input
              id="order-comm-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="order-comm-body">{t('body')}</Label>
            <Textarea
              id="order-comm-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={10000}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={attachPdf}
              onCheckedChange={(v) => setAttachPdf(v === true)}
            />
            {t('attachPdf')}
          </label>
          <Button
            type="button"
            size="sm"
            disabled={sending || !subject.trim() || !body.trim() || !defaultRecipient}
            onClick={() => void handleSend()}
          >
            {sending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}
            {t('send')}
          </Button>
        </div>

        {items.length === 0 ? (
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
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {audienceLabel(row.audience, t)}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {row.source === 'MANUAL' ? t('sourceManual') : t('sourceAutomatic')}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {statusLabel(row.status, t)}
                  </span>
                  {row.hasAttachment ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Paperclip className="h-3 w-3" />
                      PDF
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 font-medium">
                  {row.subjectSnapshot?.trim() || typeLabel(row.type, t)}
                </p>
                <p className="text-muted-foreground">{row.toEmail ?? '—'}</p>
                {row.errorMessage ? (
                  <p className="mt-1 text-xs text-destructive">{row.errorMessage}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
