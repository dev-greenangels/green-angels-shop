import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'
import { SERVICE_UNAVAILABLE_MESSAGE } from '@/lib/api/fetch-result'
import { fetchBlogPosts } from '@/lib/blog/posts'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Блог · Зелені Янголи',
  description: 'Корисні поради, новини розсадника та догляд за рослинами.',
}

export default async function BlogPage() {
  const tNav = await getTranslations('nav')
  let posts: Awaited<ReturnType<typeof fetchBlogPosts>> = []
  let unavailable = false

  try {
    posts = await fetchBlogPosts()
  } catch {
    unavailable = true
  }

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-gradient-to-br from-secondary via-background to-accent">
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
          ) : posts.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">Статей поки немає. Загляньте пізніше.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
