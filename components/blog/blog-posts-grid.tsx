'use client'

import type { ReactNode } from 'react'

import { BlogPagination } from '@/components/blog/blog-pagination'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import { Link } from '@/i18n/navigation'
import type { BlogPostListItem } from '@/lib/blog/posts'
import { cn } from '@/lib/utils'

type BlogSort = 'newest' | 'oldest'

function ChipLink({
  active,
  href,
  children,
}: {
  active: boolean
  href: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors sm:text-sm',
        active
          ? 'border-primary bg-primary-gradient text-primary-foreground shadow-sm'
          : 'border-border/80 bg-background text-foreground hover:border-primary/40 hover:bg-muted/60',
      )}
    >
      {children}
    </Link>
  )
}

function sortHref(sort: BlogSort) {
  return sort === 'newest' ? '/blog' : '/blog?sort=oldest'
}

export function BlogPostsGrid({
  posts,
  page,
  totalPages,
  total,
  sort,
}: {
  posts: BlogPostListItem[]
  page: number
  totalPages: number
  total: number
  sort: BlogSort
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 px-1 sm:px-0">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Сортування</p>
          <div className="flex flex-wrap gap-2">
            <ChipLink active={sort === 'newest'} href={sortHref('newest')}>
              За датою: новіші
            </ChipLink>
            <ChipLink active={sort === 'oldest'} href={sortHref('oldest')}>
              За датою: старіші
            </ChipLink>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>

      <BlogPagination page={page} totalPages={totalPages} total={total} sort={sort} />
    </div>
  )
}
