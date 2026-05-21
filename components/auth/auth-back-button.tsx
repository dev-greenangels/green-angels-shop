'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { safeAuthRedirect } from '@/lib/auth/redirect'
import { cn } from '@/lib/utils'

type AuthBackButtonProps = {
  fallbackHref?: string | null
  className?: string
}

export function AuthBackButton({ fallbackHref, className }: AuthBackButtonProps) {
  const router = useRouter()
  const t = useTranslations('auth')
  const safeFallback = safeAuthRedirect(fallbackHref ?? '/')

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push(safeFallback)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={cn(
        '-ml-2 h-9 gap-1.5 px-2 text-muted-foreground hover:bg-transparent hover:text-foreground',
        className
      )}
    >
      <ArrowLeft className="size-4 shrink-0" aria-hidden />
      {t('back')}
    </Button>
  )
}
