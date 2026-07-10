'use client'

import { useState } from 'react'
import { PenLine } from 'lucide-react'
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

type ReviewLeaveFlowProps = {
  onSubmitted?: () => void
  className?: string
  productId?: string
  productName?: string
}

export function ReviewLeaveFlow({
  onSubmitted,
  className,
  productId,
  productName,
}: ReviewLeaveFlowProps) {
  const t = useTranslations('reviews')
  const { user } = useSession()
  const pathname = usePathname()
  const [authOpen, setAuthOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  const handleClick = () => {
    if (user) {
      setFormOpen(true)
      return
    }
    setAuthOpen(true)
  }

  return (
    <>
      <Button type="button" onClick={handleClick} className={className}>
        <PenLine className="mr-2 h-4 w-4" />
        {t('leaveReview')}
      </Button>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('signInToReview')}</DialogTitle>
            <DialogDescription>{t('signInToReviewHint')}</DialogDescription>
          </DialogHeader>
          <AuthPhoneFlow
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
      />
    </>
  )
}
