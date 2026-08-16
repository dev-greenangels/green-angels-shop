import { cn } from '@/lib/utils'

export function FavoritesBadge({ count }: { count: number }) {
  if (count <= 0) return null

  const label = count > 99 ? '99+' : String(count)
  const digitCount = label.length

  return (
    <span
      className={cn(
        'pointer-events-none absolute z-10 flex items-center justify-center rounded-full',
        'bg-primary-gradient text-[12px] font-bold leading-none text-primary-foreground tabular-nums',
        digitCount <= 1 && '-right-2 -top-2 h-5 min-w-5',
        digitCount === 2 && '-right-2 -top-2 h-5 min-w-[22px] px-1.5',
        digitCount >= 3 && '-right-2 -top-2 h-5 min-w-[26px] px-1.5',
      )}
      aria-hidden
    >
      {label}
    </span>
  )
}
