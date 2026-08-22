import { Sprout } from 'lucide-react'

import type { AboutStatItem } from '@/lib/settings/about'
import { cn } from '@/lib/utils'

export function AboutStatsSection({
  title,
  subtitle,
  stats,
  theses,
  className,
}: {
  title: string
  subtitle: string
  stats: AboutStatItem[]
  theses: string[]
  className?: string
}) {
  return (
    <section className={cn('space-y-8', className)}>
      <div className="text-center md:text-left">
        <h2 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">{title}</h2>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {stats.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((item) => (
            <article
              key={`${item.value}-${item.label}`}
              className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-secondary/40 p-5 shadow-sm"
            >
              <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-primary/10 blur-2xl" />
              <p className="font-serif text-3xl font-bold tracking-tight text-primary md:text-4xl">
                {item.value}
              </p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-foreground/80">
                {item.label}
              </p>
              {item.description ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      {theses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {theses.map((text, index) => (
            <div
              key={text}
              className={cn(
                'flex gap-3 rounded-xl border border-border/60 bg-secondary/30 p-4',
                index === theses.length - 1 && 'md:col-span-3 md:justify-center',
              )}
            >
              <Sprout className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p
                className={cn(
                  'text-sm leading-relaxed text-foreground/90',
                  index === theses.length - 1 && 'text-center md:text-lg md:font-medium',
                )}
              >
                {text}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
