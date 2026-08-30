import { ArrowRight } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

type HomeSectionCtaProps = {
  href: ComponentProps<typeof Link>['href']
  children: ReactNode
  className?: string
}

export function HomeSectionCta({ href, children, className }: HomeSectionCtaProps) {
  return (
    <Link href={href} className={cn('home-section-cta group', className)}>
      <span className="home-section-cta__sheen" aria-hidden />
      <span className="home-section-cta__content">
        <span className="home-section-cta__label">{children}</span>
        <ArrowRight className="home-section-cta__arrow stroke-[2.25]" aria-hidden />
      </span>
    </Link>
  )
}
