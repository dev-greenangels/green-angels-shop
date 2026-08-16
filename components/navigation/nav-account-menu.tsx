'use client'

import { LogOut, Settings, User } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link } from '@/i18n/navigation'
import { buildLogoutHref } from '@/lib/auth/logout-redirect'
import { cn } from '@/lib/utils'

type NavAccountMenuProps = {
  isLoggedIn: boolean
  logoutHref: string
  onLogout: () => void
  className?: string
}

export function NavAccountMenu({
  isLoggedIn,
  logoutHref,
  onLogout,
  className,
}: NavAccountMenuProps) {
  const t = useTranslations('nav')
  const tc = useTranslations('common')

  if (!isLoggedIn) {
    return (
      <Link href="/auth/login">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={tc('account')}
          className={className}
        >
          <User className="h-5 w-5" strokeWidth={2} />
        </Button>
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={tc('account')}
          className={cn('data-[state=open]:bg-primary/10', className)}
        >
          <User className="h-5 w-5 fill-primary/25 text-primary" strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href="/account">
            <User className="h-4 w-4" />
            {t('accountCabinet')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/settings">
            <Settings className="h-4 w-4" />
            {t('accountSettings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={logoutHref} onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
