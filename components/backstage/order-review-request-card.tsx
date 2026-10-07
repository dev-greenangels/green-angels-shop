'use client'

import { useCallback, useEffect, useState } from 'react'
import { Copy, Eye, Link2, Loader2, Mail, RefreshCw, Ban } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { SUPPORTED_LOCALES } from '@/lib/i18n/locales'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import {
  fetchBackstageReviewRequestStatus,
  generateBackstageReviewRequest,
  previewBackstageReviewRequestEmail,
  regenerateBackstageReviewRequest,
  revokeBackstageReviewRequest,
  sendBackstageReviewRequestEmail,
  type BackstageOrderCommunication,
  type BackstageReviewRequestEmailPreview,
  type BackstageReviewRequestStatus,
} from '@/lib/backstage/orders'

function newIdempotencyKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `rr-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function daysLeftUntil(iso: string | null): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  if (Number.isNaN(ms)) return null
  if (ms <= 0) return 0
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}

export function OrderReviewRequestCard({
  orderId,
  onCommunicationSent,
}: {
  orderId: string
  onCommunicationSent?: (row: BackstageOrderCommunication) => void
}) {
  const t = useTranslations('orderReviewRequest')
  const { locale: uiLocale } = useBackstageUiLocale()
  const [status, setStatus] = useState<BackstageReviewRequestStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [rawUrl, setRawUrl] = useState<string | null>(null)
  const [urlModalOpen, setUrlModalOpen] = useState(false)
  const [preview, setPreview] = useState<BackstageReviewRequestEmailPreview | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState<null | 'regenerate' | 'send' | 'resend'>(null)
  const [emailLocale, setEmailLocale] = useState('sk')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const next = await fetchBackstageReviewRequestStatus(orderId)
      setStatus(next)
      setEmailLocale(next.locale ?? 'sk')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [orderId, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const showUrlOnce = (url: string) => {
    setRawUrl(url)
    setUrlModalOpen(true)
  }

  const handleGenerate = async () => {
    setBusy(true)
    try {
      const result = await generateBackstageReviewRequest(orderId)
      showUrlOnce(result.reviewUrl)
      await refresh()
      toast.success(t('generateSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('actionError'))
    } finally {
      setBusy(false)
    }
  }

  const handleRegenerate = async () => {
    setBusy(true)
    try {
      const result = await regenerateBackstageReviewRequest(orderId)
      setConfirmOpen(null)
      showUrlOnce(result.reviewUrl)
      await refresh()
      toast.success(t('regenerateSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('actionError'))
    } finally {
      setBusy(false)
    }
  }

  const handleRevoke = async () => {
    setBusy(true)
    try {
      await revokeBackstageReviewRequest(orderId)
      setRawUrl(null)
      await refresh()
      toast.success(t('revokeSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('actionError'))
    } finally {
      setBusy(false)
    }
  }

  const handlePreview = async () => {
    setBusy(true)
    try {
      const data = await previewBackstageReviewRequestEmail(orderId, { locale: emailLocale })
      setPreview(data)
      setPreviewOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('actionError'))
    } finally {
      setBusy(false)
    }
  }

  const handleSend = async (confirmRegenerate: boolean) => {
    setBusy(true)
    try {
      const result = await sendBackstageReviewRequestEmail(orderId, {
        locale: emailLocale,
        confirmRegenerate,
        idempotencyKey: newIdempotencyKey(),
      })
      setConfirmOpen(null)
      // Only surface plaintext URL after mint/rotate — not on every stable resend.
      if (result.reviewUrl && (confirmRegenerate || result.regenerated || !status?.exists)) {
        showUrlOnce(result.reviewUrl)
      }
      onCommunicationSent?.({
        id: result.communication.id,
        orderId,
        orderNumber: null,
        audience: 'CUSTOMER',
        type: result.communication.type,
        source: result.communication.source,
        status: result.communication.status,
        toEmail: result.communication.toEmail,
        subjectSnapshot: result.communication.subjectSnapshot,
        bodySnapshot: result.communication.bodySnapshot ?? null,
        locale: result.communication.locale ?? null,
        createdByUserId: null,
        hasAttachment: false,
        errorMessage: result.communication.errorMessage,
        providerMessageId: result.communication.providerMessageId,
        sentAt: result.communication.sentAt,
        createdAt: result.communication.createdAt,
      })
      await refresh()
      toast.success(t('sendSuccess'))
    } catch (err) {
      const code = (err as Error & { code?: string }).code
      if (code === 'REVIEW_REQUEST_REGENERATE_REQUIRED' || (err as Error & { status?: number }).status === 409) {
        setConfirmOpen(status?.sentAt ? 'resend' : 'send')
      } else {
        toast.error(err instanceof Error ? err.message : t('actionError'))
        // FAILED Communication is now committed server-side — surface it in the order history list.
        try {
          const next = await fetchBackstageReviewRequestStatus(orderId)
          setStatus(next)
          setEmailLocale(next.locale ?? 'sk')
          const failed = next.latestFailedCommunication
          if (failed) {
            onCommunicationSent?.({
              id: failed.id,
              orderId,
              orderNumber: null,
              audience: 'CUSTOMER',
              type: 'CUSTOMER_REVIEW_REQUEST',
              source: failed.source,
              status: failed.status,
              toEmail: next.customerEmail,
              subjectSnapshot: null,
              bodySnapshot: null,
              locale: next.locale,
              createdByUserId: null,
              hasAttachment: false,
              errorMessage: failed.errorMessage,
              providerMessageId: null,
              sentAt: failed.sentAt,
              createdAt: failed.createdAt,
            })
          }
        } catch {
          /* ignore refresh errors after send failure */
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const copyUrl = async () => {
    if (!rawUrl) return
    try {
      await navigator.clipboard.writeText(rawUrl)
      toast.success(t('copied'))
    } catch {
      toast.error(t('copyFailed'))
    }
  }

  if (loading || !status) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          {t('loading')}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {status.featureEnabled ? t('featureOn') : t('featureOff')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">{t('status')}: </span>
              {t(`derived.${status.derivedStatus}`)}
            </p>
            <p>
              <span className="text-muted-foreground">{t('locale')}: </span>
              {status.locale ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">{t('automaticSending')}: </span>
              {status.automaticSendingEnabled ? t('automaticOn') : t('automaticOff')}
            </p>
            <p>
              <span className="text-muted-foreground">{t('expectedAutomaticSend')}: </span>
              {status.expectedAutomaticSendAt
                ? formatDateTime(status.expectedAutomaticSendAt, uiLocale, 'datetime')
                : '—'}
            </p>
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              {t('expectedAutomaticSendHint')}
            </p>
            <p>
              <span className="text-muted-foreground">{t('createdAt')}: </span>
              {status.createdAt
                ? formatDateTime(status.createdAt, uiLocale, 'datetime')
                : '—'}
            </p>
            <p>
              <span className="text-muted-foreground">{t('expiresAt')}: </span>
              {status.expiresAt
                ? formatDateTime(status.expiresAt, uiLocale, 'datetime')
                : '—'}
            </p>
            {status.derivedStatus === 'ACTIVE' && status.expiresAt ? (
              <p>
                <span className="text-muted-foreground">{t('daysLeft')}: </span>
                {t('daysLeftValue', {
                  count: daysLeftUntil(status.expiresAt) ?? 0,
                })}
              </p>
            ) : null}
            <p>
              <span className="text-muted-foreground">{t('sentAt')}: </span>
              {status.sentAt ? formatDateTime(status.sentAt, uiLocale, 'datetime') : '—'}
            </p>
            <p>
              <span className="text-muted-foreground">{t('completedAt')}: </span>
              {status.completedAt
                ? formatDateTime(status.completedAt, uiLocale, 'datetime')
                : '—'}
            </p>
            <p>
              <span className="text-muted-foreground">{t('lastOpenedAt')}: </span>
              {status.lastOpenedAt
                ? formatDateTime(status.lastOpenedAt, uiLocale, 'datetime')
                : '—'}
            </p>
            <p>
              <span className="text-muted-foreground">{t('progress')}: </span>
              {t('storeProgress', {
                state: status.storeReviewed ? t('reviewed') : t('notReviewed'),
              })}
              {' · '}
              {t('productsProgress', {
                reviewed: status.productsReviewed,
                total: status.productsTotal,
              })}
            </p>
          </div>

          {status.latestFailedCommunication && !status.sentAt ? (
            <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs">
              <p className="font-medium text-destructive">{t('lastFailedTitle')}</p>
              <p>
                <span className="text-muted-foreground">{t('lastFailedAt')}: </span>
                {formatDateTime(status.latestFailedCommunication.createdAt, uiLocale, 'datetime')}
              </p>
              <p>
                <span className="text-muted-foreground">{t('lastFailedError')}: </span>
                {status.latestFailedCommunication.errorMessage?.trim() || t('lastFailedUnknown')}
              </p>
              <p className="text-muted-foreground">{t('lastFailedHint')}</p>
            </div>
          ) : null}

          {status.events?.length ? (
            <div className="space-y-1">
              <p className="text-muted-foreground">{t('eventHistory')}</p>
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border/60 px-3 py-2 text-xs">
                {status.events.map((event) => (
                  <li key={event.id} className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <span>{t(`eventType.${event.type}`)}</span>
                    <span className="text-muted-foreground">
                      {formatDateTime(event.createdAt, uiLocale, 'datetime')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {status.exists && !rawUrl ? (
            <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              {status.requiresRegenerateToSend
                ? t('linkExistsLegacy')
                : t('linkExistsStable')}
            </p>
          ) : null}

          {status.derivedStatus === 'COMPLETED' ? (
            <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              {t('completedHint')}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label>{t('emailLocale')}</Label>
            <Select value={emailLocale} onValueChange={setEmailLocale}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LOCALES.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            {!status.exists ? (
              <Button
                type="button"
                size="sm"
                disabled={busy || !status.featureEnabled}
                onClick={() => void handleGenerate()}
              >
                {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Link2 className="mr-1.5 h-4 w-4" />}
                {t('generate')}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={
                    busy ||
                    !status.featureEnabled ||
                    status.derivedStatus === 'COMPLETED'
                  }
                  onClick={() => setConfirmOpen('regenerate')}
                >
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  {t('regenerate')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    busy ||
                    status.derivedStatus !== 'ACTIVE'
                  }
                  onClick={() => void handleRevoke()}
                >
                  <Ban className="mr-1.5 h-4 w-4" />
                  {t('revoke')}
                </Button>
              </>
            )}

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void handlePreview()}
            >
              <Eye className="mr-1.5 h-4 w-4" />
              {t('preview')}
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={busy || !status.canSend}
              onClick={() => {
                if (status.requiresRegenerateToSend) {
                  setConfirmOpen(status.sentAt ? 'resend' : 'send')
                } else {
                  void handleSend(false)
                }
              }}
            >
              <Mail className="mr-1.5 h-4 w-4" />
              {status.sentAt ? t('resend') : t('send')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={urlModalOpen}
        onOpenChange={(open) => {
          setUrlModalOpen(open)
          if (!open) setRawUrl(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('urlModalTitle')}</DialogTitle>
            <DialogDescription>{t('urlModalHint')}</DialogDescription>
          </DialogHeader>
          <Input value={rawUrl ?? ''} readOnly />
          <DialogFooter>
            <Button type="button" onClick={() => void copyUrl()}>
              <Copy className="mr-1.5 h-4 w-4" />
              {t('copy')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('previewTitle')}</DialogTitle>
            <DialogDescription>
              {preview?.reviewUrlIsPlaceholder ? t('previewPlaceholderHint') : t('previewRealHint')}
            </DialogDescription>
          </DialogHeader>
          {preview ? (
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">{t('recipient')}: </span>
                {preview.toEmail ?? '—'}
              </p>
              <p>
                <span className="text-muted-foreground">{t('locale')}: </span>
                {preview.locale}
              </p>
              <p className="font-medium">{preview.subject}</p>
              <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs">
                {preview.bodyText}
              </pre>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen != null} onOpenChange={(open) => !open && setConfirmOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmOpen === 'regenerate'
                ? t('regenerateConfirmTitle')
                : confirmOpen === 'resend'
                  ? t('resendConfirmTitle')
                  : t('sendConfirmTitle')}
            </DialogTitle>
            <DialogDescription>
              {confirmOpen === 'regenerate'
                ? t('regenerateConfirmBody')
                : confirmOpen === 'resend'
                  ? t('resendConfirmBody')
                  : t('sendConfirmBody')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(null)}>
              {t('cancel')}
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                if (confirmOpen === 'regenerate') void handleRegenerate()
                else void handleSend(true)
              }}
            >
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
