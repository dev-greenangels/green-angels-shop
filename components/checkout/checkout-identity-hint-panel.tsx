'use client'

import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AuthOAuthButtons } from '@/components/auth/auth-oauth-buttons'
import { Button } from '@/components/ui/button'
import { checkoutInsetPanelClassName } from '@/components/checkout/checkout-utils'
import { cn } from '@/lib/utils'
import type { CheckoutIdentityHint } from '@/lib/checkout/identity-hint'

type CheckoutIdentityHintPanelProps = {
  hint: CheckoutIdentityHint | null
  hintLoading: boolean
  smsEnabled: boolean
  emailEnabled: boolean
  googleEnabled: boolean
  googleLoading: boolean
  emailReady: boolean
  phoneReady: boolean
  inlineAuthChannel: 'email' | 'phone' | null
  inlineAuth?: ReactNode
  onSignInEmail: () => void
  onSignInPhone: () => void
  onGoogleSignIn: () => void
  onConflictEmailAccount: () => void
  onConflictPhoneAccount: () => void
  onContinueAsGuest: () => void
}

export function CheckoutIdentityHintPanel({
  hint,
  hintLoading,
  smsEnabled,
  emailEnabled,
  googleEnabled,
  googleLoading,
  emailReady,
  phoneReady,
  inlineAuthChannel,
  inlineAuth = null,
  onSignInEmail,
  onSignInPhone,
  onGoogleSignIn,
  onConflictEmailAccount,
  onConflictPhoneAccount,
  onContinueAsGuest,
}: CheckoutIdentityHintPanelProps) {
  const t = useTranslations('checkout.identityHint')
  const authBusy = Boolean(inlineAuthChannel)

  if (hintLoading) {
    return (
      <div
        className={cn(checkoutInsetPanelClassName, 'flex items-center gap-2 p-4 text-sm text-muted-foreground')}
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('loading')}
      </div>
    )
  }

  if (!hint) return null

  if (hint.identityResolution === 'none') {
    const canRegisterEmail = emailEnabled && emailReady
    const canRegisterPhone = smsEnabled && phoneReady && !canRegisterEmail
    const canGoogle = googleEnabled && canRegisterEmail && !authBusy
    const hasRegistration = canRegisterEmail || canRegisterPhone || canGoogle

    if (!hasRegistration) {
      return (
        <div className={cn(checkoutInsetPanelClassName, 'p-4')} aria-live="polite">
          <p className="text-sm text-muted-foreground">{t('noneGuestOnly')}</p>
        </div>
      )
    }

    return (
      <div className={cn(checkoutInsetPanelClassName, 'space-y-3 p-4')} aria-live="polite">
        <div>
          <p className="text-sm font-medium text-foreground">{t('noneTitle')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('noneCreateSuggestion')}</p>
        </div>
        {inlineAuth}
        {!authBusy ? (
          <div className="flex flex-col gap-2">
            {canRegisterEmail ? (
              <Button type="button" size="sm" className="w-full" onClick={onSignInEmail}>
                {t('noneRegisterEmail')}
              </Button>
            ) : null}
            {canRegisterPhone ? (
              <Button type="button" size="sm" className="w-full" onClick={onSignInPhone}>
                {t('noneRegisterPhone')}
              </Button>
            ) : null}
            {canGoogle ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                disabled={googleLoading}
                onClick={onGoogleSignIn}
              >
                {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('noneContinueGoogle')}
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="ghost" className="w-full" onClick={onContinueAsGuest}>
              {t('continueAsGuest')}
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  if (hint.identityResolution === 'single') {
    const matchedEmail = hint.suggestedAuth === 'email' || hint.suggestedAuth === 'either'
    const matchedPhone = hint.suggestedAuth === 'phone' || hint.suggestedAuth === 'either'
    const showEmail = emailEnabled && matchedEmail
    const showPhone = smsEnabled && matchedPhone
    const showGoogle = googleEnabled && matchedEmail && !authBusy

    if (!showEmail && !showPhone && !showGoogle) {
      return null
    }

    const titleKey =
      hint.suggestedAuth === 'phone'
        ? 'singlePhoneTitle'
        : hint.suggestedAuth === 'either'
          ? 'singleEitherTitle'
          : 'singleEmailTitle'

    return (
      <div className={cn(checkoutInsetPanelClassName, 'space-y-3 border-primary/20 bg-primary/5 p-4')}>
        <div>
          <p className="text-sm font-medium text-foreground">{t(titleKey)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('singleBody')}</p>
        </div>
        {inlineAuth}
        {!authBusy && (showEmail || showPhone) ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {showEmail ? (
              <Button type="button" size="sm" className="w-full sm:w-auto" onClick={onSignInEmail}>
                {t('singleSignInEmail')}
              </Button>
            ) : null}
            {showPhone ? (
              <Button
                type="button"
                size="sm"
                variant={showEmail ? 'outline' : 'default'}
                className="w-full sm:w-auto"
                onClick={onSignInPhone}
              >
                {t('singleSignInPhone')}
              </Button>
            ) : null}
          </div>
        ) : null}
        {showGoogle && !inlineAuth ? (
          <AuthOAuthButtons googleLoading={googleLoading} onGoogleClick={onGoogleSignIn} />
        ) : null}
      </div>
    )
  }

  if (hint.identityResolution === 'conflict') {
    return (
      <div className={cn(checkoutInsetPanelClassName, 'space-y-3 border-amber-500/30 bg-amber-500/5 p-4')}>
        <div>
          <p className="text-sm font-medium text-foreground">{t('conflictTitle')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('conflictBody')}</p>
        </div>
        {inlineAuth}
        {!authBusy ? (
          <div className="flex flex-col gap-2">
            {emailEnabled ? (
              <Button type="button" size="sm" className="w-full" onClick={onConflictEmailAccount}>
                {t('conflictContinueEmail')}
              </Button>
            ) : null}
            {smsEnabled ? (
              <Button type="button" size="sm" variant="outline" className="w-full" onClick={onConflictPhoneAccount}>
                {t('conflictContinuePhone')}
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="ghost" className="w-full" onClick={onContinueAsGuest}>
              {t('continueAsGuest')}
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  return null
}
