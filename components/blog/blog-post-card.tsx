import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

import { BlogPostMeta } from '@/components/blog/blog-post-meta'
import { Card, CardContent } from '@/components/ui/card'
import type { BlogPostListItem } from '@/lib/blog/posts'
import { toPublicMediaUrl } from '@/lib/media/public-url'
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
              src={toPublicMediaUrl(post.image)}
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
          <BlogPostMeta author={post.author} createdAt={post.createdAt} size="sm" />
          <h2 className="font-serif text-xl font-semibold leading-tight text-foreground">
            {post.title}
          </h2>
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
