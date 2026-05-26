'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

/** Бейдж кількості — лише після mount, щоб не ламати hydration. */
export function CartBadge({ count }: { count: number }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || count <= 0) return null

  const label = count > 999 ? '999+' : String(count)
  const digitCount = label.length

  return (
    <span
      className={cn(
        'pointer-events-none absolute z-10 flex items-center justify-center rounded-full',
        'bg-primary font-bold leading-none text-primary-foreground tabular-nums',
        'ring-2 ring-background',
        digitCount <= 1 && '-top-2 -right-2 h-5 min-w-5 text-xs',
        digitCount === 2 && '-top-2 -right-2 h-5 min-w-[22px] px-1.5 text-xs',
        digitCount >= 3 && '-top-2 -right-2 h-5 min-w-[34px] px-1.5 text-xs'
      )}
      aria-hidden
    >
      {label}
    </span>
  )
}
