'use client'

import { useEffect, useState } from 'react'
import { PenLine, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AuthPhoneFlow } from '@/components/auth/auth-phone-flow'
import { ReviewSubmitDialog } from '@/components/reviews/review-submit-dialog'
import { useSession } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePathname } from '@/i18n/navigation'
import { fetchPublicSiteSettingsFromApiRoute, getMarketSettings } from '@/lib/settings/fetch'
import { cn } from '@/lib/utils'

type ReviewLeaveFlowProps = {
  onSubmitted?: () => void
  className?: string
  productId?: string
  productName?: string
  /** Преміальний вигляд для головної стрічки відгуків (glass / blur). */
  variant?: 'default' | 'premium'
}

export function ReviewLeaveFlow({
  onSubmitted,
  className,
  productId,
  productName,
  variant = 'default',
}: ReviewLeaveFlowProps) {
  const t = useTranslations('reviews')
  const { user } = useSession()
  const pathname = usePathname()
  const [authOpen, setAuthOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [allowGuestReviews, setAllowGuestReviews] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchPublicSiteSettingsFromApiRoute().then((result) => {
      if (!cancelled) setAllowGuestReviews(getMarketSettings(result).allowGuestReviews)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleClick = () => {
    if (user || allowGuestReviews) {
      setFormOpen(true)
      return
    }
    setAuthOpen(true)
  }

  const isPremium = variant === 'premium'

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        className={cn(
          isPremium &&
            [
              'relative h-9 overflow-hidden rounded-full border border-white/25 bg-primary/85 px-5',
              'text-sm font-semibold tracking-wide text-primary-foreground shadow-[0_8px_28px_-8px_hsl(var(--primary)/0.55)]',
              'backdrop-blur-xl supports-[backdrop-filter]:bg-primary/70',
              'before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/25 before:to-transparent before:opacity-80',
              'hover:bg-primary/95 hover:shadow-[0_10px_32px_-8px_hsl(var(--primary)/0.65)]',
              'focus-visible:ring-primary/40',
            ].join(' '),
          className,
        )}
      >
        <span className="relative z-10 inline-flex items-center">
          {isPremium ? (
            <Sparkles className="mr-2 h-4 w-4 opacity-95" />
          ) : (
            <PenLine className="mr-2 h-4 w-4" />
          )}
          {t('leaveReview')}
        </span>
      </Button>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('signInToReview')}</DialogTitle>
            <DialogDescription>{t('signInToReviewHint')}</DialogDescription>
          </DialogHeader>
          <AuthPhoneFlow
            purpose="review"
            redirectTo={pathname}
            onSuccess={() => {
              setAuthOpen(false)
              setFormOpen(true)
            }}
          />
        </DialogContent>
      </Dialog>

      <ReviewSubmitDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={user}
        productId={productId}
        productName={productName}
        onSubmitted={onSubmitted}
        allowGuestReviews={allowGuestReviews}
      />
    </>
  )
}
