import Image from 'next/image'
import { ArrowRight, CalendarDays } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type { BlogPostListItem } from '@/lib/blog/posts'
import { formatBlogDate } from '@/lib/blog/posts'
import { Link } from '@/i18n/navigation'
import { pressableClassName } from '@/lib/pressable'
import { cn } from '@/lib/utils'

export function BlogPostCard({ post }: { post: BlogPostListItem }) {
  return (
    <Card className="overflow-hidden border-border/80 bg-background/80 shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/blog/${post.slug}`} className={cn(pressableClassName, 'block')}>
        <div className="relative aspect-[16/9] bg-muted">
          {post.image ? (
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary via-background to-accent text-sm text-muted-foreground">
              Зелені Янголи
            </div>
          )}
        </div>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatBlogDate(post.createdAt)}
          </div>
          <h2 className="font-serif text-xl font-semibold leading-tight text-foreground">{post.title}</h2>
          <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
          <span className="inline-flex items-center text-sm font-medium text-primary">
            Читати далі
            <ArrowRight className="ml-1 h-4 w-4" />
          </span>
        </CardContent>
      </Link>
    </Card>
  )
}
