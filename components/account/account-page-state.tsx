'use client'

import type { ReactNode } from 'react'
import { Loader2, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'

export function AccountPageLoading() {
  const tc = useTranslations('common')

  return (
    <div
      className="flex items-center justify-center gap-2 py-12 text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span>{tc('loading')}</span>
    </div>
  )
}

type AccountPageEmptyProps = {
  icon: LucideIcon
  title: string
  body?: string
  action?: ReactNode
}

export function AccountPageEmpty({ icon: Icon, title, body, action }: AccountPageEmptyProps) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center sm:p-10">
      <Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden />
      <p className="break-words font-medium text-foreground">{title}</p>
      {body ? <p className="mt-1 break-words text-sm text-muted-foreground">{body}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}

type AccountPageErrorProps = {
  message: string
  onRetry?: () => void
}

export function AccountPageError({ message, onRetry }: AccountPageErrorProps) {
  const tc = useTranslations('common')

  return (
    <div
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center sm:p-8"
      role="alert"
    >
      <TriangleAlert className="mx-auto mb-3 h-10 w-10 text-destructive/80" aria-hidden />
      <p className="break-words text-sm font-medium text-foreground">{message}</p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 min-h-11 w-full sm:w-auto"
          onClick={onRetry}
        >
          {tc('retry')}
        </Button>
      ) : null}
    </div>
  )
}
