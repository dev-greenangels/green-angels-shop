import Image from 'next/image'
import { ArrowLeft, CalendarDays } from 'lucide-react'

import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { Button } from '@/components/ui/button'
import { ServiceUnavailableShell } from '@/components/service-unavailable-shell'
import { ProductNotFoundError } from '@/lib/api/fetch-result'
import { fetchBlogPostBySlug } from '@/lib/blog/posts'
import { formatBlogDate } from '@/lib/blog/posts'
import { Link } from '@/i18n/navigation'
import { siteContentShellNarrowClassName } from '@/lib/layout/site-shell'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'
import { notFound } from 'next/navigation'


type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  try {
    const post = await fetchBlogPostBySlug(slug)
    return {
      title: `${post.title} · Блог · Зелені Янголи`,
      description: post.excerpt,
    }
  } catch {
    return { title: 'Стаття · Зелені Янголи' }
  }
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

  const paragraphs = post.content.split(/\n{2,}/).filter(Boolean)

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-gradient-to-br from-secondary via-background to-accent">
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

          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {formatBlogDate(post.createdAt)}
          </div>

          <h1 className="font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl">
            {post.title}
          </h1>

          {post.image ? (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-sm">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          ) : null}

          <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mb-4 text-base leading-7 text-foreground/90">
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      </main>
    </>
  )
}
