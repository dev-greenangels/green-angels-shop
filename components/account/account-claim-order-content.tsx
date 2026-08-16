'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Link2, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

import {
  AccountPageError,
  AccountPageLoading,
} from '@/components/account/account-page-state'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import {
  attachOrphanOrder,
  fetchAccountProfile,
  type AccountProfile,
} from '@/lib/account/api'

type AttachPhase = 'idle' | 'loading' | 'success' | 'error'

function mapAttachError(err: unknown, t: ReturnType<typeof useTranslations<'account'>>) {
  const e = err as Error & { status?: number }
  if (e.status === 400) return t('claimOrderAlreadyInAccount')
  if (e.status === 403) return t('claimOrderContactMismatch')
  if (e.status === 409) return t('claimOrderConflict')
  if (e.status === 404) return t('claimOrderNotFound')
  return e.message || t('claimOrderFailed')
}

export function AccountClaimOrderContent() {
  const t = useTranslations('account')
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')?.trim() ?? ''

  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [profileReloadToken, setProfileReloadToken] = useState(0)

  const [attachPhase, setAttachPhase] = useState<AttachPhase>('idle')
  const [attachError, setAttachError] = useState<string | null>(null)
  const [alreadyInAccount, setAlreadyInAccount] = useState(false)
  const [attachedOrderNumber, setAttachedOrderNumber] = useState<string | null>(null)
  const [attachedOrderId, setAttachedOrderId] = useState<string | null>(null)

  const loadProfile = useCallback(() => {
    setProfileLoading(true)
    setProfileError(null)
    void fetchAccountProfile()
      .then(setProfile)
      .catch((e) => {
        setProfileError(e instanceof Error ? e.message : t('loadError'))
        setProfile(null)
      })
      .finally(() => setProfileLoading(false))
  }, [t])

  useEffect(() => {
    loadProfile()
  }, [loadProfile, profileReloadToken])

  const hasVerifiedContact =
    Boolean(profile?.emailVerified && profile.email) ||
    Boolean(profile?.phoneVerified && profile.phone)

  const handleAttach = async () => {
    if (!orderId || !hasVerifiedContact) return
    setAttachPhase('loading')
    setAttachError(null)
    setAlreadyInAccount(false)
    try {
      const result = await attachOrphanOrder(orderId)
      setAttachedOrderNumber(result.orderNumber)
      setAttachedOrderId(result.id)
      setAttachPhase('success')
    } catch (err) {
      const status = (err as Error & { status?: number }).status
      if (status === 400) {
        setAlreadyInAccount(true)
        setAttachedOrderId(orderId)
      }
      const message = mapAttachError(err, t)
      setAttachError(message)
      setAttachPhase('error')
    }
  }

  if (profileLoading) {
    return <AccountPageLoading />
  }

  if (profileError || !profile) {
    return (
      <AccountPageError
        message={profileError ?? t('loadError')}
        onRetry={() => setProfileReloadToken((n) => n + 1)}
      />
    )
  }

  if (attachPhase === 'success' && attachedOrderNumber) {
    return (
      <div className="max-w-lg space-y-6">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center sm:p-8">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" aria-hidden />
          <p className="break-words font-medium text-foreground">
            {t('claimOrderSuccess', { number: attachedOrderNumber })}
          </p>
          {attachedOrderId ? (
            <Button asChild className="mt-4 min-h-11 w-full sm:w-auto">
              <Link href={`/account/orders/${attachedOrderId}`}>{t('claimOrderViewOrder')}</Link>
            </Button>
          ) : null}
        </div>
        <Link
          href="/account/orders"
          className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('backToOrders')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <section className="space-y-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:p-5">
        <p className="break-words text-sm leading-relaxed text-muted-foreground">
          {t('claimOrderIntro')}
        </p>
        <p className="break-words text-sm leading-relaxed text-muted-foreground">
          {t('claimOrderHint')}
        </p>
      </section>

      {!hasVerifiedContact ? (
        <div className="space-y-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:p-5">
          <p className="break-words text-sm text-muted-foreground">{t('claimOrderVerifyContactsBody')}</p>
          <Button asChild variant="outline" className="min-h-11 w-full sm:w-auto">
            <Link href="/account/settings">{t('claimOrderGoToSettings')}</Link>
          </Button>
        </div>
      ) : null}

      {orderId ? (
        <section className="space-y-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:p-5">
          <p className="break-words text-sm text-muted-foreground">{t('claimOrderManualHint')}</p>
          {attachPhase === 'error' && attachError ? (
            <div className="space-y-3">
              <AccountPageError message={attachError} onRetry={() => void handleAttach()} />
              {alreadyInAccount && attachedOrderId ? (
                <Button asChild variant="outline" className="min-h-11 w-full sm:w-auto">
                  <Link href={`/account/orders/${attachedOrderId}`}>{t('claimOrderViewOrder')}</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
          <Button
            type="button"
            className="min-h-11 w-full sm:w-auto"
            disabled={attachPhase === 'loading' || !hasVerifiedContact}
            onClick={() => void handleAttach()}
          >
            {attachPhase === 'loading' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                {t('claimOrderAttachLoading')}
              </>
            ) : (
              t('claimOrderAttachAction')
            )}
          </Button>
        </section>
      ) : (
        <div className="rounded-xl border border-dashed p-6 text-center sm:p-8">
          <Link2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden />
          <p className="break-words text-sm text-muted-foreground">{t('claimOrderNoOrderSelected')}</p>
        </div>
      )}

      <Link
        href="/account/orders"
        className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t('backToOrders')}
      </Link>
    </div>
  )
}
