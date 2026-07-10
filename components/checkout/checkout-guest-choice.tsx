'use client'

import { useTranslations } from 'next-intl'

import { ChevronRight, LogIn, UserPlus } from 'lucide-react'

import { CheckoutGuestCartPreview } from '@/components/checkout/checkout-guest-cart-preview'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export function CheckoutGuestChoice({ onContinueAsGuest }: { onContinueAsGuest: () => void }) {
  const t = useTranslations('checkout')
  const tc = useTranslations('common')
  return (
    <div className="mx-auto min-w-0 w-full max-w-4xl">
      <div className="mb-10 text-center">
        <p className="text-lg text-muted-foreground">{t('guestChoiceTitle')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative rounded-xl border-2 border-primary/80 bg-card/95 p-6 shadow-sm lg:p-8">
          <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            {tc('recommended')}
          </div>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <LogIn className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-foreground">
                {t('signInTitle')}
              </h2>
              <p className="text-sm text-muted-foreground">{t('signInSubtitle')}</p>
            </div>
          </div>

          <ul className="mb-6 space-y-3">
            {[
              t('signInBenefit1'),
              t('signInBenefit2'),
              t('signInBenefit3'),
              t('signInBenefit4'),
            ].map((text) => (
              <li key={text} className="flex items-center gap-3 text-sm text-foreground">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <ChevronRight className="h-3 w-3 text-primary" />
                </div>
                {text}
              </li>
            ))}
          </ul>

          <Button asChild className="w-full" size="lg">
            <Link href="/auth/login?redirect=/checkout">{tc('continue')}</Link>
          </Button>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/95 p-6 shadow-sm lg:p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <UserPlus className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-foreground">
                {t('guestTitle')}
              </h2>
              <p className="text-sm text-muted-foreground">{t('guestSubtitle')}</p>
            </div>
          </div>

          <ul className="mb-6 space-y-3">
            {[
              t('guestBenefit1'),
              t('guestBenefit2'),
              t('guestBenefit3'),
            ].map((text) => (
              <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                  <ChevronRight className="h-3 w-3" />
                </div>
                {text}
              </li>
            ))}
          </ul>

          <Button variant="outline" className="w-full" size="lg" onClick={onContinueAsGuest}>
            {t('continueAsGuest')}
          </Button>
        </div>
      </div>

      <CheckoutGuestCartPreview />
    </div>
  )
}
