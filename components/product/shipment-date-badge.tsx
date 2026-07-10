import { cn } from '@/lib/utils'

const shipmentBadgeClassName = cn(
  'inline-flex max-w-fit rounded-lg border border-amber-300/80 bg-amber-100/95',
  'font-semibold text-amber-950',
  'shadow-[0_0_0_3px_rgba(251,191,36,0.15)] ring-1 ring-amber-200/80',
  'dark:border-amber-500/40 dark:bg-amber-950/45 dark:text-amber-50 dark:ring-amber-500/25',
)

const shipmentFooterClassName = cn(
  'flex w-full items-center justify-center border-t border-amber-300/80',
  'bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100',
  'px-2 py-2 text-center text-xs font-semibold text-amber-950',
  'dark:border-amber-500/35 dark:from-amber-950/55 dark:via-amber-950/40 dark:to-amber-950/55 dark:text-amber-50',
)

export function ShipmentDateBadge({
  date,
  className,
  fullWidth = false,
  block = false,
}: {
  date: string
  className?: string
  fullWidth?: boolean
  /** На всю ширину батьківського блоку, стиль звичайного бейджа, текст по центру. */
  block?: boolean
}) {
  const Tag = fullWidth || block ? 'div' : 'span'

  return (
    <Tag
      className={cn(
        fullWidth ? shipmentFooterClassName : shipmentBadgeClassName,
        block && 'flex w-full justify-center text-center',
        !fullWidth && 'px-2 py-0.5 text-xs',
        !fullWidth && !block && 'inline-flex',
        className,
      )}
    >
      Відвантаження з {date}
    </Tag>
  )
}
