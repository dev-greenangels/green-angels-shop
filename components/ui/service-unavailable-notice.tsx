import { AlertTriangle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SERVICE_UNAVAILABLE_MESSAGE } from '@/lib/api/fetch-result'
import { cn } from '@/lib/utils'

type ServiceUnavailableNoticeProps = {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
  compact?: boolean
}

export function ServiceUnavailableNotice({
  title = 'Тимчасово недоступно',
  message = SERVICE_UNAVAILABLE_MESSAGE,
  onRetry,
  className,
  compact = false,
}: ServiceUnavailableNoticeProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        compact
          ? 'gap-2 py-8'
          : 'gap-4 rounded-2xl border border-border/60 bg-muted/30 px-6 py-10 shadow-sm',
        className,
      )}
    >
      <AlertTriangle
        className={cn('text-muted-foreground', compact ? 'h-5 w-5' : 'h-10 w-10')}
        aria-hidden
      />
      <div className="space-y-2">
        <p className={cn('font-medium text-foreground', compact ? 'text-sm' : 'text-lg')}>
          {title}
        </p>
        <p className={cn('text-muted-foreground', compact ? 'text-sm' : 'text-base')}>
          {message}
        </p>
      </div>
      {onRetry ? (
        <Button variant="outline" size={compact ? 'sm' : 'default'} onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Спробувати знову
        </Button>
      ) : null}
    </div>
  )
}
