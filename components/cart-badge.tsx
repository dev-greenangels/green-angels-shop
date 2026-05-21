'use client'

import { useEffect, useState } from 'react'

/** Бейдж кількості — лише після mount, щоб не ламати hydration. */
export function CartBadge({ count }: { count: number }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || count <= 0) return null

  return (
    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
      {count}
    </span>
  )
}
