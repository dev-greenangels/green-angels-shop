import { Percent, Sparkles, Tag, Gift } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type HeroPromoBadge = {
  label: string
  href: string
  icon: LucideIcon
}

/** Корисні промо-плашки на hero — ведуть на сторінки з акціями. */
export const HERO_PROMO_BADGES: HeroPromoBadge[] = [
  {
    label: 'Акції та знижки',
    href: '/promotions',
    icon: Percent,
  },
  {
    label: 'Новинки сезону',
    href: '/new-arrivals',
    icon: Sparkles,
  },
  {
    label: 'Оптові пропозиції',
    href: '/promotions',
    icon: Tag,
  },
  {
    label: 'Подарунки до замовлення',
    href: '/promotions',
    icon: Gift,
  },
]
