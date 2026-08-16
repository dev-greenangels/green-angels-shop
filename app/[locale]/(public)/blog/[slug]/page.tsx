import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { BlogPostMeta } from '@/components/blog/blog-post-meta'
import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { ServiceUnavailableShell } from '@/components/service-unavailable-shell'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { ProductNotFoundError } from '@/lib/api/fetch-result'
import { buildBlogPostMetadata } from '@/lib/blog/metadata'
import { fetchBlogPostBySlug } from '@/lib/blog/posts'
import { siteContentShellNarrowClassName } from '@/lib/layout/site-shell'
import { toPublicMediaUrl } from '@/lib/media/public-url'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

type PageProps = {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params
  return buildBlogPostMetadata(locale, slug)
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params

  let post: Awaited<ReturnType<typeof fetchBlogPostBySlug>> | null = null
  let unavailable = false
  try {
    post = await fetchBlogPostBySlug(slug)
  } catch (err) {
    if (err instanceof ProductNotFoundError) {
      notFound()
    }
    unavailable = true
  }

  if (unavailable) {
    return (
      <ServiceUnavailableShell
        title="Стаття тимчасово недоступна"
        message="Не вдалося завантажити статтю. Спробуйте оновити сторінку пізніше."
      />
    )
  }

  if (!post) {
    notFound()
  }

  const tNav = await getTranslations('nav')
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(post.content)

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <article className={cn(siteContentShellNarrowClassName, 'py-10 md:py-14')}>
          <PublicPageBreadcrumbs
            className="mb-6"
            items={[
              { label: tNav('blog'), href: '/blog' },
              { label: post.title },
            ]}
          />
          <Button variant="ghost" size="sm" className="-ml-2 mb-6" asChild>
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              До блогу
            </Link>
          </Button>

          <BlogPostMeta author={post.author} createdAt={post.createdAt} className="mb-4" />

          <h1 className="font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl">
            {post.title}
          </h1>

          {post.image ? (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-sm">
              <Image
                src={toPublicMediaUrl(post.image)}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          ) : null}

          {looksLikeHtml ? (
            <div
              className="prose prose-neutral mt-8 max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
              {post.content
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p
                    key={`${index}-${paragraph.slice(0, 24)}`}
                    className="mb-4 text-base leading-7 text-foreground/90"
                  >
                    {paragraph}
                  </p>
                ))}
            </div>
          )}

          <footer className="mt-10 rounded-2xl border border-border/60 bg-background/70 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Автор матеріалу
            </p>
            <BlogPostMeta author={post.author} createdAt={post.createdAt} className="mt-2" />
          </footer>
        </article>
      </main>
    </>
  )
}
