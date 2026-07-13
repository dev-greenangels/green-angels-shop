'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { useSession } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import { useFavoriteActions } from '@/lib/favorites-store'
import { cn } from '@/lib/utils'

type FavoriteButtonProps = {
  productId: string
  className?: string
  size?: 'sm' | 'md'
  tone?: 'default' | 'brand' | 'overlay'
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
} as const

const overlaySizeClasses = {
  sm: 'h-8 w-8 min-h-8 min-w-8',
  md: 'h-9 w-9',
} as const

const iconClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
} as const

const overlayIconClasses = {
  sm: 'h-[18px] w-[18px]',
  md: 'h-5 w-5',
} as const

const toneClasses = {
  default: {
    button: (active: boolean) =>
      cn(
        'rounded-full bg-background/90 shadow-sm backdrop-blur hover:bg-background',
        active && 'text-red-500 hover:text-red-600',
      ),
    icon: (active: boolean) => cn(active && 'fill-current'),
  },
  brand: {
    button: (active: boolean) =>
      cn(
        'rounded-full bg-background/90 shadow-sm backdrop-blur hover:bg-background',
        active ? 'text-primary hover:text-primary' : 'text-muted-foreground hover:text-primary',
      ),
    icon: (active: boolean) => cn(active && 'fill-current'),
  },
  overlay: {
    button: (active: boolean) =>
      cn(
        'rounded-full border border-white/40 bg-white/55 shadow-sm backdrop-blur-[1px]',
        'hover:bg-white/70 active:bg-white/80',
        active ? 'text-primary hover:text-primary' : 'text-foreground/75 hover:text-foreground',
      ),
    icon: (active: boolean) =>
      cn('stroke-[2.25]', active ? 'fill-current' : 'fill-transparent'),
  },
} as const

export function FavoriteButton({
  productId,
  className,
  size = 'sm',
  tone = 'default',
}: FavoriteButtonProps) {
  const t = useTranslations('favorites')
  const { user } = useSession()
  const { isFavorite, toggle } = useFavoriteActions()
  const [pending, setPending] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // До mount — завжди «не в обраному», щоб SSR і перший клієнтський рендер збігались
  // (localStorage підвантажується після гідратації).
  const active = mounted ? isFavorite(productId) : false

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const wasFavorite = isFavorite(productId)
    setPending(true)
    try {
      await toggle(productId, user?.id)
      toast.success(wasFavorite ? t('removed') : t('added'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('updateFailed'))
    } finally {
      setPending(false)
    }
  }

  const toneStyle = toneClasses[tone]

  return (
    <Button
      type="button"
      size="icon"
      variant={tone === 'overlay' ? 'ghost' : 'secondary'}
      disabled={pending}
      aria-label={active ? t('removeAria') : t('addAria')}
      aria-pressed={active}
      className={cn(
        tone === 'overlay' ? overlaySizeClasses[size] : sizeClasses[size],
        toneStyle.button(active),
        className,
      )}
      onClick={(event) => void handleClick(event)}
    >
      <Heart
        className={cn(
          tone === 'overlay' ? overlayIconClasses[size] : iconClasses[size],
          toneStyle.icon(active),
        )}
      />
    </Button>
  )
}
