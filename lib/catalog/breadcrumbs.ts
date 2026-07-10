import type { CatalogCategoryBreadcrumb } from '@/lib/catalog/categories'
import { categoryHref, resolveCatalogHref } from '@/lib/catalog/paths'

export type SiteBreadcrumbItem = {
  label: string
  href?: string
}

/** Поточна сторінка головного каталогу. */
export function catalogRootBreadcrumbs(
  label = 'Каталог товарів',
  catalogRootSlug?: string | null,
): SiteBreadcrumbItem[] {
  return [{ label, href: resolveCatalogHref(catalogRootSlug) }]
}

function categoryPathToItems(
  path: CatalogCategoryBreadcrumb[],
  options?: { linkLast?: boolean },
): SiteBreadcrumbItem[] {
  const linkLast = options?.linkLast ?? false

  return path.map((crumb, index) => {
    const isLast = index === path.length - 1
    return {
      label: crumb.name,
      href: !isLast || linkLast ? categoryHref(crumb.slug) : undefined,
    }
  })
}

function withCatalogRootEntry(
  path: CatalogCategoryBreadcrumb[],
  catalogRootSlug: string | null | undefined,
  options?: { linkLast?: boolean },
): SiteBreadcrumbItem[] {
  if (!catalogRootSlug) {
    return categoryPathToItems(path, options)
  }

  const rootCrumb = path.find((crumb) => crumb.slug === catalogRootSlug)
  const publicPath = path.filter((crumb) => crumb.slug !== catalogRootSlug)

  if (!rootCrumb) {
    return categoryPathToItems(publicPath, options)
  }

  return [
    { label: rootCrumb.name, href: resolveCatalogHref(catalogRootSlug) },
    ...categoryPathToItems(publicPath, options),
  ]
}

export function categoryPageBreadcrumbs(
  path: CatalogCategoryBreadcrumb[],
  catalogRootSlug?: string | null,
): SiteBreadcrumbItem[] {
  return withCatalogRootEntry(path, catalogRootSlug)
}

/** Одна сторінка без батьківських рівнів (окрім «Головна»). */
export function staticPageBreadcrumbs(label: string): SiteBreadcrumbItem[] {
  return [{ label }]
}

export function productPageBreadcrumbs(
  categoryPath: CatalogCategoryBreadcrumb[],
  productName: string,
  catalogRootSlug?: string | null,
): SiteBreadcrumbItem[] {
  return [
    ...withCatalogRootEntry(categoryPath, catalogRootSlug, { linkLast: true }),
    { label: productName },
  ]
}
