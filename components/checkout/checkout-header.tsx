'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CheckoutHeader({
  onBack,
  sticky = false,
}: {
  onBack: () => void
  sticky?: boolean
}) {
  return (
    <header className={cn('border-b bg-background', sticky && 'sticky top-0 z-40')}>
      <div className="container mx-auto max-w-6xl px-3 py-3 sm:px-4">
        <div className="grid h-14 grid-cols-[2.75rem_1fr_2.75rem] items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-ml-1 justify-self-start"
            aria-label="Назад"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Link
            href="/"
            className="col-start-2 row-start-1 flex items-center justify-center justify-self-center px-1"
          >
            <BrandLogo
              alt="Зелені Янголи"
              imgClassName="max-h-9 max-w-[min(148px,44vw)] object-contain object-center"
            />
          </Link>

          <div className="col-start-3 w-11" aria-hidden />
        </div>
      </div>
    </header>
  )
}
