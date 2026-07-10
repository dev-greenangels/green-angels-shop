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
      <div className="border-b border-border/60 bg-background">
        <div className={cn(siteContentShellClassName, 'py-3 md:py-3.5')}>
          <ClientPublicPageBreadcrumbs items={breadcrumbs} loading={breadcrumbsLoading} />
        </div>
      </div>

      <div className="border-b border-border/40 bg-secondary/30 py-8 md:py-10">
        <div className={siteContentShellClassName}>
          <h1 className="mb-2 font-serif text-3xl font-bold text-foreground md:text-4xl">
            {title}
          </h1>
          {description ? (
            <div className="text-muted-foreground">{description}</div>
          ) : null}
          {footer ? <div className="mt-2">{footer}</div> : null}
        </div>
      </div>
    </>
  )
}
