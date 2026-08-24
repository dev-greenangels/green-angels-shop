'use client'

import type { ReactNode } from 'react'

import { ClientPublicPageBreadcrumbs } from '@/components/client-public-page-breadcrumbs'
import { cn } from '@/lib/utils'
import type { SiteBreadcrumbItem } from '@/lib/catalog/breadcrumbs'
import { siteContentShellClassName } from '@/lib/layout/site-shell'

type CatalogPageHeaderProps = {
  breadcrumbs: SiteBreadcrumbItem[]
  breadcrumbsLoading?: boolean
  title: string
  description?: ReactNode
  footer?: ReactNode
}

export function CatalogPageHeader({
  breadcrumbs,
  breadcrumbsLoading = false,
  title,
  description,
  footer,
}: CatalogPageHeaderProps) {
  return (
    <>
      <div className="border-b border-border/60 bg-transparent">
        <div className={cn(siteContentShellClassName, 'py-3 md:py-3.5')}>
          <ClientPublicPageBreadcrumbs items={breadcrumbs} loading={breadcrumbsLoading} />
        </div>
      </div>

      <div className="border-b border-border/40 bg-transparent py-8 md:py-10">
        <div className={siteContentShellClassName}>
          <div className="w-full rounded-2xl border border-primary/15 bg-[rgba(232,240,227,0.68)] px-5 py-4 shadow-sm backdrop-blur-[2px] sm:px-6 sm:py-5">
            <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
                {title}
              </h1>
              {footer}
            </div>
            {description ? (
              <div className="text-muted-foreground">{description}</div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
