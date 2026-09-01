'use client'

import { resolveCharacteristicIcon } from '@/lib/characteristics/icons'
import { cn } from '@/lib/utils'

export function CharacteristicIconInline({
  icon,
  className,
}: {
  icon: string | null | undefined
  className?: string
}) {
  const Icon = resolveCharacteristicIcon(icon)
  return <Icon className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground', className)} aria-hidden />
}
