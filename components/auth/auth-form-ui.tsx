'use client'

import { useTranslations } from 'next-intl'

import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

export function RequiredLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Label htmlFor={htmlFor} className={cn('gap-0.5', className)}>
      {children}
      <span className="text-destructive" aria-hidden="true">
        {' '}
        *
      </span>
    </Label>
  )
}

export function OrDivider() {
  const tc = useTranslations('common')

  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <span className="w-full border-t border-border" />
      </div>
      <p className="relative mx-auto w-fit bg-background px-3 text-xs text-muted-foreground">
        {tc('or')}
      </p>
    </div>
  )
}

export function FieldHint({
  id,
  show,
  message,
}: {
  id: string
  show: boolean
  message: string | null
}) {
  if (!show || !message) return null
  return (
    <p id={id} role="alert" className="text-xs leading-snug text-destructive">
      {message}
    </p>
  )
}
