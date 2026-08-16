import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { BlogPostsGrid } from '@/components/blog/blog-posts-grid'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'
import { SERVICE_UNAVAILABLE_MESSAGE } from '@/lib/api/fetch-result'
import { buildBlogListingMetadata } from '@/lib/blog/metadata'
import { BLOG_PAGE_SIZE, fetchBlogPosts } from '@/lib/blog/posts'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'

type PageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; sort?: string }>
}

function parsePage(value?: string) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}

function parseSort(value?: string): 'newest' | 'oldest' {
  return value === 'oldest' ? 'oldest' : 'newest'
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const { page } = await searchParams
  return buildBlogListingMetadata(locale, { page: parsePage(page) })
}

export default async function BlogPage({ searchParams }: PageProps) {
  const tNav = await getTranslations('nav')
  const params = await searchParams
  const page = parsePage(params.page)
  const sort = parseSort(params.sort)

  let unavailable = false
  let result = {
    items: [] as Awaited<ReturnType<typeof fetchBlogPosts>>['items'],
    total: 0,
    page: 1,
    pageSize: BLOG_PAGE_SIZE,
    totalPages: 1,
  }

  try {
    result = await fetchBlogPosts({ page, pageSize: BLOG_PAGE_SIZE, sort })
  } catch {
    unavailable = true
  }

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className={cn(siteContentShellClassName, 'py-10 md:py-14')}>
          <PublicPageBreadcrumbs
            className="mb-4"
            items={staticPageBreadcrumbs(tNav('blog'))}
          />
          <div className="mb-10 max-w-2xl">
            <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">Блог</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Поради з догляду за рослинами, новини розсадника та корисні матеріали для садівників.
            </p>
          </div>

          {unavailable ? (
            <ServiceUnavailableNotice
              title="Блог тимчасово недоступний"
              message={SERVICE_UNAVAILABLE_MESSAGE}
              className="mx-auto max-w-lg"
            />
          ) : result.items.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">Статей поки немає. Загляньте пізніше.</p>
          ) : (
            <BlogPostsGrid
              posts={result.items}
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              sort={sort}
            />
          )}
        </div>
      </main>
    </>
  )
}
