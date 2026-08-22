import { sanitizeCmsHtml, cmsHtmlHasTags } from '@/lib/about/safe-html'
import { cn } from '@/lib/utils'

export function AboutCmsHtml({
  html,
  className,
}: {
  html: string
  className?: string
}) {
  const safe = sanitizeCmsHtml(html).trim()
  if (!safe) return null

  if (!cmsHtmlHasTags(safe)) {
    return (
      <div className={cn('space-y-4', className)}>
        {safe.split(/\n{2,}/).map((paragraph, index) => (
          <p key={index} className="text-lg leading-relaxed text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'space-y-4 text-lg leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_strong]:text-foreground',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
