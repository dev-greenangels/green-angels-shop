import type { ComponentProps } from 'react'
import { Bell } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const notifyAvailabilityButtonClassName =
  'border-amber-600/35 bg-amber-50 text-amber-950 hover:bg-amber-100 hover:text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/35 dark:text-amber-50 dark:hover:bg-amber-950/55'

type NotifyAvailabilityButtonProps = Omit<ComponentProps<typeof Button>, 'variant' | 'children'> & {
  fullWidth?: boolean
  compact?: boolean
}

export function NotifyAvailabilityButton({
  className,
  size = 'default',
  fullWidth = false,
  compact = false,
  ...props
}: NotifyAvailabilityButtonProps) {
  const t = useTranslations('product')

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={cn(
        notifyAvailabilityButtonClassName,
        'gap-1.5 text-xs font-semibold',
        compact && 'h-8 px-2',
        fullWidth && 'w-full max-w-full',
        className,
      )}
      {...props}
    >
      <Bell className={cn('shrink-0', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
      <span className="min-w-0 truncate">{t('notifyAvailabilityShort')}</span>
    </Button>
  )
}
