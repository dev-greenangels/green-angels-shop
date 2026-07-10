'use client'

import { Fragment, useMemo } from 'react'
import { ChevronLeft } from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Link } from '@/i18n/navigation'
import type { SiteBreadcrumbItem } from '@/lib/catalog/breadcrumbs'
import { cn } from '@/lib/utils'

type SiteBreadcrumbsProps = {
  items: SiteBreadcrumbItem[]
  homeLabel?: string
  loading?: boolean
  className?: string
}

function resolveMobileBreadcrumb(items: SiteBreadcrumbItem[], homeLabel: string) {
  if (!items.length) {
    return null
  }

  const current = items[items.length - 1]
  const parent = items.length > 1 ? items[items.length - 2] : null

  return {
    currentLabel: current.label,
    backHref: parent?.href ?? '/',
    backLabel: parent?.label ?? homeLabel,
  }
}

function MobileBreadcrumbSkeleton() {
  return (
    <div className="flex min-w-0 items-center gap-2 md:hidden" aria-hidden>
      <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="h-4 max-w-[12rem] flex-1 animate-pulse rounded bg-muted" />
    </div>
  )
}

export function SiteBreadcrumbs({
  items,
  homeLabel = 'Головна',
  className,
  loading = false,
}: SiteBreadcrumbsProps) {
  const mobile = useMemo(() => resolveMobileBreadcrumb(items, homeLabel), [homeLabel, items])

  return (
    <div className={className}>
      {loading || !mobile ? (
        <MobileBreadcrumbSkeleton />
      ) : (
        <div className="flex min-w-0 items-center gap-0.5 md:hidden">
          <Link
            href={mobile.backHref}
            className={cn(
              'inline-flex min-w-0 flex-1 items-center gap-0.5 rounded-md py-1 pr-2',
              'text-sm font-medium text-foreground transition-colors active:text-primary',
            )}
            aria-label={`Назад до «${mobile.backLabel}»`}
          >
            <ChevronLeft className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <span className="truncate">{mobile.backLabel}</span>
          </Link>
        </div>
      )}

      {loading ? (
        <div className="hidden h-5 max-w-lg animate-pulse rounded bg-muted md:block" aria-hidden />
      ) : (
        <Breadcrumb className="hidden md:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">{homeLabel}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {items.map((item, index) => (
              <Fragment key={`${item.label}-${index}`}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage
                      className="max-w-md truncate"
                      title={item.label}
                    >
                      {item.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </div>
  )
}
