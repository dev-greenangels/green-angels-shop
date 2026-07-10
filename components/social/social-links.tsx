import type { StoreSocialLinks } from '@/lib/settings/types'
import { pressableClassName } from '@/lib/pressable'
import { cn } from '@/lib/utils'

import {
  FacebookIcon,
  InstagramIcon,
  TelegramIcon,
  ViberIcon,
  YouTubeIcon,
} from './social-icons'

const SOCIAL_ITEMS = [
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { key: 'facebook', label: 'Facebook', Icon: FacebookIcon },
  { key: 'youtube', label: 'YouTube', Icon: YouTubeIcon },
  { key: 'viberCommunity', label: 'Viber спільнота', Icon: ViberIcon },
  { key: 'telegramCommunity', label: 'Telegram спільнота', Icon: TelegramIcon },
] as const

type SocialLinksProps = {
  social: StoreSocialLinks
  className?: string
  iconClassName?: string
  size?: 'sm' | 'md' | 'lg'
}

export function SocialLinks({ social, className, iconClassName, size = 'md' }: SocialLinksProps) {
  const visible = SOCIAL_ITEMS.filter((item) => {
    const entry = social[item.key]
    return entry?.show && entry.url.trim()
  })

  if (visible.length === 0) return null

  const buttonSize =
    size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-9 w-9' : 'h-11 w-11'

  const iconSize = size === 'lg' ? 'h-6 w-6' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <div className={cn('flex flex-wrap items-center gap-2.5', className)}>
      {visible.map((item) => {
        const entry = social[item.key]
        const Icon = item.Icon
        return (
          <a
            key={item.key}
            href={entry.url.trim()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            title={item.label}
            className={cn(
              pressableClassName,
              'inline-flex items-center justify-center rounded-full border transition-colors',
              buttonSize,
              iconClassName,
            )}
          >
            <Icon className={iconSize} />
          </a>
        )
      })}
    </div>
  )
}

export function hasVisibleSocialLinks(social: StoreSocialLinks): boolean {
  return SOCIAL_ITEMS.some((item) => {
    const entry = social[item.key]
    return entry?.show && entry.url.trim()
  })
}
